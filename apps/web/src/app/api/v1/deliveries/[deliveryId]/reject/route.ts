import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@devforge/database';
import {
  assertCanTransitionDeliveryStatus,
  assertCanTransitionMilestoneStatus,
  DomainError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore } from '@/server/engagement/demo-data';

const rejectDeliverySchema = z.object({
  feedback: z.string().max(1000).optional(),
  reason: z.string().max(1000).optional(),
});

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
      const parsed = rejectDeliverySchema.parse(body);
      feedback = parsed.feedback ?? parsed.reason;
    } catch {
      // Body is optional
    }

    try {
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          milestone: {
            include: {
              contract: true,
            },
          },
        },
      });

      if (delivery) {
        assertCanTransitionDeliveryStatus(delivery.status, 'REJECTED');
        assertCanTransitionMilestoneStatus(delivery.milestone.status, 'IN_PROGRESS');

        const now = new Date();
        const rejectionFeedback =
          feedback ?? 'Revisions requested by client. Please review notes and resubmit.';

        const result = await prisma.$transaction(async (tx) => {
          const updatedDelivery = await tx.delivery.update({
            where: { id: deliveryId },
            data: {
              status: 'REJECTED',
              feedback: rejectionFeedback,
              reviewedAt: now,
            },
          });

          await tx.milestone.update({
            where: { id: delivery.milestoneId },
            data: {
              status: 'IN_PROGRESS',
            },
          });

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
      console.warn('Prisma delivery rejection fell back or encountered error:', dbErr);
    }

    const res = demoStore.rejectDelivery(deliveryId, feedback);
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
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to request revision on deliverable.',
        status: 500,
      },
      requestId,
    );
  }
}
