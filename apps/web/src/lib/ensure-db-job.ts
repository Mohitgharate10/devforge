import { prisma } from '@devforge/database';
import {
  findCanonicalBounty,
  getCanonicalJobUuid,
  type CanonicalBounty,
} from './canonical-marketplace';

export async function ensureDbJobForCanonicalBounty(bountyOrId: CanonicalBounty | string) {
  const bounty = typeof bountyOrId === 'string' ? findCanonicalBounty(bountyOrId) : bountyOrId;

  if (!bounty) return null;

  const jobUuid = getCanonicalJobUuid(bounty.id);
  if (!jobUuid) return null;

  try {
    // 1. Check if job already exists by UUID
    const existing = await prisma.job.findUnique({
      where: { id: jobUuid },
      include: {
        category: true,
        clientProfile: true,
      },
    });

    if (existing) {
      return existing;
    }

    // 2. Ensure system client user exists
    const clientUser = await prisma.user.upsert({
      where: { email: `${bounty.client.slug}@devforge.network` },
      update: {
        displayName: bounty.client.organizationName,
      },
      create: {
        email: `${bounty.client.slug}@devforge.network`,
        displayName: bounty.client.organizationName,
        status: 'ACTIVE',
      },
    });

    // 3. Ensure client profile exists
    const clientProfile = await prisma.clientProfile.upsert({
      where: { userId: clientUser.id },
      update: {
        organizationName: bounty.client.organizationName,
        slug: bounty.client.slug,
      },
      create: {
        userId: clientUser.id,
        organizationName: bounty.client.organizationName,
        slug: bounty.client.slug,
        description: `Official ${bounty.client.organizationName} protocol engineering fund.`,
      },
    });

    // 4. Ensure category exists
    let category = await prisma.jobCategory.findFirst({
      where: {
        OR: [{ slug: bounty.category.slug }, { name: bounty.category.name }],
      },
    });

    if (!category) {
      category = await prisma.jobCategory.create({
        data: {
          name: bounty.category.name,
          slug: bounty.category.slug,
          description: bounty.category.name,
        },
      });
    }

    // 5. Create canonical job with deterministic UUID
    return await prisma.job.create({
      data: {
        id: jobUuid,
        clientProfileId: clientProfile.id,
        categoryId: category.id,
        title: bounty.title,
        description: bounty.description,
        budgetMin: BigInt(bounty.budgetMin * 100),
        budgetMax: BigInt(bounty.budgetMax * 100),
        currency: bounty.currency,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: {
        category: true,
        clientProfile: true,
      },
    });
  } catch (err) {
    console.warn(
      `[ensureDbJobForCanonicalBounty] Database operation skipped or offline for ${bounty.id}:`,
      err,
    );
    return null;
  }
}
