import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const url = new URL(request.url);
  const contractId = url.searchParams.get('contractId');

  try {
    const actor = await optionalSession();

    try {
      if (actor) {
        const conversations = await prisma.conversation.findMany({
          where: {
            ...(contractId ? { contractId } : {}),
            members: {
              some: { userId: actor.userId },
            },
          },
          include: {
            members: {
              include: { user: true },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        });

        const items = conversations.map((conv) => {
          const lastMsg = conv.messages[0];
          return {
            id: conv.id,
            contractId: conv.contractId,
            title: conv.title,
            members: conv.members.map((m) => ({
              userId: m.userId,
              displayName: m.user.displayName,
              avatarUrl: m.user.avatarUrl,
            })),
            lastMessage: lastMsg
              ? {
                  id: lastMsg.id,
                  conversationId: lastMsg.conversationId,
                  senderId: lastMsg.senderId,
                  senderName: lastMsg.sender.displayName,
                  senderAvatar: lastMsg.sender.avatarUrl,
                  content: lastMsg.content,
                  type: lastMsg.type,
                  createdAt: lastMsg.createdAt.toISOString(),
                }
              : null,
            unreadCount: 0,
            createdAt: conv.createdAt.toISOString(),
            updatedAt: conv.updatedAt.toISOString(),
          };
        });

        return success({ items, total: items.length, isLocalDemo: false }, requestId);
      }
    } catch {
      // Database offline - fallback to demo store
    }

    let demoConvs = demoStore.getConversations();
    if (contractId) {
      const single = demoStore.getConversationByContractId(contractId);
      demoConvs = single ? [single] : [];
    }

    const items = demoConvs.map((conv) => {
      const lastMsg = conv.messages[conv.messages.length - 1];
      return {
        id: conv.id,
        contractId: conv.contractId,
        title: conv.title,
        members: conv.members,
        lastMessage: lastMsg ?? null,
        unreadCount: 1,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    return success({ items, total: items.length, isLocalDemo: true }, requestId);
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to fetch conversations.', status: 500 },
      requestId,
    );
  }
}
