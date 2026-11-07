import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore } from '@/server/engagement/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { contractId } = await params;

  try {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          clientProfile: true,
          freelancerProfile: {
            include: { user: true },
          },
          milestones: {
            include: {
              deliveries: true,
            },
            orderBy: { sequence: 'asc' },
          },
          participants: true,
        },
      });

      if (contract) {
        return success(
          {
            id: contract.id,
            jobId: contract.jobId,
            proposalId: contract.proposalId,
            title: contract.title,
            totalAmount: Number(contract.totalAmount),
            currency: contract.currency,
            status: contract.status,
            client: {
              id: contract.clientProfile.id,
              organizationName: contract.clientProfile.organizationName,
              slug: contract.clientProfile.slug,
            },
            freelancer: {
              id: contract.freelancerProfile.id,
              displayName: contract.freelancerProfile.user.displayName,
              handle: contract.freelancerProfile.handle,
              title: contract.freelancerProfile.title,
            },
            milestonesCount: contract.milestones.length,
            milestones: contract.milestones.map((m) => ({
              id: m.id,
              contractId: m.contractId,
              sequence: m.sequence,
              title: m.title,
              description: m.description,
              amount: Number(m.amount),
              dueDate: m.dueDate ? m.dueDate.toISOString() : null,
              status: m.status,
              deliveries: m.deliveries.map((d) => ({
                id: d.id,
                milestoneId: d.milestoneId,
                freelancerProfileId: d.freelancerProfileId,
                description: d.description,
                status: d.status,
                feedback: d.feedback,
                submittedAt: d.submittedAt.toISOString(),
                reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
              })),
              createdAt: m.createdAt.toISOString(),
              updatedAt: m.updatedAt.toISOString(),
            })),
            participants: contract.participants.map((p) => ({
              userId: p.userId,
              role: p.role,
            })),
            createdAt: contract.createdAt.toISOString(),
            updatedAt: contract.updatedAt.toISOString(),
            isLocalDemo: false,
          },
          requestId,
        );
      }
    } catch {
      // Database offline - fallback to demo store
    }

    const demo = demoStore.getContractById(contractId);
    if (!demo) {
      return failure({ code: 'NOT_FOUND', message: 'Contract not found.', status: 404 }, requestId);
    }

    return success(
      {
        id: demo.id,
        jobId: demo.jobId,
        proposalId: demo.proposalId,
        title: demo.title,
        totalAmount: demo.totalAmount,
        currency: demo.currency,
        status: demo.status,
        client: demo.client,
        freelancer: demo.freelancer,
        milestonesCount: demo.milestones.length,
        milestones: demo.milestones,
        participants: demo.participants,
        createdAt: demo.createdAt,
        updatedAt: demo.updatedAt,
        isLocalDemo: true,
      },
      requestId,
    );
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to retrieve contract.', status: 500 },
      requestId,
    );
  }
}
