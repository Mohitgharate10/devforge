import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { success } from '@/server/shared/http/api-response';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const categories = await prisma.jobCategory.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return success({ categories }, requestId);
  } catch {
    // Fallback curated categories if database is offline
    const fallbackCategories = [
      {
        id: 'cat-1',
        slug: 'smart-contracts',
        name: 'Smart Contract Development',
        description: 'EVM, Solana, Substrate development',
        children: [],
      },
      {
        id: 'cat-2',
        slug: 'web3-frontend',
        name: 'Web3 Frontend & DApps',
        description: 'Next.js, React, wagmi, wallet integration',
        children: [],
      },
      {
        id: 'cat-3',
        slug: 'security-auditing',
        name: 'Protocol Security & Auditing',
        description: 'Penetration testing and contract reviews',
        children: [],
      },
      {
        id: 'cat-4',
        slug: 'infrastructure',
        name: 'Node & Subgraph Infrastructure',
        description: 'RPC nodes, indexers, validators, DevOps',
        children: [],
      },
    ];
    return success({ categories: fallbackCategories }, requestId);
  }
}
