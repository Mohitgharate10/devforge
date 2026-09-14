import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { normalizeHandle, NotFoundError, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { handle: rawHandle } = await params;
  const handle = normalizeHandle(rawHandle);

  try {
    const freelancer = await prisma.freelancerProfile.findUnique({
      where: { handle },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
            wallets: {
              where: { isPrimary: true },
              select: { address: true, chainId: true },
            },
          },
        },
        skills: {
          include: { skill: true },
          orderBy: { displayOrder: 'asc' },
        },
        portfolioProjects: {
          where: { isPublished: true },
          orderBy: { displayOrder: 'asc' },
        },
        experiences: {
          orderBy: { startDate: 'desc' },
        },
        certifications: {
          orderBy: { issuedAt: 'desc' },
        },
      },
    });

    if (!freelancer) {
      throw new NotFoundError('Freelancer profile');
    }

    return success(
      {
        id: freelancer.id,
        handle: freelancer.handle,
        displayName: freelancer.user.displayName,
        avatarUrl: freelancer.user.avatarUrl,
        title: freelancer.title,
        bio: freelancer.bio,
        hourlyRate: freelancer.hourlyRate ? Number(freelancer.hourlyRate) : null,
        availability: freelancer.availability,
        memberSince: freelancer.user.createdAt.toISOString(),
        primaryWallet: freelancer.user.wallets[0] ?? null,
        skills: freelancer.skills.map((s) => ({
          id: s.skillId,
          name: s.skill.name,
          slug: s.skill.slug,
          category: s.skill.category,
          proficiency: s.proficiency,
        })),
        portfolioProjects: freelancer.portfolioProjects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          projectUrl: p.projectUrl,
          repositoryUrl: p.repositoryUrl,
          coverImageUrl: p.coverImageUrl,
        })),
        experiences: freelancer.experiences.map((e) => ({
          id: e.id,
          company: e.company,
          role: e.role,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate ? e.endDate.toISOString() : null,
          description: e.description,
        })),
        certifications: freelancer.certifications.map((c) => ({
          id: c.id,
          name: c.name,
          issuer: c.issuer,
          issuedAt: c.issuedAt.toISOString(),
          expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
          credentialUrl: c.credentialUrl,
        })),
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
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      requestId,
    );
  }
}
