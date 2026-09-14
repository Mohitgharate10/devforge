import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore } from '@/server/engagement/demo-data';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { notificationId } = await params;

  try {
    try {
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return success(
        {
          id: updated.id,
          isRead: updated.isRead,
          isLocalDemo: false,
        },
        requestId,
      );
    } catch {
      // Database offline - fallback to demo store
    }

    const demo = demoStore.markNotificationRead(notificationId);
    if (!demo) {
      return failure(
        { code: 'NOT_FOUND', message: 'Notification not found.', status: 404 },
        requestId,
      );
    }

    return success(
      {
        id: demo.id,
        isRead: demo.isRead,
        isLocalDemo: true,
      },
      requestId,
    );
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to mark notification as read.', status: 500 },
      requestId,
    );
  }
}
