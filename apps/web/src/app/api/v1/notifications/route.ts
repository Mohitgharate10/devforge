import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await optionalSession();

    try {
      if (actor) {
        const notifications = await prisma.notification.findMany({
          where: { userId: actor.userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        const unreadCount = await prisma.notification.count({
          where: { userId: actor.userId, isRead: false },
        });

        const items = notifications.map((n) => ({
          id: n.id,
          userId: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          linkUrl: n.linkUrl,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        }));

        return success(
          {
            items,
            unreadCount,
            total: items.length,
            isLocalDemo: false,
          },
          requestId,
        );
      }
    } catch {
      // Database offline - fallback to demo store
    }

    const demoItems = demoStore.getNotifications();
    const unreadCount = demoItems.filter((n) => !n.isRead).length;

    return success(
      {
        items: demoItems,
        unreadCount,
        total: demoItems.length,
        isLocalDemo: true,
      },
      requestId,
    );
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications.', status: 500 },
      requestId,
    );
  }
}
