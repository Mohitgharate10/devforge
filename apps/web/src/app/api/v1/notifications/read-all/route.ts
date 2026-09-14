import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await optionalSession();

    try {
      if (actor) {
        await prisma.notification.updateMany({
          where: { userId: actor.userId, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });

        return success({ success: true, isLocalDemo: false }, requestId);
      }
    } catch {
      // Database offline - fallback to demo store
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
