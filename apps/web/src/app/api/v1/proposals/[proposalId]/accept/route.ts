import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { acceptProposalRequestSchema } from '@devforge/api-contracts';
import {
  assertCanTransitionProposalStatus,
  assertJobClient,
  assertMilestonesSum,
  DomainError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore, type DemoContract, type DemoMilestone } from '@/server/engagement/demo-data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ proposalId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { proposalId } = await params;

  try {
    const body = await request.json();
    const parsed = acceptProposalRequestSchema.parse(body);

    const actor = await optionalSession();

    try {
      if (actor) {
        const proposal = await prisma.proposal.findUnique({
          where: { id: proposalId },
          include: {
            job: {
              include: { clientProfile: true },
            },
            freelancerProfile: {
              include: { user: true },
            },
          },
        });

        if (!proposal) {
          return failure(
            { code: 'NOT_FOUND', message: 'Proposal not found.', status: 404 },
            requestId,
          );
        }

        assertJobClient(actor.userId, proposal.job.clientProfile.userId);
        assertCanTransitionProposalStatus(proposal.status, 'ACCEPTED');

        // Verify milestone sums equal proposal bid
        const milestoneAmounts = parsed.milestones.map((m) => m.amount);
        assertMilestonesSum(milestoneAmounts, Number(proposal.bidAmount));

        // Transactional execution
        const contract = await prisma.$transaction(async (tx) => {
          await tx.proposal.update({
            where: { id: proposalId },
            data: {
              status: 'ACCEPTED',
              statusHistory: {
                create: {
                  fromStatus: proposal.status,
                  toStatus: 'ACCEPTED',
                  actorId: actor.userId,
                  reason: 'Client accepted proposal and initiated contract',
                },
              },
            },
          });

          // Mark job as CLOSED or IN_PROGRESS
          await tx.job.update({
            where: { id: proposal.jobId },
            data: { status: 'CLOSED' },
          });

          const createdContract = await tx.contract.create({
            data: {
              jobId: proposal.jobId,
              proposalId: proposal.id,
              clientProfileId: proposal.job.clientProfileId,
              freelancerProfileId: proposal.freelancerProfileId,
              title: proposal.job.title,
              totalAmount: proposal.bidAmount,
              currency: proposal.currency,
              status: 'ACTIVE',
              participants: {
                create: [
                  { userId: proposal.job.clientProfile.userId, role: 'CLIENT' },
                  { userId: proposal.freelancerProfile.userId, role: 'FREELANCER' },
                ],
              },
              milestones: {
                create: parsed.milestones.map((m, idx) => ({
                  sequence: idx + 1,
                  title: m.title,
                  description: m.description ?? null,
                  amount: BigInt(m.amount),
                  dueDate: m.dueDate ? new Date(m.dueDate) : null,
                  status: idx === 0 ? 'FUNDED' : 'PENDING',
                })),
              },
            },
            include: {
              milestones: true,
              participants: true,
            },
          });

          return createdContract;
        });

        return success(
          {
            id: contract.id,
            jobId: contract.jobId,
            proposalId: contract.proposalId,
            title: contract.title,
            totalAmount: Number(contract.totalAmount),
            currency: contract.currency,
            status: contract.status,
            milestonesCount: contract.milestones.length,
            createdAt: contract.createdAt.toISOString(),
            updatedAt: contract.updatedAt.toISOString(),
            isLocalDemo: false,
          },
          requestId,
          201,
        );
      }
    } catch {
      // Database offline - fallback to demo store
    }

    const demo = demoStore.getProposals().find((p) => p.id === proposalId);
    if (!demo) {
      return failure({ code: 'NOT_FOUND', message: 'Proposal not found.', status: 404 }, requestId);
    }

    assertCanTransitionProposalStatus(demo.status, 'ACCEPTED');
    const milestoneAmounts = parsed.milestones.map((m) => m.amount);
    assertMilestonesSum(milestoneAmounts, demo.bidAmount);

    demoStore.updateProposalStatus(proposalId, 'ACCEPTED');

    const contractId = `contract-${crypto.randomUUID().slice(0, 8)}`;
    const newDemoMilestones: DemoMilestone[] = parsed.milestones.map((m, idx) => ({
      id: `ms-${contractId}-${idx + 1}`,
      contractId,
      sequence: idx + 1,
      title: m.title,
      description: m.description ?? null,
      amount: m.amount,
      dueDate: m.dueDate ?? null,
      status: idx === 0 ? 'FUNDED' : 'PENDING',
      deliveries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const newDemoContract: DemoContract = {
      id: contractId,
      jobId: demo.jobId,
      proposalId: demo.id,
      title: demo.jobTitle,
      totalAmount: demo.bidAmount,
      currency: demo.currency,
      status: 'ACTIVE',
      client: demo.client,
      freelancer: demo.freelancer,
      milestones: newDemoMilestones,
      participants: [
        { userId: demo.client.userId, role: 'CLIENT' },
        { userId: demo.freelancer.userId, role: 'FREELANCER' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    demoStore.addContract(newDemoContract);

    return success(
      {
        id: newDemoContract.id,
        jobId: newDemoContract.jobId,
        proposalId: newDemoContract.proposalId,
        title: newDemoContract.title,
        totalAmount: newDemoContract.totalAmount,
        currency: newDemoContract.currency,
        status: newDemoContract.status,
        milestonesCount: newDemoContract.milestones.length,
        createdAt: newDemoContract.createdAt,
        updatedAt: newDemoContract.updatedAt,
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
      { code: 'INTERNAL_ERROR', message: 'Failed to accept proposal.', status: 500 },
      requestId,
    );
  }
}
