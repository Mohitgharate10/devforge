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

  console.log('Seeded skills and job categories successfully.');
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
