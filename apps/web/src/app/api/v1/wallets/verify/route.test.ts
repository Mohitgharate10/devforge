import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  walletNonce: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  wallet: {
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('@devforge/domain', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@devforge/domain')>();
  return {
    ...actual,
    requireValidSignature: vi.fn().mockResolvedValue(true),
  };
});

import { POST } from './route';

describe('POST /api/v1/wallets/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const request = new Request('http://localhost/api/v1/wallets/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nonce: 'valid-nonce-1234',
        message: 'devforge.network wants you to sign in with your Ethereum account...',
        signature: '0x1234',
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 200 when authenticated and valid nonce/signature is provided', async () => {
    mockPrisma.walletNonce.findUnique.mockResolvedValueOnce({
      id: 'wn-1',
      nonce: 'valid-nonce-1234',
      address: '0x71c84164b3c915122e265646cd8266395a344e45',
      chainId: 1,
      expiresAt: new Date(Date.now() + 60000),
      usedAt: null,
    });
    mockPrisma.walletNonce.update.mockResolvedValueOnce({});
    mockPrisma.wallet.findUnique.mockResolvedValueOnce(null);
    mockPrisma.wallet.count.mockResolvedValueOnce(0);
    mockPrisma.wallet.create.mockResolvedValueOnce({
      id: 'w-1',
      chainId: 1,
      address: '0x71c84164b3c915122e265646cd8266395a344e45',
      isPrimary: true,
      label: null,
      createdAt: new Date(),
    });

    const request = new Request('http://localhost/api/v1/wallets/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-123',
      },
      body: JSON.stringify({
        nonce: 'valid-nonce-1234',
        message: 'devforge.network wants you to sign in with your Ethereum account...',
        signature: '0x1234',
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe('w-1');
    expect(json.data.address).toBe('0x71c84164b3c915122e265646cd8266395a344e45');
  });
});
