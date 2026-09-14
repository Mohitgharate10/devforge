import Link from 'next/link';

export const metadata = {
  title: 'Escrow Protocol | DevForge',
  description: 'Non-custodial, milestone-based smart contract escrow on Ethereum Sepolia.',
};

export default function EscrowProtocolPage() {
  return (
    <main style={{ padding: '4rem 2.5rem', maxWidth: '84rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '3.5rem' }}>
        <div className="hero-meta-strip">
          <span>03 / SMART CONTRACT PROTOCOL</span>
          <span>•</span>
          <span>SEPOLIA TESTNET</span>
          <span>•</span>
          <span>NON-CUSTODIAL</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
          }}
        >
          Non-Custodial Milestone Escrow
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.15rem',
            maxWidth: '52rem',
            lineHeight: 1.6,
          }}
        >
          DevForge never holds customer funds. Every engagement creates an independent smart contract
          vault locked on-chain. Capital is released incrementally only when both parties sign off on
          verified deliverable milestones.
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
            STAGE 01 / FUNDING
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Client On-Chain Lockup
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Client deposits USDC or ETH directly into the milestone escrow contract. Funds are
            immutable, time-locked, and provably verified by the DevForge event indexer.
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
            STAGE 02 / DELIVERY
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Cryptographic Submission
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The technical specialist submits git commits, IPFS hashes, and verification artifacts.
            Milestone state changes to <code>DELIVERED</code> with timestamped audit logs.
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
            STAGE 03 / RELEASE
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Dual-Key Settlement
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Upon client approval or automated test passage, the escrow contract releases milestone funds
            directly to the specialist’s verified payout wallet without platform interception.
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
            ● DEPLOYED CONTRACT SPECIFICATION
          </span>
          <span className="status-pill">
            <span className="live-indicator" />
            <span>Sepolia Chain ID: 11155111</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              ESCROW FACTORY
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              0x8269...9F41
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              STANDARD
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              ERC-20 & Native ETH Escrow
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              SETTLEMENT MODEL
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              Optimistic Multi-Sig with Arbitration
            </div>
          </div>
        </div>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-hairline)', display: 'flex', gap: '1rem' }}>
          <Link href="/freelancers" className="btn-pill-primary">
            Explore Specialists →
          </Link>
          <a
            href="https://sepolia.etherscan.io"
            target="_blank"
            rel="noreferrer"
            className="btn-pill-secondary"
          >
            Inspect on Etherscan ↗
          </a>
        </div>
      </div>
    </main>
  );
}
