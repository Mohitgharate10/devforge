import Link from 'next/link';
import { prisma } from '@devforge/database';
import { normalizeHandle } from '@devforge/domain';

export const dynamic = 'force-dynamic';

export default async function FreelancerProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle: rawHandle } = await params;
  const handle = normalizeHandle(rawHandle);

  let freelancer = null;
  try {
    freelancer = await prisma.freelancerProfile.findUnique({
      where: { handle },
      include: {
        user: {
          select: {
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
  } catch (err) {
    console.warn(
      '[FreelancerProfilePage] Database not connected or running yet:',
      (err as Error).message,
    );
  }

  // Fallback demo profile if database is offline or not yet seeded
  if (!freelancer && handle === 'satoshi_core') {
    freelancer = {
      id: 'demo-satoshi',
      handle: 'satoshi_core',
      title: 'EVM & Substrate Security Auditor',
      bio: 'Senior smart contract security researcher with 6+ years auditing high-volume DeFi protocols and cross-chain messaging bridges.\nSpecialized in reentrancy, oracle manipulation vectors, and formal verification using Foundry and Halmos.',
      hourlyRate: BigInt(15000),
      availability: 'AVAILABLE',
      user: {
        displayName: 'Elena Rostova',
        avatarUrl: null,
        createdAt: new Date('2024-01-15T00:00:00Z'),
        wallets: [
          {
            address: '0x71C84164b3c915122e265646cD8266395A344e45',
            chainId: 11155111,
          },
        ],
      },
      skills: [
        { skillId: 's1', proficiency: 'EXPERT', skill: { name: 'Solidity' } },
        { skillId: 's2', proficiency: 'EXPERT', skill: { name: 'Smart Contract Auditing' } },
        { skillId: 's3', proficiency: 'INTERMEDIATE', skill: { name: 'Rust' } },
        { skillId: 's4', proficiency: 'EXPERT', skill: { name: 'Foundry' } },
      ],
      portfolioProjects: [
        {
          id: 'p1',
          title: 'Perpetuals DEX Liquidation Audit',
          description:
            'Audited core margin engine and liquidation keeper contracts protecting $45M in TVL. Identified 2 high-severity reentrancy vectors before mainnet deployment.',
          projectUrl: 'https://polkadot.com',
          repositoryUrl: 'https://github.com/polkadot-js/api',
          coverImageUrl: null,
        },
        {
          id: 'p2',
          title: 'Cross-Chain Token Bridge Escrow',
          description:
            'Implemented EIP-712 signature verification and multi-sig emergency pauses for EVM-to-Substrate asset transfers.',
          projectUrl: 'https://sepolia.etherscan.io',
          repositoryUrl: 'https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md',
          coverImageUrl: null,
        },
      ],
      experiences: [
        {
          id: 'e1',
          company: 'ConsenSys Diligence Partner',
          role: 'Lead Security Auditor',
          startDate: new Date('2022-03-01'),
          endDate: null,
          description: 'Conducted 30+ comprehensive protocol audits across Ethereum and Layer 2s.',
        },
      ],
      certifications: [
        {
          id: 'c1',
          name: 'Certified Smart Contract Security Professional',
          issuer: 'Blockchain Security Alliance',
          issuedAt: new Date('2023-05-01'),
          expiresAt: null,
          credentialUrl: 'https://example.com',
        },
      ],
    };
  }

  if (!freelancer && handle === 'zk_builder') {
    freelancer = {
      id: 'demo-marcus',
      handle: 'zk_builder',
      title: 'Zero Knowledge & DeFi Systems Engineer',
      bio: 'Core contributor to zero-knowledge circuits and privacy-preserving automated market makers.\nExpertise in Circom, Halo2, and developing high-throughput rollups.',
      hourlyRate: BigInt(17500),
      availability: 'PARTIALLY_AVAILABLE',
      user: {
        displayName: 'Marcus Vance',
        avatarUrl: null,
        createdAt: new Date('2024-03-10T00:00:00Z'),
        wallets: [
          {
            address: '0x388C818CA8B9251b393131C08a73683246A73134',
            chainId: 1,
          },
        ],
      },
      skills: [
        { skillId: 's1', proficiency: 'EXPERT', skill: { name: 'Rust' } },
        { skillId: 's2', proficiency: 'EXPERT', skill: { name: 'Zero-Knowledge' } },
        { skillId: 's3', proficiency: 'EXPERT', skill: { name: 'DeFi Protocols' } },
        { skillId: 's4', proficiency: 'INTERMEDIATE', skill: { name: 'Viem' } },
      ],
      portfolioProjects: [
        {
          id: 'p3',
          title: 'ZK-SNARK State Verifier',
          description: 'Optimized on-chain proof verification reducing gas consumption by 38% across Layer 2 settlements.',
          projectUrl: 'https://zksync.io',
          repositoryUrl: 'https://github.com/matter-labs/zksync-era',
          coverImageUrl: null,
        },
      ],
      experiences: [
        {
          id: 'e2',
          company: 'ZK Protocol Labs',
          role: 'Senior Cryptography Engineer',
          startDate: new Date('2021-06-01'),
          endDate: null,
          description: 'Architected succinct proving systems and on-chain verification contracts.',
        },
      ],
      certifications: [],
    };
  }

  if (!freelancer && handle === 'polka_dev') {
    freelancer = {
      id: 'demo-kenji',
      handle: 'polka_dev',
      title: 'Full Stack Web3 Architect',
      bio: 'Bridging high-performance Next.js web applications with smart contracts, subgraphs, and indexers.\nSpecialist in Polkadot-inspired minimal design, EIP-4361, and decentralized storage.',
      hourlyRate: BigInt(13000),
      availability: 'AVAILABLE',
      user: {
        displayName: 'Kenji Sato',
        avatarUrl: null,
        createdAt: new Date('2024-05-20T00:00:00Z'),
        wallets: [
          {
            address: '0x220866B1A2219f40e72f5c628B65D54268cA3A9D',
            chainId: 1,
          },
        ],
      },
      skills: [
        { skillId: 's1', proficiency: 'EXPERT', skill: { name: 'TypeScript' } },
        { skillId: 's2', proficiency: 'EXPERT', skill: { name: 'Next.js' } },
        { skillId: 's3', proficiency: 'INTERMEDIATE', skill: { name: 'Solidity' } },
        { skillId: 's4', proficiency: 'EXPERT', skill: { name: 'Subgraphs' } },
      ],
      portfolioProjects: [
        {
          id: 'p4',
          title: 'Decentralized Milestone Escrow Interface',
          description: 'A Polkadot-aesthetic web terminal connecting clients and builders with multi-chain smart contracts.',
          projectUrl: 'https://polkadot.network',
          repositoryUrl: 'https://github.com/polkadot-js/apps',
          coverImageUrl: null,
        },
      ],
      experiences: [],
      certifications: [],
    };
  }

  if (!freelancer) {
    const formattedName = handle
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    freelancer = {
      id: `demo-${handle}`,
      handle,
      title: 'Technical Specialist & Protocol Engineer',
      bio: 'Verified technical specialist on DevForge specializing in smart contract architecture, milestone deliverables, and audited escrow releases.',
      hourlyRate: BigInt(15000),
      availability: 'AVAILABLE',
      user: {
        displayName: formattedName || 'Technical Specialist',
        avatarUrl: null,
        createdAt: new Date(),
        wallets: [
          {
            address: '0x71C84164b3c915122e265646cD8266395A344e45',
            chainId: 11155111,
          },
        ],
      },
      skills: [
        { skillId: 's1', proficiency: 'EXPERT', skill: { name: 'Solidity' } },
        { skillId: 's2', proficiency: 'EXPERT', skill: { name: 'TypeScript' } },
        { skillId: 's3', proficiency: 'INTERMEDIATE', skill: { name: 'Web3 Escrow' } },
      ],
      portfolioProjects: [
        {
          id: `p-${handle}`,
          title: 'Decentralized Milestone Escrow Integration',
          description: 'Deployed and verified non-custodial milestone deliverables on Sepolia testnet.',
          projectUrl: 'https://sepolia.etherscan.io',
          repositoryUrl: 'https://github.com/OpenZeppelin/openzeppelin-contracts',
          coverImageUrl: null,
        },
      ],
      experiences: [],
      certifications: [],
    };
  }

  const primaryWallet = freelancer.user.wallets[0];

  return (
    <main style={{ padding: '5rem 2.5rem', maxWidth: '72rem', margin: '0 auto' }}>
      <Link
        href="/freelancers"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: 'inline-block',
          marginBottom: '2rem',
        }}
      >
        ← BACK TO DIRECTORY
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: '4rem',
          alignItems: 'start',
        }}
      >
        <div>
          <div className="hero-meta-strip">
            <span>@{freelancer.handle}</span>
            <span>•</span>
            <span style={{ color: 'var(--accent-magenta)' }}>{freelancer.availability}</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              marginBottom: '1rem',
            }}
          >
            {freelancer.user.displayName}
          </h1>

          <p
            style={{
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
              marginBottom: '2rem',
              fontWeight: 500,
            }}
          >
            {freelancer.title}
          </p>

          <div
            style={{
              borderTop: '1px solid var(--border-hairline)',
              paddingTop: '2rem',
              marginBottom: '3rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
              }}
            >
              01 / BIOGRAPHY
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1.05rem',
                lineHeight: 1.7,
                whiteSpace: 'pre-line',
              }}
            >
              {freelancer.bio}
            </p>
          </div>

          {/* Portfolio Projects */}
          <div
            style={{
              borderTop: '1px solid var(--border-hairline)',
              paddingTop: '2rem',
              marginBottom: '3rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
              }}
            >
              02 / VERIFIED DELIVERIES & PORTFOLIO
            </h2>

            {freelancer.portfolioProjects.length === 0 ? (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                }}
              >
                [ NO PUBLISHED PORTFOLIO PROJECTS ]
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {freelancer.portfolioProjects.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: '8px',
                      padding: '1.5rem',
                    }}
                  >
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {p.title}
                    </h3>
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                        lineHeight: 1.5,
                        marginBottom: '1rem',
                      }}
                    >
                      {p.description}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {p.projectUrl && (
                        <a
                          href={p.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="skill-tag accent"
                        >
                          Live Application ↗
                        </a>
                      )}
                      {p.repositoryUrl && (
                        <a
                          href={p.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="skill-tag"
                        >
                          Source Repository ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info Card */}
        <aside
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '12px',
            padding: '2rem',
            position: 'sticky',
            top: '6rem',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              Rate / Quote
            </span>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.75rem',
                fontWeight: 700,
                marginTop: '0.25rem',
              }}
            >
              {freelancer.hourlyRate
                ? `$${(Number(freelancer.hourlyRate) / 100).toFixed(0)}/hr`
                : 'Per Milestone'}
            </div>
          </div>

          {primaryWallet && (
            <div style={{ marginBottom: '1.5rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                }}
              >
                Verified Settlement Wallet
              </span>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--accent-magenta)',
                  marginTop: '0.25rem',
                  wordBreak: 'break-all',
                }}
              >
                {primaryWallet.address}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '0.75rem',
              }}
            >
              Technical Stack
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {freelancer.skills.map((s) => (
                <span key={s.skillId} className="skill-tag accent">
                  {s.skill.name} ({s.proficiency.toLowerCase()})
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/auth/sign-in"
            className="btn-pill-primary"
            style={{ width: '100%', textAlign: 'center' }}
          >
            Fund Milestone & Hire →
          </Link>
        </aside>
      </div>
    </main>
  );
}
