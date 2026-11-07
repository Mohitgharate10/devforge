import Link from 'next/link';

export const metadata = {
  title: 'Protocol Documentation | DevForge',
  description:
    'Technical architecture, REST API standards, and smart contract integration documentation.',
};

export default function DocsPage() {
  const sections = [
    {
      num: '01',
      title: 'Authentication & SIWE',
      desc: 'Better Auth integration with Sign-In with Ethereum (EIP-4361). Cryptographic wallet ownership proof and session management.',
      tags: ['Better Auth', 'EIP-4361', 'CSRF', 'Session Cookies'],
    },
    {
      num: '02',
      title: 'Talent Profiles & Taxonomy',
      desc: 'Hierarchical category taxonomies, verifiable skill proficiency ratings, and cryptographically verified portfolio project metadata.',
      tags: ['Prisma Schema', 'Domain Policies', 'Taxonomy', 'Portfolios'],
    },
    {
      num: '03',
      title: 'Job Marketplace & Bounties',
      desc: 'Decentralized job lifecycle state machine: DRAFT ➔ PUBLISHED ➔ PAUSED ➔ CLOSED ➔ ARCHIVED with budget boundaries and cursor pagination.',
      tags: ['Sprint 4', 'State Machine', 'Full-Text Search', 'Filters'],
    },
    {
      num: '04',
      title: 'Non-Custodial Milestone Escrow',
      desc: 'On-chain milestone contracts protecting both client capital and freelancer deliverables. Direct Sepolia smart contract settlement.',
      tags: ['Smart Contracts', 'Milestones', 'Arbitration', 'Viem'],
    },
  ];

  return (
    <main style={{ padding: '4rem 2.5rem', maxWidth: '84rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '3.5rem' }}>
        <div className="hero-meta-strip">
          <span>04 / DOCUMENTATION</span>
          <span>•</span>
          <span>SYSTEM ARCHITECTURE</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
          }}
        >
          DevForge Technical Docs
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.15rem',
            maxWidth: '48rem',
            lineHeight: 1.6,
          }}
        >
          Comprehensive architecture, REST API envelope specifications, and smart contract
          integration guide.
        </p>
      </div>

      <div className="editorial-grid" style={{ marginBottom: '4rem' }}>
        {sections.map((s) => (
          <div key={s.num} className="card-editorial">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--accent-magenta)',
                }}
              >
                SECTION {s.num}
              </span>
              <span className="status-pill" style={{ fontSize: '0.65rem' }}>
                ACTIVE
              </span>
            </div>

            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                marginBottom: '0.75rem',
              }}
            >
              {s.title}
            </h2>

            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              {s.desc}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'auto' }}>
              {s.tags.map((t) => (
                <span key={t} className="skill-tag accent" style={{ fontSize: '0.7rem' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border-hairline)',
          paddingTop: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          DevForge Core Architecture Specification v0.4.0
        </span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/freelancers" className="btn-pill-secondary">
            Talent Directory →
          </Link>
          <Link href="/jobs" className="btn-pill-primary">
            Job Marketplace →
          </Link>
        </div>
      </div>
    </main>
  );
}
