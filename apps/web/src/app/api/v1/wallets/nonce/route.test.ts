import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  walletNonce: {
    create: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { POST } from './route';

describe('POST /api/v1/wallets/nonce', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const request = new Request('http://localhost/api/v1/wallets/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '0x71C84164b3c915122e265646cD8266395A344e45',
        chainId: 1,
        action: 'link',
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 201 when authenticated with valid payload', async () => {
    mockPrisma.walletNonce.create.mockResolvedValueOnce({
      id: 'wn-1',
      nonce: 'nonce123',
    });

    const request = new Request('http://localhost/api/v1/wallets/nonce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-123',
      },
      body: JSON.stringify({
        address: '0x71C84164b3c915122e265646cD8266395A344e45',
        chainId: 1,
        action: 'link',
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.nonce).toBeDefined();
    expect(json.data.message).toBeDefined();
    expect(mockPrisma.walletNonce.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-123',
          address: '0x71c84164b3c915122e265646cd8266395a344e45',
        }),
      }),
    );
  });
});
