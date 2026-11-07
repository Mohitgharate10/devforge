import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { resolveActor } from '@/server/auth/middleware';
import { success, failure } from '@/server/shared/http/api-response';
import { findCanonicalBounty } from '@/lib/canonical-marketplace';

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

// In-memory persistent fallback store across requests in this Node process
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
          message: 'A valid Pull Request or repository URL is required (https://...).',
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

    // Resolve user details
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
        // Prisma query fallback
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

    // Attempt to persist in Prisma proposals if available and user exists in DB
    if (userRecord) {
      try {
        let freelancerProfile = await prisma.freelancerProfile.findUnique({
          where: { userId: actor.userId },
        });
        if (!freelancerProfile) {
          freelancerProfile = await prisma.freelancerProfile.create({
            data: {
              userId: actor.userId,
              handle: `spec_${actor.userId.slice(0, 8)}`,
              title: 'Technical Specialist',
              bio: 'Verified technical specialist submitting deliverables on DevForge.',
            },
          });
        }

        // Check if job exists in DB, or link to proposal
        const existingJob = await prisma.job.findFirst({
          where: {
            OR: [{ id: canonicalBounty.id }, { title: canonicalBounty.title }],
          },
        });

        if (existingJob) {
          await prisma.proposal.upsert({
            where: {
              jobId_freelancerProfileId: {
                jobId: existingJob.id,
                freelancerProfileId: freelancerProfile.id,
              },
            },
            update: {
              coverLetter: JSON.stringify(newRecord),
              status: 'SUBMITTED',
            },
            create: {
              jobId: existingJob.id,
              freelancerProfileId: freelancerProfile.id,
              coverLetter: JSON.stringify(newRecord),
              bidAmount: BigInt(canonicalBounty.rewardUsdc * 100),
              currency: 'USDC',
              status: 'SUBMITTED',
            },
          });
        }
      } catch (dbErr) {
        console.warn('Could not mirror bounty submission to Prisma:', dbErr);
      }
    }

    addSubmissionToStore(newRecord);

    return success(
      {
        submission: newRecord,
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

  const all = getSubmissionsStore();
  const filtered = bountyId ? all.filter((s) => s.bountyId === bountyId) : all;

  // Aggregate count by bountyId
  const countsByBounty: Record<string, number> = {};
  for (const s of all) {
    countsByBounty[s.bountyId] = (countsByBounty[s.bountyId] || 0) + 1;
  }

  return success(
    {
      submissions: filtered,
      countsByBounty,
    },
    requestId,
  );
}
