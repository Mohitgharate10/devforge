import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = ['freelancer', 'client', 'admin'] as const;

const PERMISSIONS = [
  'jobs:create',
  'jobs:manage',
  'proposals:create',
  'proposals:manage',
  'contracts:manage',
  'reports:read',
  'reports:act',
  'users:read',
  'users:manage',
  'audit:read',
  'taxonomy:manage',
] as const;

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  freelancer: ['proposals:create'],
  client: ['jobs:create'],
  admin: [
    'jobs:manage',
    'proposals:manage',
    'contracts:manage',
    'reports:read',
    'reports:act',
    'users:read',
    'users:manage',
    'audit:read',
    'taxonomy:manage',
  ],
};

async function main() {
  console.log('Seeding roles and permissions...');

  const roles = await Promise.all(
    ROLES.map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const permissions = await Promise.all(
    PERMISSIONS.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key },
      }),
    ),
  );

  const permissionMap = new Map(permissions.map((p) => [p.key, p.id]));
  const roleMap = new Map(roles.map((r) => [r.name, r.id]));

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSION_MAP)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;

    for (const permKey of permissionKeys) {
      const permissionId = permissionMap.get(permKey);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  console.log(`Seeded ${roles.length} roles, ${permissions.length} permissions.`);

  console.log('Seeding curated skills...');
  const SKILLS = [
    { slug: 'solidity', name: 'Solidity', category: 'Smart Contracts' },
    { slug: 'rust', name: 'Rust', category: 'Blockchain' },
    { slug: 'typescript', name: 'TypeScript', category: 'Frontend/Backend' },
    { slug: 'nextjs', name: 'Next.js', category: 'Frontend' },
    { slug: 'smart-contract-auditing', name: 'Smart Contract Auditing', category: 'Security' },
    { slug: 'zero-knowledge', name: 'Zero Knowledge (ZK)', category: 'Cryptography' },
    { slug: 'viem', name: 'Viem / Wagmi', category: 'Web3 Frontend' },
    { slug: 'hardhat', name: 'Hardhat / Foundry', category: 'Developer Tooling' },
    { slug: 'defi-protocols', name: 'DeFi Protocols', category: 'Architecture' },
  ];

  for (const s of SKILLS) {
    await prisma.skill.upsert({
      where: { slug: s.slug },
      update: { name: s.name, category: s.category },
      create: s,
    });
  }

  console.log('Seeding curated job categories...');
  const CATEGORIES = [
    {
      slug: 'smart-contracts',
      name: 'Smart Contract Development',
      description: 'EVM, Solana, Substrate development',
    },
    {
      slug: 'web3-frontend',
      name: 'Web3 Frontend & DApps',
      description: 'Next.js, React, wagmi, wallet integration',
    },
    {
      slug: 'security-auditing',
      name: 'Protocol Security & Auditing',
      description: 'Penetration testing and contract reviews',
    },
    {
      slug: 'infrastructure',
      name: 'Node & Subgraph Infrastructure',
      description: 'RPC nodes, indexers, validators, DevOps',
    },
  ];

  for (const c of CATEGORIES) {
    await prisma.jobCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    });
  }

  console.log('Seeding recruiter demo accounts...');
  const { hash } = await import('@node-rs/argon2');
  const demoPasswordHash = await hash('Password123!');

  // 1. Seed Specialist Demo Account (Freelancer)
  const specialistUser = await prisma.user.upsert({
    where: { email: 'specialist@devforge.network' },
    update: {
      displayName: 'Elena Rostova (Specialist Demo)',
      passwordHash: demoPasswordHash,
      status: 'ACTIVE',
    },
    create: {
      email: 'specialist@devforge.network',
      displayName: 'Elena Rostova (Specialist Demo)',
      passwordHash: demoPasswordHash,
      status: 'ACTIVE',
    },
  });

  const freelancerRole = roleMap.get('freelancer');
  if (freelancerRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: specialistUser.id,
          roleId: freelancerRole,
        },
      },
      update: {},
      create: {
        userId: specialistUser.id,
        roleId: freelancerRole,
      },
    });
  }

  const specialistProfile = await prisma.freelancerProfile.upsert({
    where: { userId: specialistUser.id },
    update: {
      handle: 'satoshi_core',
      title: 'Principal Rust & Substrate Engineer',
      bio: 'Core protocol engineer with 7+ years building high-throughput consensus pallets, zero-knowledge verification circuits, and cross-chain bridge logic.',
      availability: 'AVAILABLE',
    },
    create: {
      userId: specialistUser.id,
      handle: 'satoshi_core',
      title: 'Principal Rust & Substrate Engineer',
      bio: 'Core protocol engineer with 7+ years building high-throughput consensus pallets, zero-knowledge verification circuits, and cross-chain bridge logic.',
      availability: 'AVAILABLE',
    },
  });

  // Link skills to specialist
  const seededSkills = await prisma.skill.findMany({
    where: { slug: { in: ['rust', 'solidity', 'smart-contract-auditing'] } },
  });
  for (const skill of seededSkills) {
    await prisma.freelancerSkill.upsert({
      where: {
        freelancerProfileId_skillId: {
          freelancerProfileId: specialistProfile.id,
          skillId: skill.id,
        },
      },
      update: { proficiency: 'EXPERT' },
      create: {
        freelancerProfileId: specialistProfile.id,
        skillId: skill.id,
        proficiency: 'EXPERT',
      },
    });
  }

  // 2. Seed Protocol Lead Demo Account (Client)
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@devforge.network' },
    update: {
      displayName: 'DevForge Labs (Client Demo)',
      passwordHash: demoPasswordHash,
      status: 'ACTIVE',
    },
    create: {
      email: 'client@devforge.network',
      displayName: 'DevForge Labs (Client Demo)',
      passwordHash: demoPasswordHash,
      status: 'ACTIVE',
    },
  });

  const clientRole = roleMap.get('client');
  if (clientRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: clientUser.id,
          roleId: clientRole,
        },
      },
      update: {},
      create: {
        userId: clientUser.id,
        roleId: clientRole,
      },
    });
  }

  await prisma.clientProfile.upsert({
    where: { userId: clientUser.id },
    update: {
      organizationName: 'DevForge Labs',
      slug: 'devforge-labs',
      description:
        'Leading research and development guild building decentralized developer tooling and verified smart-contract primitives.',
    },
    create: {
      userId: clientUser.id,
      organizationName: 'DevForge Labs',
      slug: 'devforge-labs',
      description:
        'Leading research and development guild building decentralized developer tooling and verified smart-contract primitives.',
    },
  });

  console.log('Seeded skills, job categories, and demo recruiter accounts successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
