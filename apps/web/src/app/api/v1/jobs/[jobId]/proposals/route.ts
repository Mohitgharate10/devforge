import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '@devforge/database';
import { createProposalRequestSchema } from '@devforge/api-contracts';
import { validateCoverLetter, validateBidAmount, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';
import {
  findCanonicalBounty,
  getCanonicalJobUuid,
} from '@/lib/canonical-marketplace';
import { ensureDbJobForCanonicalBounty } from '@/lib/ensure-db-job';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { jobId } = await params;

  try {
    const body = await request.json();
    const parsed = createProposalRequestSchema.parse(body);

    validateCoverLetter(parsed.coverLetter);
    validateBidAmount(parsed.bidAmount);

    const actor = await optionalSession();
    const canonicalBounty = findCanonicalBounty(jobId);

    // Resolve or auto-ensure DB job for canonical bounty
    let dbJob = null;
    let targetJobUuid: string | null = null;

    if (canonicalBounty) {
      dbJob = await ensureDbJobForCanonicalBounty(canonicalBounty);
      targetJobUuid = dbJob?.id ?? getCanonicalJobUuid(canonicalBounty.id) ?? null;
    } else {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId);
      if (isUuid) {
        try {
          dbJob = await prisma.job.findUnique({
            where: { id: jobId },
            include: { clientProfile: true },
          });
          targetJobUuid = dbJob?.id ?? null;
        } catch {
          // Prisma lookup error
        }
      }
    }

    // Try PostgreSQL creation if database and target job are available
    let createdProposal = null;

    if (actor && targetJobUuid) {
      try {
        // Ensure user and freelancerProfile exist in Prisma
        let user = await prisma.user.findUnique({
          where: { id: actor.userId },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              id: actor.userId,
              email: `${actor.userId.slice(0, 8)}@devforge.network`,
              displayName: 'Verified Specialist',
              status: 'ACTIVE',
            },
          });
        }

        let freelancerProfile = await prisma.freelancerProfile.findUnique({
          where: { userId: actor.userId },
          include: { user: true },
        });

        if (!freelancerProfile) {
          freelancerProfile = await prisma.freelancerProfile.create({
            data: {
              userId: actor.userId,
              handle: `spec_${actor.userId.slice(0, 8)}`,
              title: 'Web3 Security Researcher',
              bio: 'Verified technical specialist submitting deliverables on DevForge.',
            },
            include: { user: true },
          });
        }

        if (freelancerProfile) {
          createdProposal = await prisma.proposal.upsert({
            where: {
              jobId_freelancerProfileId: {
                jobId: targetJobUuid,
                freelancerProfileId: freelancerProfile.id,
              },
            },
            update: {
              coverLetter: parsed.coverLetter,
              bidAmount: BigInt(parsed.bidAmount),
              currency: parsed.currency ?? 'USDC',
              status: 'SUBMITTED',
            },
            create: {
              jobId: targetJobUuid,
              freelancerProfileId: freelancerProfile.id,
              coverLetter: parsed.coverLetter,
              bidAmount: BigInt(parsed.bidAmount),
              currency: parsed.currency ?? 'USDC',
              status: 'SUBMITTED',
              statusHistory: {
                create: {
                  toStatus: 'SUBMITTED',
                  actorId: actor.userId,
                  reason: 'Initial proposal submission',
                },
              },
            },
            include: {
              job: true,
              freelancerProfile: {
                include: { user: true },
              },
            },
          });
        }
      } catch (dbErr) {
        console.warn('Prisma proposal creation fallback to in-memory store:', dbErr);
      }
    }

    // Prepare unified proposal record for response & demoStore sync
    const jobTitle =
      canonicalBounty?.title ?? dbJob?.title ?? 'Web3 Engineering Engagement';
    const clientName =
      canonicalBounty?.client.organizationName ??
      dbJob?.clientProfile?.organizationName ??
      'Protocol / Client Team';
    const clientSlug =
      canonicalBounty?.client.slug ??
      dbJob?.clientProfile?.slug ??
      'protocol-team';

    const proposalId = createdProposal?.id ?? `prop-${crypto.randomUUID().slice(0, 8)}`;
    const freelancerDisplayName =
      createdProposal?.freelancerProfile?.user?.displayName ??
      (actor ? 'Verified Specialist' : 'Elena Rostova');
    const freelancerHandle =
      createdProposal?.freelancerProfile?.handle ??
      (actor ? `user_${actor.userId.slice(0, 8)}` : 'elena-rostova');
    const freelancerProfileId =
      createdProposal?.freelancerProfileId ?? actor?.userId ?? 'freelancer-elena';

    const demoRecord = {
      id: proposalId,
      jobId,
      jobTitle,
      freelancerProfileId,
      freelancer: {
        id: freelancerProfileId,
        userId: actor?.userId ?? 'user-elena',
        displayName: freelancerDisplayName,
        handle: freelancerHandle,
        title: 'Senior Web3 Security Researcher',
        avatarUrl: null,
      },
      client: {
        id: dbJob?.clientProfileId ?? 'client-polka',
        userId: dbJob?.clientProfile?.userId ?? 'user-parity',
        organizationName: clientName,
        slug: clientSlug,
      },
      coverLetter: parsed.coverLetter,
      bidAmount: parsed.bidAmount,
      currency: parsed.currency ?? 'USDC',
      status: 'SUBMITTED' as const,
      createdAt: createdProposal ? createdProposal.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: createdProposal ? createdProposal.updatedAt.toISOString() : new Date().toISOString(),
    };

    demoStore.addProposal(demoRecord);

    return success(
      {
        id: demoRecord.id,
        jobId: demoRecord.jobId,
        jobTitle: demoRecord.jobTitle,
        freelancerProfileId: demoRecord.freelancerProfileId,
        freelancer: demoRecord.freelancer,
        coverLetter: demoRecord.coverLetter,
        bidAmount: demoRecord.bidAmount,
        currency: demoRecord.currency,
        status: demoRecord.status,
        createdAt: demoRecord.createdAt,
        updatedAt: demoRecord.updatedAt,
        isLocalDemo: !createdProposal,
      },
      requestId,
      201,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: error.issues[0]?.message ?? 'Invalid request body format.',
          status: 400,
        },
        requestId,
      );
    }
    if (error instanceof DomainError) {
      return failure(
        {
          code: error.code as 'VALIDATION_FAILED',
          message: error.message,
          status: error.statusCode,
        },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to submit proposal.', status: 500 },
      requestId,
    );
  }
}
