import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { createReportRequestSchema } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore } from '@/server/engagement/demo-data';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    try {
      const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (reports.length > 0) {
        return success(
          reports.map((r) => ({
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
      // Fallback to demo store
    }

    const demoReports = demoStore.getReports();
    return success(demoReports, requestId);
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to retrieve reports.', status: 500 },
      requestId,
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

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
  } catch (error) {
    return failure(
      { code: 'VALIDATION_FAILED', message: error instanceof Error ? error.message : 'Invalid report request.', status: 400 },
      requestId,
    );
  }
}
