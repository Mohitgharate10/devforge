import { NextResponse } from 'next/server';
import {
  prisma,
  type Job,
  type JobCategory,
  type ClientProfile,
  type JobSkill,
  type Skill,
} from '@devforge/database';
import {
  createJobRequestSchema,
  searchJobsQuerySchema,
} from '@devforge/api-contracts';
import {
  validateBudget,
  validateJobTitle,
  validateJobDescription,
  normalizeCurrency,
  DomainError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireRole } from '@/server/auth/middleware';

type JobWithRelations = Job & {
  category: JobCategory;
  clientProfile: ClientProfile;
  skills: Array<JobSkill & { skill: Skill }>;
};

const SAMPLE_DEMO_JOBS = [
  {
    id: 'job-bridge-audit',
    title: 'EVM & Substrate Cross-Chain Bridge Security Audit',
    description:
      'Seeking a senior smart contract security researcher to perform a rigorous formal verification and manual audit on our EIP-712 token bridge contracts before mainnet release.\nScope covers reentrancy guards, replay attack mitigation, and multi-sig emergency pauses.',
    category: {
      id: 'cat-security',
      name: 'Smart Contract Auditing',
      slug: 'security-auditing',
    },
    client: {
      id: 'client-polka',
      organizationName: 'Parity Ecosystem Fund',
      slug: 'parity-ecosystem',
    },
    budgetMin: 1200000,
    budgetMax: 1800000,
    currency: 'USDC',
    status: 'PUBLISHED' as const,
    skills: [
      { skillId: 's-solidity', name: 'Solidity', slug: 'solidity', requirementLevel: 'REQUIRED' as const },
      { skillId: 's-foundry', name: 'Foundry', slug: 'foundry', requirementLevel: 'REQUIRED' as const },
      { skillId: 's-rust', name: 'Rust', slug: 'rust', requirementLevel: 'PREFERRED' as const },
    ],
    publishedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: 'job-zk-circuit',
    title: 'ZK-Rollup Proof Verifier Circuit Optimization',
    description:
      'We need a cryptography systems specialist to optimize on-chain Groth16 / Plonk proof verification contracts on Sepolia.\nGoal is reducing verification gas consumption by at least 25% while maintaining soundness.',
    category: {
      id: 'cat-zk',
      name: 'Zero Knowledge & Cryptography',
      slug: 'zero-knowledge',
    },
    client: {
      id: 'client-zk-labs',
      organizationName: 'Axiom Research Labs',
      slug: 'axiom-research',
    },
    budgetMin: 1500000,
    budgetMax: 2500000,
    currency: 'USDC',
    status: 'PUBLISHED' as const,
    skills: [
      { skillId: 's-zk', name: 'Zero-Knowledge', slug: 'zero-knowledge', requirementLevel: 'REQUIRED' as const },
      { skillId: 's-rust', name: 'Rust', slug: 'rust', requirementLevel: 'REQUIRED' as const },
      { skillId: 's-viem', name: 'Viem', slug: 'viem', requirementLevel: 'PREFERRED' as const },
    ],
    publishedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
  {
    id: 'job-escrow-ui',
    title: 'Polkadot-Aesthetic Web3 Escrow Terminal',
    description:
      'Looking for a frontend specialist to craft high-frequency milestone settlement dashboards with Next.js 16, Viem, and custom SVG telemetry.',
    category: {
      id: 'cat-frontend',
      name: 'Full Stack Web3',
      slug: 'fullstack-web3',
    },
    client: {
      id: 'client-forge',
      organizationName: 'DevForge Labs',
      slug: 'devforge-labs',
    },
    budgetMin: 800000,
    budgetMax: 1400000,
    currency: 'USDC',
    status: 'PUBLISHED' as const,
    skills: [
      { skillId: 's-next', name: 'Next.js', slug: 'nextjs', requirementLevel: 'REQUIRED' as const },
      { skillId: 's-ts', name: 'TypeScript', slug: 'typescript', requirementLevel: 'REQUIRED' as const },
      { skillId: 's-viem', name: 'Viem', slug: 'viem', requirementLevel: 'REQUIRED' as const },
    ],
    publishedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
  },
];

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const parsed = searchJobsQuerySchema.parse(queryParams);

    let jobs: JobWithRelations[] = [];

    try {
      const skillSlugs = parsed.skills ? parsed.skills.split(',').map((s) => s.trim()) : [];

      jobs = await prisma.job.findMany({
        where: {
          status: parsed.status,
          ...(parsed.categoryId && { categoryId: parsed.categoryId }),
          ...(parsed.q && {
            OR: [
              { title: { contains: parsed.q, mode: 'insensitive' } },
              { description: { contains: parsed.q, mode: 'insensitive' } },
            ],
          }),
          ...(parsed.minBudget && { budgetMin: { gte: BigInt(parsed.minBudget) } }),
          ...(parsed.maxBudget && { budgetMax: { lte: BigInt(parsed.maxBudget) } }),
          ...(skillSlugs.length > 0 && {
            skills: {
              some: {
                skill: {
                  slug: { in: skillSlugs },
                },
              },
            },
          }),
        },
        include: {
          category: true,
          clientProfile: true,
          skills: {
            include: { skill: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: parsed.limit,
      });
    } catch {
      // Local database offline fallback
      let filtered = SAMPLE_DEMO_JOBS;
      if (parsed.q) {
        const qLower = parsed.q.toLowerCase();
        filtered = filtered.filter(
          (j) =>
            j.title.toLowerCase().includes(qLower) ||
            j.description.toLowerCase().includes(qLower),
        );
      }
      return success(
        {
          items: filtered,
          total: filtered.length,
          hasMore: false,
          isLocalDemo: true,
        },
        requestId,
      );
    }

    const items = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      category: {
        id: j.category.id,
        name: j.category.name,
        slug: j.category.slug,
      },
      client: {
        id: j.clientProfile.id,
        organizationName: j.clientProfile.organizationName,
        slug: j.clientProfile.slug,
      },
      budgetMin: j.budgetMin ? Number(j.budgetMin) : null,
      budgetMax: j.budgetMax ? Number(j.budgetMax) : null,
      currency: j.currency,
      status: j.status,
      skills: j.skills.map((js) => ({
        skillId: js.skillId,
        name: js.skill.name,
        slug: js.skill.slug,
        requirementLevel: js.requirementLevel,
      })),
      publishedAt: j.publishedAt ? j.publishedAt.toISOString() : null,
      createdAt: j.createdAt.toISOString(),
    }));

    return success(
      {
        items,
        total: items.length,
        hasMore: false,
        isLocalDemo: false,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'VALIDATION_FAILED', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while fetching jobs.', status: 500 },
      requestId,
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await requireRole('client');
    const body = await request.json();
    const parsed = createJobRequestSchema.parse(body);

    const title = validateJobTitle(parsed.title);
    const description = validateJobDescription(parsed.description);
    validateBudget(parsed.budgetMin, parsed.budgetMax);
    const currency = normalizeCurrency(parsed.currency);

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: actor.userId },
    });

    if (!clientProfile) {
      return failure(
        {
          code: 'FORBIDDEN',
          message: 'Client profile must be created before publishing jobs.',
          status: 403,
        },
        requestId,
      );
    }

    const job = await prisma.job.create({
      data: {
        clientProfileId: clientProfile.id,
        categoryId: parsed.categoryId,
        title,
        description,
        budgetMin: parsed.budgetMin !== undefined ? BigInt(parsed.budgetMin) : null,
        budgetMax: parsed.budgetMax !== undefined ? BigInt(parsed.budgetMax) : null,
        currency,
        status: 'DRAFT',
        skills: {
          create: (parsed.skills ?? []).map((s) => ({
            skillId: s.skillId,
            requirementLevel: s.requirementLevel,
          })),
        },
      },
      include: {
        category: true,
        clientProfile: true,
        skills: {
          include: { skill: true },
        },
      },
    });

    return success(
      {
        id: job.id,
        title: job.title,
        description: job.description,
        status: job.status,
        currency: job.currency,
        budgetMin: job.budgetMin ? Number(job.budgetMin) : null,
        budgetMax: job.budgetMax ? Number(job.budgetMax) : null,
        createdAt: job.createdAt.toISOString(),
      },
      requestId,
      201,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'VALIDATION_FAILED', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Could not create job listing.', status: 500 },
      requestId,
    );
  }
}
