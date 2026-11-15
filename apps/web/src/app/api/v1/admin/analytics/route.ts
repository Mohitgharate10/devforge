import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { DomainError } from '@devforge/domain';
import { type ApiErrorCode } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore } from '@/server/engagement/demo-data';
import { requireRole } from '@/server/auth/middleware';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    await requireRole('admin', request.headers);

    try {
      const [activeContracts, escrows, pendingReports, resolvedReports, reviews, usersCount] =
        await Promise.all([
          prisma.contract.count({ where: { status: 'ACTIVE' } }),
          prisma.escrow.findMany({ select: { amount: true } }),
          prisma.report.count({ where: { status: 'PENDING' } }),
          prisma.report.count({ where: { status: 'RESOLVED' } }),
          prisma.review.findMany({ select: { rating: true } }),
          prisma.user.count(),
        ]);

      const totalVolume = escrows.reduce(
        (sum, e) => sum + parseFloat(e.amount.toString() || '0'),
        0,
      );
      const avgRating =
        reviews.length > 0
          ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
          : 5.0;

      return success(
        {
          activeContractsCount: activeContracts,
          totalEscrowVolumeEth: Number(totalVolume.toFixed(2)),
          totalDisputesCount: pendingReports,
          resolvedDisputesCount: resolvedReports,
          platformFeeEth: Number((totalVolume * 0.025).toFixed(4)),
          averageRating: avgRating,
          totalUsersCount: usersCount,
        },
        requestId,
      );
    } catch {
      // Fallback to demo store analytics only if DEMO_MODE === 'true'
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve analytics from database.',
            status: 500,
          },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE === 'true') {
      const demoAnalytics = demoStore.getAnalytics();
      return success(demoAnalytics, requestId);
    }

    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to retrieve analytics.', status: 500 },
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
      { code: 'INTERNAL_ERROR', message: 'Failed to retrieve analytics.', status: 500 },
      requestId,
    );
  }
}
