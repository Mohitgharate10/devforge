import Link from 'next/link';

export default function SubstratePalletJobPage() {
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
          <span>POLKADOT FELLOWSHIP</span>
          <span>•</span>
          <span>ESCROW PRE-FUNDED</span>
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
          Substrate Parachain Governance Pallet Developer
        </h1>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <span className="skill-tag accent">Rust</span>
          <span className="skill-tag accent">Substrate</span>
          <span className="skill-tag">FRAME</span>
          <span className="skill-tag">Polkadot SDK</span>
          <span className="skill-tag">OpenGov</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            PRE-FUNDED ESCROW BUDGET
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10B981' }}>
            $10,000 – $16,000 <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>USDC</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Funds locked in Sepolia escrow vault awaiting milestone delivery
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            MILESTONE TIMELINE
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            4 Weeks <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>(2 Milestones)</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Milestone 1: Spec & Trait Definitions (40%) • Milestone 2: Pallet & Tests (60%)
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.7, color: '#e5e7eb', fontSize: '0.95rem' }}>
        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Project Scope
          </h2>
          <p>
            The Polkadot Fellowship is seeking an experienced Substrate / FRAME engineer to build an open-governance pallet extension. The deliverable requires implementing multi-asset conviction voting, time-locked treasury executions, and compatibility with the latest Polkadot SDK release.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Key Requirements
          </h2>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Deep proficiency with Rust and FRAME pallet development.</li>
            <li>Prior contributions to Substrate parachain runtimes or Polkadot OpenGov pallets.</li>
            <li>Comprehensive unit and benchmark test suites with mock runtimes.</li>
            <li>Formal documentation of dispatchable calls, storage items, and events.</li>
          </ul>
        </section>

        <div style={{ marginTop: '2rem', padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-hairline)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Ready to Scope this Deliverable?</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Submit an on-chain proposal with your milestone roadmap and pricing.</p>
          </div>
          <Link href="/auth/sign-in?role=freelancer" className="btn-pill-primary" style={{ padding: '0.75rem 1.5rem' }}>
            Submit Proposal →
          </Link>
        </div>
      </div>
    </main>
  );
}
