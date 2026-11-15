import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { createReportRequestSchema, type ApiErrorCode } from '@devforge/api-contracts';
import { DomainError, hasRole } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore } from '@/server/engagement/demo-data';
import { requireSession } from '@/server/auth/middleware';
import { enforceRateLimit, REPORT_POST_RATE_LIMIT } from '@/server/shared/rate-limit';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await requireSession(request.headers);
    const isAdmin = hasRole(actor, 'admin');

    try {
      const where = isAdmin ? {} : { reporterId: actor.userId };
      const reports = await prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      if (reports.length > 0 || process.env.DEMO_MODE !== 'true') {
        const filtered = isAdmin ? reports : reports.filter((r) => r.reporterId === actor.userId);
        return success(
          filtered.map((r) => ({
            id: r.id,
            reporterId: r.reporterId,
            targetType: r.targetType,
            targetId: r.targetId,
            category: 'COMPLIANCE',
            reason: r.reason,
            status: r.status,
            severity: r.severity,
            createdAt: r.createdAt.toISOString(),
          })),
          requestId,
        );
      }
    } catch {
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve reports from database.',
            status: 500,
          },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE === 'true') {
      let demoReports = demoStore.getReports();
      if (!isAdmin) {
        demoReports = demoReports.filter((r) => r.reporterId === actor.userId);
      }
      return success(demoReports, requestId);
    }

    return success([], requestId);
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
      { code: 'INTERNAL_ERROR', message: 'Failed to retrieve reports.', status: 500 },
      requestId,
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  // Rate limiting check
  const rateLimitRes = await enforceRateLimit(request, REPORT_POST_RATE_LIMIT);
  if (rateLimitRes) {
    return rateLimitRes;
  }

  try {
    const body = await request.json();
    const parsed = createReportRequestSchema.parse(body);

    const reporterId = '00000000-0000-0000-0000-000000000001';

    try {
      const report = await prisma.report.create({
        data: {
          reporterId,
          targetType: parsed.targetType,
          targetId: parsed.targetId,
          reason: `[${parsed.category}] ${parsed.reason}`,
          severity: parsed.severity,
          status: 'PENDING',
        },
      });

      return success(
        {
          id: report.id,
          reporterId: report.reporterId,
          targetType: report.targetType,
          targetId: report.targetId,
          category: parsed.category,
          reason: report.reason,
          status: report.status,
          severity: report.severity,
          createdAt: report.createdAt.toISOString(),
        },
        requestId,
      );
    } catch {
      if (process.env.DEMO_MODE === 'true') {
        const demoRep = demoStore.addReport({
          id: `rep-${Date.now()}`,
          reporterId,
          targetType: parsed.targetType,
          targetId: parsed.targetId,
          category: parsed.category,
          reason: parsed.reason,
          status: 'PENDING',
          severity: parsed.severity,
          createdAt: new Date().toISOString(),
        });

        return success(demoRep, requestId);
      }

      return failure(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create report in database.',
          status: 500,
        },
        requestId,
      );
    }
  } catch (error) {
    return failure(
      {
        code: 'VALIDATION_FAILED',
        message: error instanceof Error ? error.message : 'Invalid report request.',
        status: 400,
      },
      requestId,
    );
  }
}
