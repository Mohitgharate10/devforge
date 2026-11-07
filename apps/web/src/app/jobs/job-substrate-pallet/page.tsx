import Link from 'next/link';
import { findCanonicalBounty } from '@/lib/canonical-marketplace';

export default function SubstratePalletJobPage() {
  const canonical = findCanonicalBounty('job-substrate-pallet')!;

  return (
    <main style={{ padding: '4rem 1.5rem', maxWidth: '58rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/jobs"
          style={{
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <span>←</span>
          <span>Back to Open Roles</span>
        </Link>

        <div className="hero-meta-strip">
          <span>{canonical.client.organizationName.toUpperCase()}</span>
          <span>•</span>
          <span>ESCROW {canonical.escrowStatus}</span>
          <span>•</span>
          <span>SEPOLIA TESTNET</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 4.5vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
            lineHeight: 1.15,
          }}
        >
          {canonical.title}
        </h1>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {canonical.skills.map((skill, index) => (
            <span key={skill} className={`skill-tag ${index < 2 ? 'accent' : ''}`}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
        }}
      >
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
            }}
          >
            PRE-FUNDED ESCROW BUDGET
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#10B981',
            }}
          >
            ${canonical.budgetMin.toLocaleString()} – ${canonical.budgetMax.toLocaleString()}{' '}
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{canonical.currency}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Funds locked in Sepolia escrow vault awaiting milestone delivery
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
            }}
          >
            MILESTONE TIMELINE
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
            }}
          >
            4 Weeks{' '}
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
              ({canonical.milestones.length} Milestones)
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {canonical.milestones.map((m) => `${m.title} (${m.share})`).join(' • ')}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          lineHeight: 1.7,
          color: '#e5e7eb',
          fontSize: '0.95rem',
        }}
      >
        <section>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Project Scope
          </h2>
          <p>{canonical.description}</p>
        </section>

        <section>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Key Requirements & Acceptance Criteria
          </h2>
          <ul
            style={{
              paddingLeft: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {canonical.milestones.map((m) => (
              <li key={m.title}>
                <strong>{m.title}:</strong> {m.desc}
              </li>
            ))}
          </ul>
        </section>

        <div
          style={{
            marginTop: '2rem',
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
              Ready to Scope this Deliverable?
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Submit an on-chain proposal or register your PR deliverable directly.
            </p>
          </div>
          <Link
            href="/jobs"
            className="btn-pill-primary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Submit Proposal →
          </Link>
        </div>
      </div>
    </main>
  );
}
