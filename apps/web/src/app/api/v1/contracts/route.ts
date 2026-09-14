import { NextResponse } from 'next/server';
import { prisma, type ContractStatus } from '@devforge/database';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  try {
    const actor = await optionalSession();

    try {
      if (actor) {
        const contracts = await prisma.contract.findMany({
          where: {
            ...(status ? { status: status as ContractStatus } : {}),
            participants: {
              some: { userId: actor.userId },
            },
          },
          include: {
            clientProfile: true,
            freelancerProfile: {
              include: { user: true },
            },
            milestones: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        const items = contracts.map((c) => ({
          id: c.id,
          jobId: c.jobId,
          proposalId: c.proposalId,
          title: c.title,
          totalAmount: Number(c.totalAmount),
          currency: c.currency,
          status: c.status,
          client: {
            id: c.clientProfile.id,
            organizationName: c.clientProfile.organizationName,
            slug: c.clientProfile.slug,
          },
          freelancer: {
            id: c.freelancerProfile.id,
            displayName: c.freelancerProfile.user.displayName,
            handle: c.freelancerProfile.handle,
            title: c.freelancerProfile.title,
          },
          milestonesCount: c.milestones.length,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }));

        return success(
          {
            items,
            total: items.length,
            isLocalDemo: false,
          },
          requestId,
        );
      }
    } catch {
      // Database offline - fallback to demo store
    }

    let demoItems = demoStore.getContracts();
    if (status) {
      demoItems = demoItems.filter((c) => c.status === status);
    }

    const items = demoItems.map((c) => ({
      id: c.id,
      jobId: c.jobId,
      proposalId: c.proposalId,
      title: c.title,
      totalAmount: c.totalAmount,
      currency: c.currency,
      status: c.status,
      client: {
        id: c.client.id,
        organizationName: c.client.organizationName,
        slug: c.client.slug,
      },
      freelancer: {
        id: c.freelancer.id,
        displayName: c.freelancer.displayName,
        handle: c.freelancer.handle,
        title: c.freelancer.title,
      },
      milestonesCount: c.milestones.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return success(
      {
        items,
        total: items.length,
        isLocalDemo: true,
      },
      requestId,
    );
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to fetch contracts.', status: 500 },
      requestId,
    );
  }
}
