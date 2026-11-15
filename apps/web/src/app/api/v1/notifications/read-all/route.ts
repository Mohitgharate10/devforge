import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import type { ApiErrorCode } from '@devforge/api-contracts';
import { DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

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
    try {
      await prisma.notification.updateMany({
        where: { userId: actor.userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      return success({ success: true, isLocalDemo: false }, requestId);
    } catch {
      // Database offline - fallback to demo store
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to mark all notifications as read in database.',
            status: 500,
          },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE !== 'true') {
      return success({ success: true, isLocalDemo: false }, requestId);
    }

    demoStore.markAllNotificationsRead();

    return success({ success: true, isLocalDemo: true }, requestId);
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to mark all notifications as read.', status: 500 },
      requestId,
    );
  }
}
