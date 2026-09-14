import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { searchFreelancersQuerySchema } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const parsed = searchFreelancersQuerySchema.parse(queryParams);

    const skillSlugs = parsed.skills ? parsed.skills.split(',').map((s) => s.trim()) : [];

    const freelancers = await prisma.freelancerProfile.findMany({
      where: {
        ...(parsed.availability && { availability: parsed.availability }),
        ...(parsed.q && {
          OR: [
            { title: { contains: parsed.q, mode: 'insensitive' } },
            { bio: { contains: parsed.q, mode: 'insensitive' } },
            { handle: { contains: parsed.q, mode: 'insensitive' } },
          ],
        }),
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
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
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
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parsed.limit,
    });

    const items = freelancers.map((f) => ({
      id: f.id,
      handle: f.handle,
      displayName: f.user.displayName,
      avatarUrl: f.user.avatarUrl,
      title: f.title,
      bio: f.bio,
      hourlyRate: f.hourlyRate ? Number(f.hourlyRate) : null,
      availability: f.availability,
      primaryWallet: f.user.wallets[0] ?? null,
      skills: f.skills.map((s) => ({
        name: s.skill.name,
        slug: s.skill.slug,
        category: s.skill.category,
        proficiency: s.proficiency,
      })),
      recentProjects: f.portfolioProjects,
      createdAt: f.createdAt.toISOString(),
    }));

    return success({ items, count: items.length }, requestId);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return failure({ code: 'VALIDATION_FAILED', message: error.message, status: 400 }, requestId);
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      requestId,
    );
  }
}
