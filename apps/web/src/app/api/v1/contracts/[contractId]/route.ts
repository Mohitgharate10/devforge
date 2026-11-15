import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { DomainError } from '@devforge/domain';
import type { ApiErrorCode } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { contractId } = await params;

  let actor;
  try {
    actor = await requireSession(request.headers);
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as ApiErrorCode, message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'UNAUTHENTICATED', message: 'Authentication required.', status: 401 },
      requestId,
    );
  }

  try {
    const isAdmin = actor.roles.includes('admin');

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
        const isParty =
          isAdmin ||
          contract.clientProfile?.userId === actor.userId ||
          contract.freelancerProfile?.userId === actor.userId ||
          (contract.participants?.some(
            (p) => p.userId === actor.userId && (p.role === 'CLIENT' || p.role === 'FREELANCER'),
          ) ??
            false);

        if (!isParty) {
          return failure(
            {
              code: 'FORBIDDEN',
              message: 'You must be a party to this contract or an admin to view it.',
              status: 403,
            },
            requestId,
          );
        }

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
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          { code: 'INTERNAL_ERROR', message: 'Failed to retrieve contract.', status: 500 },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE !== 'true') {
      return failure({ code: 'NOT_FOUND', message: 'Contract not found.', status: 404 }, requestId);
    }

    const demo = demoStore.getContractById(contractId);
    if (!demo) {
      return failure({ code: 'NOT_FOUND', message: 'Contract not found.', status: 404 }, requestId);
    }

    const isParty =
      isAdmin ||
      demo.client.userId === actor.userId ||
      demo.freelancer.userId === actor.userId ||
      demo.participants.some(
        (p) => p.userId === actor.userId && (p.role === 'CLIENT' || p.role === 'FREELANCER'),
      );

    if (!isParty) {
      return failure(
        {
          code: 'FORBIDDEN',
          message: 'You must be a party to this contract or an admin to view it.',
          status: 403,
        },
        requestId,
      );
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
