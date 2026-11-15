import { NextResponse } from 'next/server';
import { prisma, type MessageType } from '@devforge/database';
import { sendMessageRequestSchema } from '@devforge/api-contracts';
import type { ApiErrorCode } from '@devforge/api-contracts';
import { validateMessageContent, sanitizeMessageContent, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { demoStore, type DemoMessage } from '@/server/engagement/demo-data';
import { enforceRateLimit, MESSAGE_POST_RATE_LIMIT } from '@/server/shared/rate-limit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { conversationId } = await params;

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

  const isAdmin = actor.roles.some((r) => r.toLowerCase() === 'admin');

  try {
    try {
      const conv = await prisma.conversation.findFirst({
        where: {
          OR: [{ id: conversationId }, { contractId: conversationId }],
        },
        include: {
          members: true,
          contract: {
            include: {
              clientProfile: true,
              freelancerProfile: true,
              participants: true,
            },
          },
        },
      });

      if (conv) {
        const isParticipant =
          conv.members.some((m) => m.userId === actor.userId) ||
          conv.contract?.clientProfile?.userId === actor.userId ||
          conv.contract?.freelancerProfile?.userId === actor.userId ||
          (conv.contract?.participants?.some((p) => p.userId === actor.userId) ?? false);

        if (!isParticipant && !isAdmin) {
          return failure(
            {
              code: 'FORBIDDEN',
              message: 'You must be a participant in this conversation to view messages.',
              status: 403,
            },
            requestId,
          );
        }

        const messages = await prisma.message.findMany({
          where: { conversationId: conv.id },
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
      // Database offline - fallback to demo store in demo mode
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          { code: 'INTERNAL_ERROR', message: 'Failed to retrieve messages.', status: 500 },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE !== 'true') {
      return failure(
        { code: 'NOT_FOUND', message: 'Conversation not found.', status: 404 },
        requestId,
      );
    }

    let demoConv = demoStore
      .getConversations()
      .find((c) => c.id === conversationId || c.contractId === conversationId);
    if (!demoConv) {
      demoConv = demoStore.getConversationByContractId(conversationId);
    }

    if (!demoConv) {
      return failure(
        { code: 'NOT_FOUND', message: 'Conversation not found.', status: 404 },
        requestId,
      );
    }

    const isDemoParticipant = demoConv.members.some((m) => m.userId === actor.userId);
    if (!isDemoParticipant && !isAdmin) {
      return failure(
        {
          code: 'FORBIDDEN',
          message: 'You must be a participant in this conversation to view messages.',
          status: 403,
        },
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

  // Rate limiting check
  const rateLimitRes = await enforceRateLimit(request, MESSAGE_POST_RATE_LIMIT);
  if (rateLimitRes) {
    return rateLimitRes;
  }

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

  const isAdmin = actor.roles.some((r) => r.toLowerCase() === 'admin');

  try {
    const body = await request.json();
    const parsed = sendMessageRequestSchema.parse(body);

    const validContent = validateMessageContent(parsed.content);
    const sanitized = sanitizeMessageContent(validContent);

    try {
      const conv = await prisma.conversation.findFirst({
        where: {
          OR: [{ id: conversationId }, { contractId: conversationId }],
        },
        include: {
          members: true,
          contract: {
            include: {
              clientProfile: true,
              freelancerProfile: true,
              participants: true,
            },
          },
        },
      });

      if (conv) {
        const isParticipant =
          conv.members.some((m) => m.userId === actor.userId) ||
          conv.contract?.clientProfile?.userId === actor.userId ||
          conv.contract?.freelancerProfile?.userId === actor.userId ||
          (conv.contract?.participants?.some((p) => p.userId === actor.userId) ?? false);

        if (!isParticipant && !isAdmin) {
          return failure(
            {
              code: 'FORBIDDEN',
              message: 'You must be a participant in this conversation to post messages.',
              status: 403,
            },
            requestId,
          );
        }

        // Sender ID derived exclusively from authenticated session
        const senderId = actor.userId;
        const userExists = await prisma.user.findUnique({ where: { id: senderId } });
        if (userExists) {
          const message = await prisma.message.create({
            data: {
              conversationId: conv.id,
              senderId: userExists.id,
              content: sanitized,
              type: parsed.type as MessageType,
            },
            include: { sender: true },
          });

          await prisma.conversation.update({
            where: { id: conv.id },
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
      }
    } catch {
      // Database offline - fallback to demo store in demo mode
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          { code: 'INTERNAL_ERROR', message: 'Failed to send message in database.', status: 500 },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE !== 'true') {
      return failure(
        { code: 'NOT_FOUND', message: 'Conversation not found.', status: 404 },
        requestId,
      );
    }

    // Determine target demo conversation — do NOT create conversations for arbitrary IDs
    let targetConv = demoStore
      .getConversations()
      .find((c) => c.id === conversationId || c.contractId === conversationId);
    if (!targetConv) {
      targetConv = demoStore.getConversationByContractId(conversationId);
    }

    if (!targetConv) {
      return failure(
        { code: 'NOT_FOUND', message: 'Conversation not found.', status: 404 },
        requestId,
      );
    }

    const isDemoParticipant = targetConv.members.some((m) => m.userId === actor.userId);
    if (!isDemoParticipant && !isAdmin) {
      return failure(
        {
          code: 'FORBIDDEN',
          message: 'You must be a participant in this conversation to post messages.',
          status: 403,
        },
        requestId,
      );
    }

    const senderId = actor.userId;
    const memberRecord = targetConv.members.find((m) => m.userId === senderId);
    const senderName = memberRecord?.displayName ?? 'DevForge Member';

    const newMessage: DemoMessage = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      conversationId: targetConv.id,
      senderId,
      senderName,
      senderAvatar: memberRecord?.avatarUrl ?? null,
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
          code: error.code as ApiErrorCode,
          message: error.message,
          status: error.statusCode,
        },
        requestId,
      );
    }
    return failure(
      { code: 'VALIDATION_FAILED', message: 'Failed to send message.', status: 400 },
      requestId,
    );
  }
}
