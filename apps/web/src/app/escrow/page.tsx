import Link from 'next/link';

export const metadata = {
  title: 'Escrow Prototype | DevForge',
  description: 'Escrow is experimental and not ready for real payments.',
};

export default function EscrowProtocolPage() {
  return (
    <main style={{ padding: '4rem 2.5rem', maxWidth: '84rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '3.5rem' }}>
        <div className="hero-meta-strip">
          <span>03 / ESCROW PROTOTYPE</span>
          <span>•</span>
          <span>NO REAL FUNDS</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
          }}
        >
          Milestone escrow prototype
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.15rem',
            maxWidth: '52rem',
            lineHeight: 1.6,
          }}
        >
          This page describes an intended workflow, not a live payment service. There is no verified
          production deployment presented here, and release and dispute handling are not
          production-ready. Do not send funds or rely on this prototype for an engagement.
        </p>
      </div>

      {/* Protocol Architecture Rails */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '4rem',
        }}
      >
        <div className="card-editorial">
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-magenta)',
              marginBottom: '1rem',
            }}
          >
            PLANNED STAGE 01 / FUNDING
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Testnet funding
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Funding is an experimental testnet concept. The application does not currently offer a
            verified escrow deployment or production-safe payment flow.
          </p>
        </div>

        <div className="card-editorial">
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
              marginBottom: '1rem',
            }}
          >
            PLANNED STAGE 02 / DELIVERY
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Work submission
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Project workflows can track submitted work. Submissions are not cryptographically
            verified on-chain, and should not be treated as proof of delivery.
          </p>
        </div>

        <div className="card-editorial">
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--status-live)',
              marginBottom: '1rem',
            }}
          >
            PLANNED STAGE 03 / RELEASE
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Payment release
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Payment release and dispute arbitration are not production-ready or guaranteed by this
            prototype.
          </p>
        </div>
      </div>

      {/* Contract Verification Box */}
      <div
        style={{
          padding: '2.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-hairline)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-magenta)',
              letterSpacing: '0.05em',
            }}
          >
            PROTOTYPE STATUS
          </span>
          <span className="status-pill">
            <span>No verified deployment published</span>
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
              }}
            >
              NETWORK TARGET
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                marginTop: '0.25rem',
              }}
            >
              Sepolia testnet only
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
              }}
            >
              STANDARD
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                marginTop: '0.25rem',
              }}
            >
              No production payment support
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
              }}
            >
              SETTLEMENT MODEL
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                marginTop: '0.25rem',
              }}
            >
              Not production-ready
            </div>
          </div>
        </div>

        <div
          style={{
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-hairline)',
            display: 'flex',
            gap: '1rem',
          }}
        >
          <Link href="/docs" className="btn-pill-primary">
            Read prototype docs →
          </Link>
          <Link href="/jobs" className="btn-pill-secondary">
            Browse marketplace →
          </Link>
        </div>
      </div>
    </main>
  );
}
