import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { approveDeliveryRequestSchema, type ApiErrorCode } from '@devforge/api-contracts';
import {
  assertCanTransitionDeliveryStatus,
  assertCanTransitionMilestoneStatus,
  DomainError,
  ForbiddenError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore } from '@/server/engagement/demo-data';
import { requireSession } from '@/server/auth/middleware';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deliveryId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { deliveryId } = await params;

  try {
    const actor = await requireSession(request.headers);

    let feedback: string | undefined;
    try {
      const body = await request.json();
      const parsed = approveDeliveryRequestSchema.parse(body);
      feedback = parsed.feedback;
    } catch {
      // Body is optional
    }

    try {
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          milestone: {
            include: {
              contract: {
                include: {
                  milestones: true,
                  clientProfile: true,
                },
              },
            },
          },
        },
      });

      if (delivery) {
        if (delivery.milestone.contract.clientProfile.userId !== actor.userId) {
          throw new ForbiddenError('Only the contract client can approve deliveries.');
        }

        assertCanTransitionDeliveryStatus(delivery.status, 'ACCEPTED');
        assertCanTransitionMilestoneStatus(delivery.milestone.status, 'APPROVED');

        const now = new Date();
        const result = await prisma.$transaction(async (tx) => {
          const updatedDelivery = await tx.delivery.update({
            where: { id: deliveryId },
            data: {
              status: 'ACCEPTED',
              feedback: feedback ?? 'Deliverable approved.',
              reviewedAt: now,
            },
          });

          await tx.milestone.update({
            where: { id: delivery.milestoneId },
            data: {
              status: 'APPROVED',
            },
          });

          // Check if all other milestones are approved
          const otherMilestones = delivery.milestone.contract.milestones.filter(
            (m) => m.id !== delivery.milestoneId,
          );
          const allApproved = otherMilestones.every((m) => m.status === 'APPROVED');
          if (allApproved) {
            await tx.contract.update({
              where: { id: delivery.milestone.contractId },
              data: { status: 'COMPLETED' },
            });
          }

          return updatedDelivery;
        });

        return success(
          {
            id: result.id,
            status: result.status,
            feedback: result.feedback,
            reviewedAt: result.reviewedAt ? result.reviewedAt.toISOString() : null,
            isLocalDemo: false,
          },
          requestId,
        );
      }
    } catch (dbErr) {
      if (dbErr instanceof DomainError) {
        return failure(
          {
            code: dbErr.code as ApiErrorCode,
            message: dbErr.message,
            status: dbErr.statusCode,
          },
          requestId,
        );
      }
      console.warn('Prisma delivery approval fell back or encountered error:', dbErr);
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          { code: 'INTERNAL_ERROR', message: 'Failed to approve deliverable.', status: 500 },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE !== 'true') {
      return failure({ code: 'NOT_FOUND', message: 'Delivery not found.', status: 404 }, requestId);
    }

    const contracts = demoStore.getContracts();
    const demoContract = contracts.find((c) =>
      c.milestones.some((m) => m.deliveries.some((d) => d.id === deliveryId)),
    );
    if (demoContract) {
      if (demoContract.client.userId !== actor.userId) {
        throw new ForbiddenError('Only the contract client can approve deliveries.');
      }
    }

    const res = demoStore.approveDelivery(deliveryId, feedback);
    if (!res) {
      return failure({ code: 'NOT_FOUND', message: 'Delivery not found.', status: 404 }, requestId);
    }

    return success(
      {
        id: res.delivery.id,
        status: res.delivery.status,
        feedback: res.delivery.feedback,
        reviewedAt: res.delivery.reviewedAt,
        isLocalDemo: true,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        {
          code: error.code as ApiErrorCode,
          message: error.message,
          status: error.statusCode,
        },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to approve deliverable.', status: 500 },
      requestId,
    );
  }
}
