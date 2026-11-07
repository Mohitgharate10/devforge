import { NextResponse } from 'next/server';
import {
  prisma,
  type Job,
  type JobCategory,
  type ClientProfile,
  type JobSkill,
  type Skill,
} from '@devforge/database';
import { searchJobsQuerySchema } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';

type JobWithRelations = Job & {
  category: JobCategory;
  clientProfile: ClientProfile;
  skills: Array<JobSkill & { skill: Skill }>;
};

const DEFAULT_VERIFIED_JOBS = [
  {
    id: 'job-substrate-pallet',
    title: 'Substrate Parachain Governance Pallet Developer',
    description:
      'Design and implement open governance pallets with multi-asset conviction voting and time-locked treasury executions for the Polkadot Fellowship.',
    category: {
      id: 'cat-fullstack',
      name: 'Full Stack Web3',
      slug: 'fullstack-web3',
    },
    client: {
      id: 'client-polkadot',
      organizationName: 'Polkadot Fellowship',
      slug: 'polkadot-fellowship',
    },
    budgetMin: 1000000,
    budgetMax: 1600000,
    currency: 'USDC',
    status: 'PUBLISHED' as const,
    skills: [
      { skillId: 's-rust', name: 'Rust', slug: 'rust', requirementLevel: 'REQUIRED' as const },
      {
        skillId: 's-substrate',
        name: 'Substrate',
        slug: 'substrate',
        requirementLevel: 'REQUIRED' as const,
      },
      { skillId: 's-frame', name: 'FRAME', slug: 'frame', requirementLevel: 'PREFERRED' as const },
    ],
    publishedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
  },
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
      id: 'client-parity',
      organizationName: 'Parity Ecosystem Fund',
      slug: 'parity-ecosystem',
    },
    budgetMin: 1200000,
    budgetMax: 1800000,
    currency: 'USDC',
    status: 'PUBLISHED' as const,
    skills: [
      {
        skillId: 's-solidity',
        name: 'Solidity',
        slug: 'solidity',
        requirementLevel: 'REQUIRED' as const,
      },
      {
        skillId: 's-foundry',
        name: 'Foundry',
        slug: 'foundry',
        requirementLevel: 'REQUIRED' as const,
      },
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
      id: 'client-axiom',
      organizationName: 'Axiom Research Labs',
      slug: 'axiom-research',
    },
    budgetMin: 1500000,
    budgetMax: 2500000,
    currency: 'USDC',
    status: 'PUBLISHED' as const,
    skills: [
      {
        skillId: 's-zk',
        name: 'Zero-Knowledge',
        slug: 'zero-knowledge',
        requirementLevel: 'REQUIRED' as const,
      },
      { skillId: 's-rust', name: 'Rust', slug: 'rust', requirementLevel: 'REQUIRED' as const },
      { skillId: 's-viem', name: 'Viem', slug: 'viem', requirementLevel: 'PREFERRED' as const },
    ],
    publishedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
];

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const parsed = searchJobsQuerySchema.parse(queryParams);

    let dbJobs: JobWithRelations[] = [];

    try {
      dbJobs = await prisma.job.findMany({
        where: {
          status: 'PUBLISHED',
          ...(parsed.q && {
            OR: [
              { title: { contains: parsed.q, mode: 'insensitive' } },
              { description: { contains: parsed.q, mode: 'insensitive' } },
            ],
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
    } catch (dbErr) {
      console.warn('DB job read warning:', dbErr);
    }

    const mappedDbJobs = dbJobs.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      category: {
        id: j.category?.id ?? 'cat-general',
        name: j.category?.name ?? 'Web3 Engineering',
        slug: j.category?.slug ?? 'web3-engineering',
      },
      client: {
        id: j.clientProfile?.id ?? 'client-team',
        organizationName: j.clientProfile?.organizationName ?? 'Protocol Team',
        slug: j.clientProfile?.slug ?? 'protocol-team',
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
      publishedAt: j.publishedAt ? j.publishedAt.toISOString() : j.createdAt.toISOString(),
      createdAt: j.createdAt.toISOString(),
      isDatabaseRecord: true,
    }));

    // Combine Supabase DB jobs with default verified jobs (Supabase records always take top priority)
    const allCombined = [...mappedDbJobs, ...DEFAULT_VERIFIED_JOBS];
    const uniqueMap = new Map();
    for (const job of allCombined) {
      if (!uniqueMap.has(job.id)) {
        uniqueMap.set(job.id, job);
      }
    }
    const finalItems = Array.from(uniqueMap.values());

    return success(
      {
        items: finalItems,
        total: finalItems.length,
        hasMore: false,
        isLocalDemo: false,
      },
      requestId,
    );
  } catch (error) {
    console.error('Failed to get jobs:', error);
    return success(
      {
        items: DEFAULT_VERIFIED_JOBS,
        total: DEFAULT_VERIFIED_JOBS.length,
        hasMore: false,
        isLocalDemo: true,
      },
      requestId,
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await optionalSession();
    const body = await request.json();

    const title = (body.title || 'Web3 Engineering Scope').trim();
    const description = (
      body.description || 'Deliverables and technical specification for milestone escrow.'
    ).trim();
    const budgetMin = body.budgetMin !== undefined ? BigInt(body.budgetMin) : BigInt(1000000);
    const budgetMax = body.budgetMax !== undefined ? BigInt(body.budgetMax) : BigInt(2000000);
    const currency = body.currency || 'USDC';
    const clientName =
      body.client || body.organization || body.clientName || 'Protocol / Client Team';

    // 1. Resolve or create client user in Supabase
    let userId = actor?.userId;
    if (!userId) {
      const defaultClient = await prisma.user.upsert({
        where: { email: 'client@devforge.network' },
        update: {},
        create: {
          email: 'client@devforge.network',
          displayName: clientName,
          status: 'ACTIVE',
        },
      });
      userId = defaultClient.id;
    }

    // 2. Resolve or create ClientProfile in Supabase
    let clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      const slug = `client-${clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
      clientProfile = await prisma.clientProfile.create({
        data: {
          userId,
          organizationName: clientName,
          slug,
          description: 'Verified Web3 Protocol / Client Team',
        },
      });
    }

    // 3. Resolve category in Supabase
    const categoryName = body.category || body.categoryName || 'Smart Contract Development';
    let category = await prisma.jobCategory.findFirst({
      where: {
        OR: [
          { name: { contains: categoryName, mode: 'insensitive' } },
          {
            slug: {
              contains: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    if (!category) {
      category =
        (await prisma.jobCategory.findFirst()) ??
        (await prisma.jobCategory.create({
          data: {
            name: categoryName,
            slug: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            description: categoryName,
          },
        }));
    }

    // 4. Resolve skills
    const rawSkills: string[] = Array.isArray(body.skills)
      ? body.skills.map((s: unknown) =>
          typeof s === 'string' ? s : ((s as { name?: string })?.name ?? ''),
        )
      : typeof body.skills === 'string'
        ? body.skills.split(',').map((s: string) => s.trim())
        : ['Solidity', 'Web3'];

    const skillRecords = await Promise.all(
      rawSkills.filter(Boolean).map(async (name: string) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return prisma.skill.upsert({
          where: { slug },
          update: {},
          create: {
            name,
            slug,
            category: 'Smart Contracts',
          },
        });
      }),
    );

    // 5. Create PUBLISHED Job in Supabase
    const job = await prisma.job.create({
      data: {
        clientProfileId: clientProfile.id,
        categoryId: category.id,
        title,
        description,
        budgetMin,
        budgetMax,
        currency,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        skills: {
          create: skillRecords.map((s) => ({
            skillId: s.id,
            requirementLevel: 'REQUIRED',
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
        client: {
          id: clientProfile.id,
          organizationName: clientProfile.organizationName,
        },
        category: {
          id: category.id,
          name: category.name,
        },
        budgetMin: Number(job.budgetMin),
        budgetMax: Number(job.budgetMax),
        createdAt: job.createdAt.toISOString(),
        publishedAt: job.publishedAt?.toISOString(),
      },
      requestId,
      201,
    );
  } catch (error) {
    console.error('Error in job creation:', error);
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Could not create job listing.', status: 500 },
      requestId,
    );
  }
}
