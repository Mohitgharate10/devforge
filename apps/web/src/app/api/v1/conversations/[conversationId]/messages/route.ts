import { NextResponse } from 'next/server';
import { prisma, type MessageType } from '@devforge/database';
import { sendMessageRequestSchema } from '@devforge/api-contracts';
import { validateMessageContent, sanitizeMessageContent, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore, type DemoMessage } from '@/server/engagement/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { conversationId } = await params;

  try {
    const actor = await optionalSession();

    try {
      if (actor) {
        const messages = await prisma.message.findMany({
          where: { conversationId },
          include: { sender: true },
          orderBy: { createdAt: 'asc' },
          take: 100,
        });

        const items = messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderName: m.sender.displayName,
          senderAvatar: m.sender.avatarUrl,
          content: m.content,
          type: m.type,
          createdAt: m.createdAt.toISOString(),
        }));

        return success({ items, total: items.length, isLocalDemo: false }, requestId);
      }
    } catch {
      // Database offline - fallback to demo store
    }

    const demoConv = demoStore
      .getConversations()
      .find((c) => c.id === conversationId || c.contractId === conversationId);
    if (!demoConv) {
      return failure(
        { code: 'NOT_FOUND', message: 'Conversation not found.', status: 404 },
        requestId,
      );
    }

    return success(
      {
        items: demoConv.messages,
        total: demoConv.messages.length,
        isLocalDemo: true,
      },
      requestId,
    );
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to retrieve messages.', status: 500 },
      requestId,
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { conversationId } = await params;

  try {
    const body = await request.json();
    const parsed = sendMessageRequestSchema.parse(body);

    const validContent = validateMessageContent(parsed.content);
    const sanitized = sanitizeMessageContent(validContent);

    const actor = await optionalSession();

    try {
      if (actor) {
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: actor.userId,
            content: sanitized,
            type: parsed.type as MessageType,
          },
          include: { sender: true },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        return success(
          {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderName: message.sender.displayName,
            senderAvatar: message.sender.avatarUrl,
            content: message.content,
            type: message.type,
            createdAt: message.createdAt.toISOString(),
            isLocalDemo: false,
          },
          requestId,
          201,
        );
      }
    } catch {
      // Database offline - fallback to demo store
    }

    // Determine target demo conversation
    let targetConv = demoStore
      .getConversations()
      .find((c) => c.id === conversationId || c.contractId === conversationId);
    if (!targetConv) {
      targetConv = demoStore.getConversationByContractId(conversationId);
    }

    const newMessage: DemoMessage = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      conversationId: targetConv.id,
      senderId: 'user-elena',
      senderName: 'Elena Rostova',
      senderAvatar: null,
      content: sanitized,
      type: parsed.type as DemoMessage['type'],
      createdAt: new Date().toISOString(),
    };

    demoStore.addMessage(targetConv.id, newMessage);

    return success(newMessage, requestId, 201);
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        {
          code: error.code as 'VALIDATION_FAILED',
          message: error.message,
          status: error.statusCode,
        },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to send message.', status: 500 },
      requestId,
    );
  }
}
