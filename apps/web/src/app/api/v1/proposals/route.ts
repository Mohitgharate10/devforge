import { NextResponse } from 'next/server';
import { prisma, type ProposalStatus } from '@devforge/database';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');
  const status = url.searchParams.get('status');

  try {
    const actor = await optionalSession();

    try {
      if (actor) {
        // Query proposals matching freelancer profile or client's jobs
        const proposals = await prisma.proposal.findMany({
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

        const items = proposals.map((p) => ({
          id: p.id,
          jobId: p.jobId,
          jobTitle: p.job.title,
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
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }));

        return success(
          {
            items,
            total: items.length,
            isLocalDemo: false,
          },
          requestId,
        );
      }
    } catch {
      // Database offline - fallback to demo store
    }

    // Local demo proposals fallback
    let demoItems = demoStore.getProposals();
    if (jobId) {
      demoItems = demoItems.filter((p) => p.jobId === jobId);
    }
    if (status) {
      demoItems = demoItems.filter((p) => p.status === status);
    }

    const items = demoItems.map((p) => ({
      id: p.id,
      jobId: p.jobId,
      jobTitle: p.jobTitle,
      freelancerProfileId: p.freelancerProfileId,
      freelancer: p.freelancer,
      coverLetter: p.coverLetter,
      bidAmount: p.bidAmount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return success(
      {
        items,
        total: items.length,
        isLocalDemo: true,
      },
      requestId,
    );
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to fetch proposals.', status: 500 },
      requestId,
    );
  }
}
