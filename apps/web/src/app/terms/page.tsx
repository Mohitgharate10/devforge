import Link from 'next/link';

export default function TermsPage() {
  return (
    <main style={{ padding: '4rem 1.5rem', maxWidth: '52rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="hero-meta-strip">
          <span>PROTOTYPE DISCLAIMERS</span>
          <span>•</span>
          <span>UPDATED NOVEMBER 2026</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
          }}
        >
          Prototype disclaimers
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          DevForge is an early-stage software prototype. This page is informational, has not been
          reviewed as a legal agreement, and should not be relied on as legal advice.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          lineHeight: 1.7,
          fontSize: '0.95rem',
          color: '#d1d5db',
        }}
      >
        <section
          id="disclaimer"
          style={{
            background: 'rgba(230, 0, 122, 0.08)',
            border: '1px solid rgba(230, 0, 122, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#E6007A',
              marginBottom: '0.75rem',
            }}
          >
            ⚠️ Prototype warning
          </h2>
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>
            Escrow funding, release, and dispute arbitration are not production-ready. No verified
            deployment is published here. Do not send funds, share sensitive information, or rely on
            the application for real engagements.
          </p>
        </section>

        <section id="arbitration">
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            1. Escrow and dispute handling
          </h2>
          <p>
            DevForge does not currently provide a production escrow service. The interface may
            display experimental workflows, but they do not prove that funds were deposited,
            secured, released, or refunded.
          </p>
          <p>
            Dispute requests may be recorded in the application, but there is no configured
            arbitration panel or binding on-chain dispute process. Do not rely on DevForge to
            resolve a real commercial disagreement.
          </p>
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
            2. Software status
          </h2>
          <p>
            This prototype is provided for evaluation and may contain errors, demonstration data, or
            incomplete workflows. No smart contract audit or production readiness is claimed. Verify
            all information independently and do not use the interface to make payments.
          </p>
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
            3. Marketplace information
          </h2>
          <p>
            Listings and profiles may be examples and are not necessarily verified or available.
            DevForge does not currently guarantee that a client, specialist, project, or review is
            authentic. Confirm details directly before relying on any displayed information.
          </p>
        </section>
      </div>

      <div
        style={{
          marginTop: '3.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-hairline)',
        }}
      >
        <Link
          href="/"
          style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'underline' }}
        >
          ← Back to DevForge Home
        </Link>
      </div>
    </main>
  );
}
