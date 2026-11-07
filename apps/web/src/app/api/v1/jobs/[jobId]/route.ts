import { NextResponse } from 'next/server';
import {
  prisma,
  type Job,
  type JobCategory,
  type ClientProfile,
  type JobSkill,
  type Skill,
} from '@devforge/database';
import { updateJobRequestSchema } from '@devforge/api-contracts';
import {
  validateBudget,
  validateJobTitle,
  validateJobDescription,
  normalizeCurrency,
  assertJobOwnership,
  DomainError,
  NotFoundError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { findCanonicalBounty } from '@/lib/canonical-marketplace';

type JobWithRelations = Job & {
  category: JobCategory;
  clientProfile: ClientProfile;
  skills: Array<JobSkill & { skill: Skill }>;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { jobId } = await params;

  try {
    let job: JobWithRelations | null = null;

    try {
      job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          category: true,
          clientProfile: true,
          skills: {
            include: { skill: true },
          },
        },
      });
    } catch {
      // Offline demo fallback
      job = null;
    }

    if (!job) {
      const canonical = findCanonicalBounty(jobId);
      if (canonical) {
        return success(
          {
            id: canonical.id,
            title: canonical.title,
            description: canonical.description,
            category: canonical.category,
            client: canonical.client,
            budgetMin: canonical.budgetMin,
            budgetMax: canonical.budgetMax,
            currency: canonical.currency,
            status: 'PUBLISHED',
            skills: canonical.skills.map((s, idx) => ({
              skillId: `skill-${idx}`,
              name: s,
              slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              requirementLevel: 'REQUIRED',
            })),
            publishedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          requestId,
        );
      }
      throw new NotFoundError('Job');
    }

    return success(
      {
        id: job.id,
        title: job.title,
        description: job.description,
        category: {
          id: job.category.id,
          name: job.category.name,
          slug: job.category.slug,
        },
        client: {
          id: job.clientProfile.id,
          organizationName: job.clientProfile.organizationName,
          slug: job.clientProfile.slug,
        },
        budgetMin: job.budgetMin ? Number(job.budgetMin) : null,
        budgetMax: job.budgetMax ? Number(job.budgetMax) : null,
        currency: job.currency,
        status: job.status,
        skills: job.skills.map((js) => ({
          skillId: js.skillId,
          name: js.skill.name,
          slug: js.skill.slug,
          requirementLevel: js.requirementLevel,
        })),
        publishedAt: job.publishedAt ? job.publishedAt.toISOString() : null,
        createdAt: job.createdAt.toISOString(),
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'NOT_FOUND', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Could not fetch job.', status: 500 },
      requestId,
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { jobId } = await params;

  try {
    const actor = await requireSession();
    const body = await request.json();
    const parsed = updateJobRequestSchema.parse(body);

    const existing = await prisma.job.findUnique({
      where: { id: jobId },
      include: { clientProfile: true },
    });

    if (!existing) {
      throw new NotFoundError('Job');
    }

    assertJobOwnership(actor.userId, existing.clientProfile.userId);

    const title = parsed.title ? validateJobTitle(parsed.title) : undefined;
    const description = parsed.description ? validateJobDescription(parsed.description) : undefined;
    if (parsed.budgetMin !== undefined || parsed.budgetMax !== undefined) {
      validateBudget(
        parsed.budgetMin ?? Number(existing.budgetMin),
        parsed.budgetMax ?? Number(existing.budgetMax),
      );
    }
    const currency = parsed.currency ? normalizeCurrency(parsed.currency) : undefined;

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(parsed.categoryId !== undefined && { categoryId: parsed.categoryId }),
        ...(parsed.budgetMin !== undefined && { budgetMin: BigInt(parsed.budgetMin) }),
        ...(parsed.budgetMax !== undefined && { budgetMax: BigInt(parsed.budgetMax) }),
        ...(currency !== undefined && { currency }),
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
        id: updated.id,
        title: updated.title,
        description: updated.description,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'FORBIDDEN', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Could not update job listing.', status: 500 },
      requestId,
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { jobId } = await params;

  try {
    const actor = await requireSession();
    const existing = await prisma.job.findUnique({
      where: { id: jobId },
      include: { clientProfile: true },
    });

    if (!existing) {
      throw new NotFoundError('Job');
    }

    assertJobOwnership(actor.userId, existing.clientProfile.userId);

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'ARCHIVED' },
    });

    return success({ message: 'Job archived successfully.' }, requestId);
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'FORBIDDEN', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Could not archive job listing.', status: 500 },
      requestId,
    );
  }
}
