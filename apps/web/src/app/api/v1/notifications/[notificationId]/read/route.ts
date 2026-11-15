import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';
import { DomainError } from '@devforge/domain';
import type { ApiErrorCode } from '@devforge/api-contracts';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { notificationId } = await params;

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
      const existing = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (existing) {
        if (existing.userId !== actor.userId) {
          return failure(
            {
              code: 'FORBIDDEN',
              message: 'You can only mark your own notifications as read.',
              status: 403,
            },
            requestId,
          );
        }

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
      }
    } catch (dbErr) {
      if (
        dbErr &&
        typeof dbErr === 'object' &&
        'code' in dbErr &&
        (dbErr as { code: string }).code === 'FORBIDDEN'
      ) {
        throw dbErr;
      }
      // Database offline or error - fallback to demo store
    }

    const demo = demoStore.getNotifications().find((n) => n.id === notificationId);
    if (!demo) {
      return failure(
        { code: 'NOT_FOUND', message: 'Notification not found.', status: 404 },
        requestId,
      );
    }

    if (demo.userId !== actor.userId) {
      return failure(
        {
          code: 'FORBIDDEN',
          message: 'You can only mark your own notifications as read.',
          status: 403,
        },
        requestId,
      );
    }

    demo.isRead = true;

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
