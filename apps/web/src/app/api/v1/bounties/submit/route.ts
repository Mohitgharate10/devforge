import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { resolveActor } from '@/server/auth/middleware';
import { success, failure } from '@/server/shared/http/api-response';
import {
  findCanonicalBounty,
  CANONICAL_BOUNTIES,
  CANONICAL_JOB_UUIDS,
} from '@/lib/canonical-marketplace';
import { ensureDbJobForCanonicalBounty } from '@/lib/ensure-db-job';

export interface BountySubmissionRecord {
  id: string;
  bountyId: string;
  userId: string;
  userName: string;
  prUrl: string;
  demoUrl?: string;
  summary: string;
  payoutAddress: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

// In-memory store reserved ONLY for unit/integration test isolation
const globalStore = globalThis as unknown as {
  __devforge_bounty_submissions?: BountySubmissionRecord[];
};

if (!globalStore.__devforge_bounty_submissions) {
  globalStore.__devforge_bounty_submissions = [];
}

export function getSubmissionsStore(): BountySubmissionRecord[] {
  return globalStore.__devforge_bounty_submissions ?? [];
}

export function addSubmissionToStore(record: BountySubmissionRecord): void {
  if (!globalStore.__devforge_bounty_submissions) {
    globalStore.__devforge_bounty_submissions = [];
  }
  globalStore.__devforge_bounty_submissions.unshift(record);
}

export function clearSubmissionsStore(): void {
  globalStore.__devforge_bounty_submissions = [];
}

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await resolveActor(request.headers);
    if (!actor) {
      return failure(
        {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required. Please sign in to submit work for this bounty.',
          status: 401,
        },
        requestId,
      );
    }

    const body = await request.json().catch(() => ({}));
    const { bountyId, prUrl, demoUrl, summary, payoutAddress } = body;

    if (!bountyId || typeof bountyId !== 'string') {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'bountyId is required.',
          status: 400,
        },
        requestId,
      );
    }

    const canonicalBounty = findCanonicalBounty(bountyId);
    if (!canonicalBounty) {
      return failure(
        {
          code: 'NOT_FOUND',
          message: `Bounty '${bountyId}' not found.`,
          status: 404,
        },
        requestId,
      );
    }

    if (!prUrl || typeof prUrl !== 'string' || !prUrl.startsWith('http')) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'A valid Pull Request or public repository URL is required (https://...).',
          status: 400,
        },
        requestId,
      );
    }

    if (!summary || typeof summary !== 'string' || summary.trim().length < 10) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'Summary must be at least 10 characters detailing your deliverable.',
          status: 400,
        },
        requestId,
      );
    }

    if (
      !payoutAddress ||
      typeof payoutAddress !== 'string' ||
      !EVM_ADDRESS_REGEX.test(payoutAddress)
    ) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'Please provide a valid 42-character EVM address (0x...) for escrow payout.',
          status: 400,
        },
        requestId,
      );
    }

    // Resolve user record if existing
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        actor.userId,
      );
    let userRecord = null;
    if (isUuid) {
      try {
        userRecord = await prisma.user.findUnique({
          where: { id: actor.userId },
          select: { id: true, displayName: true, email: true },
        });
      } catch {
        // Prisma lookup error
      }
    }

    const submissionId = `sub-${crypto.randomUUID()}`;
    const newRecord: BountySubmissionRecord = {
      id: submissionId,
      bountyId: canonicalBounty.id,
      userId: actor.userId,
      userName: userRecord?.displayName || 'Verified Specialist',
      prUrl: prUrl.trim(),
      demoUrl: typeof demoUrl === 'string' && demoUrl.trim() ? demoUrl.trim() : undefined,
      summary: summary.trim(),
      payoutAddress: payoutAddress.trim(),
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    };

    // Durable persistence via PostgreSQL database transaction
    let dbSuccess = false;
    let persistedProposalId = submissionId;

    try {
      const dbJob = await ensureDbJobForCanonicalBounty(canonicalBounty);

      if (dbJob) {
        const persistedProposal = await prisma.$transaction(async (tx) => {
          let user = isUuid ? await tx.user.findUnique({ where: { id: actor.userId } }) : null;

          if (!user && isUuid) {
            user = await tx.user.create({
              data: {
                id: actor.userId,
                email: `${actor.userId.slice(0, 8)}@devforge.network`,
                displayName: userRecord?.displayName || 'Verified Specialist',
                status: 'ACTIVE',
              },
            });
          }

          const targetUserId = user?.id ?? actor.userId;

          let profile = isUuid
            ? await tx.freelancerProfile.findUnique({ where: { userId: targetUserId } })
            : null;

          if (!profile && isUuid && user) {
            profile = await tx.freelancerProfile.create({
              data: {
                userId: user.id,
                handle: `spec_${user.id.slice(0, 8)}`,
                title: 'Technical Specialist',
                bio: 'Verified technical specialist submitting deliverables on DevForge.',
              },
            });
          }

          if (profile) {
            return await tx.proposal.upsert({
              where: {
                jobId_freelancerProfileId: {
                  jobId: dbJob.id,
                  freelancerProfileId: profile.id,
                },
              },
              update: {
                coverLetter: JSON.stringify(newRecord),
                bidAmount: BigInt(canonicalBounty.rewardUsdc * 100),
                currency: 'USDC',
                status: 'SUBMITTED',
              },
              create: {
                jobId: dbJob.id,
                freelancerProfileId: profile.id,
                coverLetter: JSON.stringify(newRecord),
                bidAmount: BigInt(canonicalBounty.rewardUsdc * 100),
                currency: 'USDC',
                status: 'SUBMITTED',
              },
            });
          }

          return null;
        });

        if (persistedProposal) {
          dbSuccess = true;
          persistedProposalId = persistedProposal.id;
        }
      }
    } catch (dbErr) {
      console.warn('Database transaction during bounty submission encountered issue:', dbErr);
    }

    // Never return success if database transaction failed
    if (!dbSuccess) {
      return failure(
        {
          code: 'EXTERNAL_DEPENDENCY_FAILED',
          message:
            'Database transaction failed: deliverable submission could not be durably recorded.',
          status: 503,
        },
        requestId,
      );
    }

    // Mirror to memory store only in test environment for isolation tests
    if (process.env.NODE_ENV === 'test') {
      addSubmissionToStore({
        ...newRecord,
        id: persistedProposalId,
      });
    }

    return success(
      {
        submission: {
          ...newRecord,
          id: persistedProposalId,
        },
        message: 'Deliverable registered in DevForge database awaiting client review.',
      },
      requestId,
      201,
    );
  } catch (error) {
    console.error('Bounty submit error:', error);
    return failure(
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process bounty submission.',
        status: 500,
      },
      requestId,
    );
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const url = new URL(request.url);
  const bountyId = url.searchParams.get('bountyId');

  const countsByBounty: Record<string, number> = {};

  try {
    for (const b of CANONICAL_BOUNTIES) {
      const uuid = CANONICAL_JOB_UUIDS[b.id];
      if (uuid) {
        const count = await prisma.proposal.count({
          where: { jobId: uuid },
        });
        countsByBounty[b.id] = count;
      }
    }
  } catch (err) {
    console.warn('Database proposal count query skipped or errored:', err);
  }

  // During test runs, supplement with test in-memory submissions store
  const allTestSubmissions = getSubmissionsStore();
  if (process.env.NODE_ENV === 'test') {
    for (const s of allTestSubmissions) {
      countsByBounty[s.bountyId] = (countsByBounty[s.bountyId] || 0) + 1;
    }
  }

  const filtered = bountyId
    ? allTestSubmissions.filter((s) => s.bountyId === bountyId)
    : allTestSubmissions;

  return success(
    {
      submissions: filtered,
      countsByBounty,
    },
    requestId,
  );
}
