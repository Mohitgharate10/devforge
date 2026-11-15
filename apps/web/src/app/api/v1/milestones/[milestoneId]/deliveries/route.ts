import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { submitDeliveryRequestSchema } from '@devforge/api-contracts';
import type { ApiErrorCode } from '@devforge/api-contracts';
import { assertCanTransitionMilestoneStatus, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { demoStore, type DemoDelivery } from '@/server/engagement/demo-data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ milestoneId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { milestoneId } = await params;

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
    const body = await request.json();
    const parsed = submitDeliveryRequestSchema.parse(body);

    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          contract: {
            include: {
              freelancerProfile: true,
              participants: true,
            },
          },
        },
      });

      if (milestone) {
        const isFreelancer =
          milestone.contract.freelancerProfile?.userId === actor.userId ||
          (milestone.contract.participants?.some(
            (p) => p.userId === actor.userId && p.role === 'FREELANCER',
          ) ??
            false);

        if (!isFreelancer) {
          return failure(
            {
              code: 'FORBIDDEN',
              message: 'Only the freelancer on this contract can submit a delivery.',
              status: 403,
            },
            requestId,
          );
        }

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
            code: dbErr.code as ApiErrorCode,
            message: dbErr.message,
            status: dbErr.statusCode,
          },
          requestId,
        );
      }
      console.warn('Prisma delivery submission fell back or encountered error:', dbErr);
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to submit delivery in database.',
            status: 500,
          },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE !== 'true') {
      return failure(
        { code: 'NOT_FOUND', message: 'Milestone not found.', status: 404 },
        requestId,
      );
    }

    const globalStore = globalThis as unknown as {
      __devforge_contracts?: Array<{
        milestones?: Array<{ id: string }>;
        freelancer?: { id: string; userId: string };
        participants?: Array<{ userId: string; role: string }>;
      }>;
    };
    const demoContract = globalStore.__devforge_contracts?.find((c) =>
      c.milestones?.some((m) => m.id === milestoneId),
    );

    if (!demoContract) {
      return failure(
        { code: 'NOT_FOUND', message: 'Milestone not found.', status: 404 },
        requestId,
      );
    }

    const isFreelancer =
      demoContract.freelancer?.userId === actor.userId ||
      (demoContract.participants?.some(
        (p) => p.userId === actor.userId && p.role === 'FREELANCER',
      ) ??
        false);

    if (!isFreelancer) {
      return failure(
        {
          code: 'FORBIDDEN',
          message: 'Only the freelancer on this contract can submit a delivery.',
          status: 403,
        },
        requestId,
      );
    }

    const demoDelivery: DemoDelivery = {
      id: `del-${crypto.randomUUID().slice(0, 8)}`,
      milestoneId,
      freelancerProfileId: demoContract.freelancer?.id || 'freelancer-elena',
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
          code: error.code as ApiErrorCode,
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
