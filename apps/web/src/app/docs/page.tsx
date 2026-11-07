import Link from 'next/link';

export const metadata = {
  title: 'Prototype Documentation | DevForge',
  description:
    'Current DevForge prototype capabilities, limitations, and planned integrations.',
};

export default function DocsPage() {
  const sections = [
    {
      num: '01',
      title: 'Account authentication',
      desc: 'Email and password accounts use server-validated, database-backed sessions. Wallet connection is separate; wallet-based sign-in is not available.',
      tags: ['Argon2', 'HttpOnly Cookie', 'Database Session'],
    },
    {
      num: '02',
      title: 'Talent Profiles & Taxonomy',
      desc: 'Profile and directory pages are available. Example profiles and ratings are illustrative and are not verified reviews.',
      tags: ['Profiles', 'Directory', 'Example Data'],
    },
    {
      num: '03',
      title: 'Job Marketplace & Bounties',
      desc: 'Browse marketplace listings and submit proposals. Some listings are demonstration data; check each listing before relying on it.',
      tags: ['Jobs', 'Bounties', 'Proposals'],
    },
    {
      num: '04',
      title: 'Escrow prototype',
      desc: 'Escrow and dispute workflows are not production-ready. Only use testnet assets, and do not send real funds.',
      tags: ['Sepolia Testnet', 'Prototype', 'No Real Funds'],
    },
  ];

  return (
    <main style={{ padding: '4rem 2.5rem', maxWidth: '84rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '3.5rem' }}>
        <div className="hero-meta-strip">
          <span>04 / DOCUMENTATION</span>
          <span>•</span>
          <span>PROTOTYPE STATUS</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
          }}
        >
          DevForge prototype docs
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.15rem',
            maxWidth: '48rem',
            lineHeight: 1.6,
          }}
        >
          A practical overview of what works today and what is still planned. This project is a
          prototype; the sections below are not claims of production readiness.
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
                PROTOTYPE
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
          DevForge prototype overview
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
