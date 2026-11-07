import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { createProposalRequestSchema } from '@devforge/api-contracts';
import { validateCoverLetter, validateBidAmount, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore, DEMO_FREELANCERS, DEMO_CLIENTS } from '@/server/engagement/demo-data';

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

    try {
      // 1. Try PostgreSQL if available
      let freelancerProfile = null;
      if (actor) {
        freelancerProfile = await prisma.freelancerProfile.findUnique({
          where: { userId: actor.userId },
        });
      }

      if (freelancerProfile) {
        const job = await prisma.job.findUnique({
          where: { id: jobId },
        });

        if (!job) {
          return failure(
            { code: 'NOT_FOUND', message: 'Job listing not found.', status: 404 },
            requestId,
          );
        }

        const proposal = await prisma.proposal.create({
          data: {
            jobId,
            freelancerProfileId: freelancerProfile.id,
            coverLetter: parsed.coverLetter,
            bidAmount: BigInt(parsed.bidAmount),
            currency: parsed.currency ?? 'USD',
            status: 'SUBMITTED',
            statusHistory: {
              create: {
                toStatus: 'SUBMITTED',
                actorId: actor!.userId,
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

        return success(
          {
            id: proposal.id,
            jobId: proposal.jobId,
            jobTitle: proposal.job.title,
            freelancerProfileId: proposal.freelancerProfileId,
            freelancer: {
              id: proposal.freelancerProfile.id,
              displayName: proposal.freelancerProfile.user.displayName,
              handle: proposal.freelancerProfile.handle,
              title: proposal.freelancerProfile.title,
              avatarUrl: proposal.freelancerProfile.user.avatarUrl,
            },
            coverLetter: proposal.coverLetter,
            bidAmount: Number(proposal.bidAmount),
            currency: proposal.currency,
            status: proposal.status,
            createdAt: proposal.createdAt.toISOString(),
            updatedAt: proposal.updatedAt.toISOString(),
            isLocalDemo: false,
          },
          requestId,
          201,
        );
      }
    } catch {
      // Database offline - fall through to local demo store
    }

    // Local demo store fallback
    const fallbackFreelancer = DEMO_FREELANCERS['freelancer-elena']!;
    const demoJobTitle =
      jobId === 'job-bridge-audit'
        ? 'EVM & Substrate Cross-Chain Bridge Security Audit'
        : jobId === 'job-zk-circuit'
          ? 'ZK-Rollup Proof Verifier Circuit Optimization'
          : 'Smart Contract Engagement';

    const newDemoProposal = {
      id: `prop-${crypto.randomUUID().slice(0, 8)}`,
      jobId,
      jobTitle: demoJobTitle,
      freelancerProfileId: fallbackFreelancer.id,
      freelancer: fallbackFreelancer,
      client: DEMO_CLIENTS['client-polka']!,
      coverLetter: parsed.coverLetter,
      bidAmount: parsed.bidAmount,
      currency: parsed.currency ?? 'USDC',
      status: 'SUBMITTED' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    demoStore.addProposal(newDemoProposal);

    return success(
      {
        id: newDemoProposal.id,
        jobId: newDemoProposal.jobId,
        jobTitle: newDemoProposal.jobTitle,
        freelancerProfileId: newDemoProposal.freelancerProfileId,
        freelancer: newDemoProposal.freelancer,
        coverLetter: newDemoProposal.coverLetter,
        bidAmount: newDemoProposal.bidAmount,
        currency: newDemoProposal.currency,
        status: newDemoProposal.status,
        createdAt: newDemoProposal.createdAt,
        updatedAt: newDemoProposal.updatedAt,
        isLocalDemo: true,
      },
      requestId,
      201,
    );
  } catch (error) {
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
