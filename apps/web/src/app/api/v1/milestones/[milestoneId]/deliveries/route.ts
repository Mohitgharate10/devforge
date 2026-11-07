import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { submitDeliveryRequestSchema } from '@devforge/api-contracts';
import { assertCanTransitionMilestoneStatus, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore, type DemoDelivery } from '@/server/engagement/demo-data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ milestoneId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { milestoneId } = await params;

  try {
    const body = await request.json();
    const parsed = submitDeliveryRequestSchema.parse(body);

    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          contract: {
            include: {
              freelancerProfile: true,
            },
          },
        },
      });

      if (milestone) {
        // Allow funded or in_progress milestone to transition to submitted
        assertCanTransitionMilestoneStatus(milestone.status, 'SUBMITTED');

        const delivery = await prisma.$transaction(async (tx) => {
          const newDelivery = await tx.delivery.create({
            data: {
              milestoneId,
              freelancerProfileId: milestone.contract.freelancerProfileId,
              description: parsed.description,
              status: 'SUBMITTED',
            },
          });

          await tx.milestone.update({
            where: { id: milestoneId },
            data: { status: 'SUBMITTED' },
          });

          return newDelivery;
        });

        return success(
          {
            id: delivery.id,
            milestoneId: delivery.milestoneId,
            freelancerProfileId: delivery.freelancerProfileId,
            description: delivery.description,
            status: delivery.status,
            feedback: delivery.feedback,
            submittedAt: delivery.submittedAt.toISOString(),
            reviewedAt: null,
            isLocalDemo: false,
          },
          requestId,
          201,
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
      console.warn('Prisma delivery submission fell back or encountered error:', dbErr);
    }

    const demoDelivery: DemoDelivery = {
      id: `del-${crypto.randomUUID().slice(0, 8)}`,
      milestoneId,
      freelancerProfileId: 'freelancer-elena',
      description: parsed.description,
      status: 'SUBMITTED',
      feedback: null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    };

    const res = demoStore.addDelivery(milestoneId, demoDelivery);
    if (!res) {
      return failure(
        { code: 'NOT_FOUND', message: 'Milestone not found.', status: 404 },
        requestId,
      );
    }

    return success(
      {
        id: demoDelivery.id,
        milestoneId: demoDelivery.milestoneId,
        freelancerProfileId: demoDelivery.freelancerProfileId,
        description: demoDelivery.description,
        status: demoDelivery.status,
        feedback: demoDelivery.feedback,
        submittedAt: demoDelivery.submittedAt,
        reviewedAt: null,
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
      { code: 'INTERNAL_ERROR', message: 'Failed to submit milestone delivery.', status: 500 },
      requestId,
    );
  }
}
