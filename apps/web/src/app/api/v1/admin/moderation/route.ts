import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { z } from 'zod';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore } from '@/server/engagement/demo-data';

const updateModerationSchema = z.object({
  reportId: z.string(),
  status: z.enum(['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']),
  note: z.string().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    try {
      const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (reports.length > 0) {
        return success(reports, requestId);
      }
    } catch {
      // Fallback
    }

    const demoReports = demoStore.getReports();
    return success(demoReports, requestId);
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to retrieve moderation queue.', status: 500 },
      requestId,
    );
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json();
    const parsed = updateModerationSchema.parse(body);

    try {
      const updated = await prisma.report.update({
        where: { id: parsed.reportId },
        data: { status: parsed.status },
      });
      return success(updated, requestId);
    } catch {
      const updatedDemo = demoStore.updateReportStatus(parsed.reportId, parsed.status);
      return success(updatedDemo, requestId);
    }
  } catch (error) {
    return failure(
      { code: 'VALIDATION_FAILED', message: error instanceof Error ? error.message : 'Invalid request.', status: 400 },
      requestId,
    );
  }
}
