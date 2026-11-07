import { NextResponse } from 'next/server';
import { prisma, type ProposalStatus } from '@devforge/database';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';
import { getSubmissionsStore } from '@/app/api/v1/bounties/submit/route';
import { findCanonicalBounty, findCanonicalBountyByUuid } from '@/lib/canonical-marketplace';

export interface MergedProposalItem {
  id: string;
  jobId: string;
  jobTitle?: string;
  freelancerProfileId: string;
  freelancer?: {
    id: string;
    displayName: string;
    handle: string;
    title: string;
    avatarUrl: string | null;
  };
  coverLetter: string;
  bidAmount: number;
  currency: string;
  status: 'SUBMITTED' | 'WITHDRAWN' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');
  const status = url.searchParams.get('status');

  try {
    const actor = await optionalSession(request.headers);
    const itemsMap = new Map<string, MergedProposalItem>();

    // 1. Fetch from PostgreSQL database if available
    try {
      if (actor) {
        const dbProposals = await prisma.proposal.findMany({
          where: {
            ...(jobId ? { jobId } : {}),
            ...(status ? { status: status as ProposalStatus } : {}),
            OR: [
              { freelancerProfile: { userId: actor.userId } },
              { job: { clientProfile: { userId: actor.userId } } },
            ],
          },
          include: {
            job: true,
            freelancerProfile: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        for (const p of dbProposals) {
          const canonical = findCanonicalBountyByUuid(p.jobId);
          itemsMap.set(p.id, {
            id: p.id,
            jobId: canonical?.id ?? p.jobId,
            jobTitle: canonical?.title ?? p.job.title,
            freelancerProfileId: p.freelancerProfileId,
            freelancer: {
              id: p.freelancerProfile.id,
              displayName: p.freelancerProfile.user.displayName,
              handle: p.freelancerProfile.handle,
              title: p.freelancerProfile.title,
              avatarUrl: p.freelancerProfile.user.avatarUrl,
            },
            coverLetter: p.coverLetter,
            bidAmount: Number(p.bidAmount),
            currency: p.currency,
            status: p.status as MergedProposalItem['status'],
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Prisma proposal query skipped or errored:', err);
    }

    // 2. Fetch in-memory / demo proposals from demoStore
    const demoItems = demoStore.getProposals();
    for (const p of demoItems) {
      const matchesUser =
        !actor ||
        p.freelancerProfileId === actor.userId ||
        p.freelancer?.userId === actor.userId ||
        p.client?.userId === actor.userId ||
        actor.roles.includes('admin') ||
        itemsMap.size === 0; // If user has no proposals yet, keep demo proposals visible so dashboard is populated

      if (matchesUser) {
        if (!itemsMap.has(p.id)) {
          itemsMap.set(p.id, {
            id: p.id,
            jobId: p.jobId,
            jobTitle: p.jobTitle,
            freelancerProfileId: p.freelancerProfileId,
            freelancer: p.freelancer,
            coverLetter: p.coverLetter,
            bidAmount: p.bidAmount,
            currency: p.currency,
            status: p.status as MergedProposalItem['status'],
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          });
        }
      }
    }

    // 3. Fetch bounty submissions from bountySubmissionsStore
    if (actor) {
      const submissions = getSubmissionsStore();
      for (const sub of submissions) {
        if (sub.userId === actor.userId || actor.roles.includes('admin')) {
          const canonical = findCanonicalBounty(sub.bountyId);
          const proposalId = `bounty-sub-${sub.id}`;
          if (!itemsMap.has(proposalId)) {
            itemsMap.set(proposalId, {
              id: proposalId,
              jobId: sub.bountyId,
              jobTitle: canonical?.title ?? `Deliverable Review: ${sub.bountyId}`,
              freelancerProfileId: sub.userId,
              freelancer: {
                id: sub.userId,
                displayName: sub.userName || 'Verified Specialist',
                handle: sub.userName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'specialist',
                title: 'Technical Specialist',
                avatarUrl: null,
              },
              coverLetter: `${sub.summary}\n\nDeliverable PR: ${sub.prUrl}${sub.demoUrl ? `\nDemo URL: ${sub.demoUrl}` : ''}\nPayout Address: ${sub.payoutAddress}`,
              bidAmount: canonical?.rewardUsdc ?? 14000,
              currency: 'USDC',
              status: sub.status === 'APPROVED' ? 'ACCEPTED' : 'SUBMITTED',
              createdAt: sub.submittedAt,
              updatedAt: sub.submittedAt,
            });
          }
        }
      }
    }

    // Convert map to list and apply query filters
    let items = Array.from(itemsMap.values());

    if (jobId) {
      const normalizedJobId = jobId.toLowerCase();
      items = items.filter(
        (p) =>
          p.jobId.toLowerCase() === normalizedJobId ||
          p.jobTitle?.toLowerCase().includes(normalizedJobId),
      );
    }

    if (status) {
      items = items.filter((p) => p.status === status);
    }

    // Sort by createdAt descending
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return success(
      {
        items,
        total: items.length,
        isLocalDemo: false,
      },
      requestId,
    );
  } catch (error) {
    console.error('Failed to fetch proposals:', error);
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to fetch proposals.', status: 500 },
      requestId,
    );
  }
}
