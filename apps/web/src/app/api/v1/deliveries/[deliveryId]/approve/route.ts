import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { approveDeliveryRequestSchema } from '@devforge/api-contracts';
import {
  assertCanTransitionDeliveryStatus,
  assertCanTransitionMilestoneStatus,
  DomainError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore } from '@/server/engagement/demo-data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deliveryId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { deliveryId } = await params;

  try {
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
            code: dbErr.code as 'VALIDATION_FAILED',
            message: dbErr.message,
            status: dbErr.statusCode,
          },
          requestId,
        );
      }
      console.warn('Prisma delivery approval fell back or encountered error:', dbErr);
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
          code: error.code as 'STATE_TRANSITION_INVALID',
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
