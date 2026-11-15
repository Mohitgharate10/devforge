import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  prisma,
  type Job,
  type JobCategory,
  type ClientProfile,
  type JobSkill,
  type Skill,
} from '@devforge/database';
import { searchJobsQuerySchema } from '@devforge/api-contracts';
import type { ApiErrorCode } from '@devforge/api-contracts';
import { DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { enforceRateLimit, JOB_CREATE_RATE_LIMIT } from '@/server/shared/rate-limit';

import { CANONICAL_BOUNTIES } from '@/lib/canonical-marketplace';

const createJobBodySchema = z
  .object({
    title: z
      .string({ message: 'Title is required.' })
      .trim()
      .min(5, 'Title must be at least 5 characters.')
      .max(200, 'Title must be at most 200 characters.'),
    description: z
      .string({ message: 'Description is required.' })
      .trim()
      .min(20, 'Description must be at least 20 characters.')
      .max(10000, 'Description must be at most 10000 characters.'),
    budgetMin: z
      .number({ message: 'budgetMin is required.' })
      .int('budgetMin must be an integer.')
      .positive('budgetMin must be a positive integer.'),
    budgetMax: z
      .number({ message: 'budgetMax is required.' })
      .int('budgetMax must be an integer.')
      .positive('budgetMax must be a positive integer.'),
    currency: z.string().default('USDC'),
    client: z.string().optional(),
    organization: z.string().optional(),
    clientName: z.string().optional(),
    category: z.string().optional(),
    categoryName: z.string().optional(),
    skills: z
      .union([
        z.array(z.union([z.string(), z.object({ name: z.string().optional() })])),
        z.string(),
      ])
      .optional(),
  })
  .refine((data) => data.budgetMin <= data.budgetMax, {
    message: 'budgetMin must be less than or equal to budgetMax.',
    path: ['budgetMax'],
  });

type JobWithRelations = Job & {
  category: JobCategory;
  clientProfile: ClientProfile;
  skills: Array<JobSkill & { skill: Skill }>;
};

const DEFAULT_VERIFIED_JOBS = CANONICAL_BOUNTIES.map((b, index) => ({
  id: b.id,
  title: b.title,
  description: b.description,
  category: {
    id: b.category.id,
    name: b.category.name,
    slug: b.category.slug,
  },
  client: {
    id: b.client.id,
    organizationName: b.client.organizationName,
    slug: b.client.slug,
  },
  budgetMin: b.budgetMin * 100,
  budgetMax: b.budgetMax * 100,
  currency: b.currency,
  status: 'PUBLISHED' as const,
  skills: b.skills.map((s, sIndex) => ({
    skillId: `s-${s.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    name: s,
    slug: s.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    requirementLevel: sIndex < 2 ? ('REQUIRED' as const) : ('PREFERRED' as const),
  })),
  publishedAt: new Date(Date.now() - 3600 * 1000 * (index + 1) * 3).toISOString(),
  createdAt: new Date(Date.now() - 3600 * 1000 * (index + 1) * 8).toISOString(),
}));

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

  // Rate limiting check
  const rateLimitRes = await enforceRateLimit(request, JOB_CREATE_RATE_LIMIT);
  if (rateLimitRes) {
    return rateLimitRes;
  }

  // Authentication and client role requirement
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

  const isClient = actor.roles.some((r) => r.toLowerCase() === 'client');
  const isAdmin = actor.roles.some((r) => r.toLowerCase() === 'admin');
  if (!isClient && !isAdmin) {
    return failure(
      { code: 'FORBIDDEN', message: "Role 'client' is required to create a job.", status: 403 },
      requestId,
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return failure(
        { code: 'VALIDATION_FAILED', message: 'Invalid JSON request body.', status: 400 },
        requestId,
      );
    }

    const parsed = createJobBodySchema.safeParse(body);
    if (!parsed.success) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: parsed.error.issues[0]?.message ?? 'Invalid job creation payload.',
          status: 400,
        },
        requestId,
      );
    }

    const {
      title,
      description,
      budgetMin: budgetMinNum,
      budgetMax: budgetMaxNum,
      currency,
      client,
      organization,
      clientName: rawClientName,
      category: bodyCategory,
      categoryName: bodyCategoryName,
      skills: bodySkills,
    } = parsed.data;

    const budgetMin = BigInt(budgetMinNum);
    const budgetMax = BigInt(budgetMaxNum);
    const clientName = client || organization || rawClientName || 'Client Team';
    const userId = actor.userId;

    // 1. Resolve or create ClientProfile in database (no shared default user)
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
          description: 'Web3 Protocol / Client Team',
        },
      });
    }

    // 2. Resolve category in database
    const categoryName = bodyCategory || bodyCategoryName || 'Smart Contract Development';
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

    // 3. Resolve skills
    const rawSkills: string[] = Array.isArray(bodySkills)
      ? bodySkills.map((s: unknown) =>
          typeof s === 'string' ? s : ((s as { name?: string })?.name ?? ''),
        )
      : typeof bodySkills === 'string'
        ? bodySkills.split(',').map((s: string) => s.trim())
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

    // 4. Create PUBLISHED Job in database
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
