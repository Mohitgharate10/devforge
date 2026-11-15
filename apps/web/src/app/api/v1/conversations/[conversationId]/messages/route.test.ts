import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  conversation: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  message: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from './route';

describe('/api/v1/conversations/:conversationId/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 when no session is provided', async () => {
      const request = new Request('http://localhost/api/v1/conversations/conv-1/messages', {
        method: 'GET',
      });
      const params = Promise.resolve({ conversationId: 'conv-1' });

      const res = await GET(request, { params });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 when user is not a participant in the conversation', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValueOnce({
        id: 'conv-1',
        members: [{ userId: 'user-a' }, { userId: 'user-b' }],
        contract: null,
      });

      const request = new Request('http://localhost/api/v1/conversations/conv-1/messages', {
        method: 'GET',
        headers: {
          'x-user-id': 'unrelated-user',
        },
      });
      const params = Promise.resolve({ conversationId: 'conv-1' });

      const res = await GET(request, { params });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 when user is a participant', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValueOnce({
        id: 'conv-1',
        members: [{ userId: 'user-a' }, { userId: 'user-b' }],
        contract: null,
      });
      mockPrisma.message.findMany.mockResolvedValueOnce([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-a',
          sender: { displayName: 'User A', avatarUrl: null },
          content: 'Hello World',
          type: 'TEXT',
          createdAt: new Date(),
        },
      ]);

      const request = new Request('http://localhost/api/v1/conversations/conv-1/messages', {
        method: 'GET',
        headers: {
          'x-user-id': 'user-a',
        },
      });
      const params = Promise.resolve({ conversationId: 'conv-1' });

      const res = await GET(request, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.items).toHaveLength(1);
    });

    it('returns 200 when caller is an admin', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValueOnce({
        id: 'conv-1',
        members: [{ userId: 'user-a' }, { userId: 'user-b' }],
        contract: null,
      });
      mockPrisma.message.findMany.mockResolvedValueOnce([]);

      const request = new Request('http://localhost/api/v1/conversations/conv-1/messages', {
        method: 'GET',
        headers: {
          'x-user-id': 'admin-user',
          'x-user-role': 'admin',
        },
      });
      const params = Promise.resolve({ conversationId: 'conv-1' });

      const res = await GET(request, { params });
      expect(res.status).toBe(200);
    });
  });

  describe('POST', () => {
    it('returns 401 when no session is provided', async () => {
      const request = new Request('http://localhost/api/v1/conversations/conv-1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Test message content',
          type: 'TEXT',
        }),
      });
      const params = Promise.resolve({ conversationId: 'conv-1' });

      const res = await POST(request, { params });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 when user is not a participant', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValueOnce({
        id: 'conv-1',
        members: [{ userId: 'user-a' }, { userId: 'user-b' }],
        contract: null,
      });

      const request = new Request('http://localhost/api/v1/conversations/conv-1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'attacker-user',
        },
        body: JSON.stringify({
          content: 'Intruder message',
          type: 'TEXT',
        }),
      });
      const params = Promise.resolve({ conversationId: 'conv-1' });

      const res = await POST(request, { params });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('returns 201 when user is a participant and derives senderId exclusively from session', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValueOnce({
        id: 'conv-1',
        members: [{ userId: 'user-a' }, { userId: 'user-b' }],
        contract: null,
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-a',
        displayName: 'User A',
      });
      mockPrisma.message.create.mockResolvedValueOnce({
        id: 'msg-created-1',
        conversationId: 'conv-1',
        senderId: 'user-a',
        content: 'Valid participant message',
        type: 'TEXT',
        sender: { displayName: 'User A', avatarUrl: null },
        createdAt: new Date(),
      });
      mockPrisma.conversation.update.mockResolvedValueOnce({});

      const request = new Request('http://localhost/api/v1/conversations/conv-1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-a',
        },
        body: JSON.stringify({
          content: 'Valid participant message',
          type: 'TEXT',
          senderId: 'spoofed-id', // Must be ignored
        }),
      });
      const params = Promise.resolve({ conversationId: 'conv-1' });

      const res = await POST(request, { params });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.senderId).toBe('user-a');
      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ senderId: 'user-a' }),
        }),
      );
    });
  });
});
