import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '0 1.5rem', maxWidth: '82rem', margin: '0 auto' }}>
      {/* ─── Hero Section ─────────────────────────────────── */}
      <section className="hero-editorial" style={{ paddingTop: '5rem', paddingBottom: '3.5rem' }}>
        <div className="hero-meta-strip">
          <span>01 / PROTOCOL</span>
          <span>•</span>
          <span>NON-CUSTODIAL MILESTONE ESCROW</span>
          <span>•</span>
          <span>SEPOLIA VERIFIED</span>
        </div>

        <h1 className="hero-title">
          The decentralized forge for <span className="highlight">builders</span> & technical teams.
        </h1>

        <p className="hero-subtitle">
          Hire elite Web3 engineers, smart contract security auditors, and zero-knowledge cryptographers.
          Every milestone is pre-funded on-chain via smart contracts and released only upon verified delivery.
        </p>

        <div className="hero-cta-container">
          <Link href="/freelancers" className="btn-pill-primary">
            Explore Talent Directory →
          </Link>
          <Link href="/jobs/create" className="btn-pill-secondary">
            + Post a Bounty / Job
          </Link>
          <Link
            href="https://sepolia.etherscan.io/address/0x633C1B2dE8d4380E83141f2359489569777E4426"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
              textDecoration: 'none',
              padding: '0.5rem 0.75rem',
            }}
          >
            <span>Contract: 0x633C...4426 ↗</span>
          </Link>
        </div>

        {/* Live Protocol Telemetry Rail (Sepolia Testnet Alpha) */}
        <div className="stats-rail" style={{ marginTop: '3.5rem' }}>
          <div className="stat-item">
            <span className="stat-number">Sepolia</span>
            <span className="stat-label">Testnet Alpha (Zero Real Value)</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">2-of-3</span>
            <span className="stat-label">Multi-Sig Arbitrated Escrow</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">EIP-4361</span>
            <span className="stat-label">Sign-In with Ethereum</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">Testnet</span>
            <span className="stat-label">Interactive Demo Persona Profiles</span>
          </div>
        </div>
      </section>

      {/* ─── How It Works (3-Step Escrow Architecture) ─────── */}
      <section style={{ padding: '4.5rem 0', borderTop: '1px solid var(--border-hairline)' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div className="hero-meta-strip" style={{ justifyContent: 'center' }}>
            <span>ARCHITECTURE</span>
            <span>•</span>
            <span>ESCROW SECURITY GUARANTEE</span>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0.5rem 0' }}>
            How DevForge Milestone Escrow Works
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '42rem', margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
            Eliminating upfront payment risk and freelance ghosting. Funds sit in a deterministic smart contract vault on Ethereum Sepolia with transparent 2-of-3 dispute arbitration.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
          {/* Step 1 */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(230, 0, 122, 0.12)',
                border: '1px solid rgba(230, 0, 122, 0.3)',
                color: '#E6007A',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}>
                01
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Pre-Fund Milestone Vault
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Client deposits milestone funds into <code style={{ color: '#E6007A' }}>DevForgeEscrow.sol</code>.
                Deterministic Keccak-256 keys lock funds between client and freelancer addresses. Zero platform custody.
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#10B981' }}>
              ✓ Verified on Sepolia Testnet
            </div>
          </div>

          {/* Step 2 */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#3B82F6',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}>
                02
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Deliver in Live Project Rooms
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Freelancer submits pull requests, formal verification invariant tests, or IPFS artifacts directly into the authenticated contract room with realtime messaging.
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#3B82F6' }}>
              ⚡ Realtime Collaboration & Logs
            </div>
          </div>

          {/* Step 3 */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}>
                03
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Release Payout or Arbitrate
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Client approves deliverable with 1-click on-chain release directly to the specialist&apos;s wallet.
                In case of disagreement, transparent 2-of-3 multi-sig arbitration (Client, Freelancer, Protocol Panel) mediates fund distribution.
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#F59E0B' }}>
              <Link href="/terms#arbitration" style={{ textDecoration: 'underline', color: 'inherit' }}>
                View Arbiter Key Transparency →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Featured Bounties & Open Roles Preview ───────── */}
      <section style={{ padding: '4.5rem 0', borderTop: '1px solid var(--border-hairline)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="hero-meta-strip">
              <span>ACTIVE CONTRACTS</span>
              <span>•</span>
              <span>VERIFIED GRANTS</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0' }}>Featured Bounties & Roles</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Pre-funded milestone opportunities from established Web3 protocols and research foundations.
            </p>
          </div>
          <Link href="/jobs" className="btn-pill-secondary">
            View All Open Roles →
          </Link>
        </div>

        <div className="editorial-grid">
          {/* Job 1 */}
          <div className="card-editorial">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="client-badge">Parity Ecosystem Fund</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                  ● ESCROW PRE-FUNDED
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                EVM & Substrate Cross-Chain Bridge Security Audit
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Formal verification and manual audit on EIP-712 token bridge endpoints, replay mitigations, and emergency pause logic.
              </p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <span className="skill-tag accent">Solidity</span>
                <span className="skill-tag accent">Foundry</span>
                <span className="skill-tag">Rust</span>
                <span className="skill-tag">Halmos</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-hairline)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>BUDGET RANGE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$12K – $18K USDC</div>
              </div>
              <Link href="/jobs/job-bridge-audit" className="btn-pill-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                Apply / Scope →
              </Link>
            </div>
          </div>

          {/* Job 2 */}
          <div className="card-editorial">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="client-badge">Axiom Research Labs</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                  ● ESCROW PRE-FUNDED
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                ZK-Rollup Proof Verifier Circuit Optimization
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Optimize on-chain Groth16 proof verifier smart contracts on Sepolia to minimize Layer 2 verification gas overhead.
              </p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <span className="skill-tag accent">Zero-Knowledge</span>
                <span className="skill-tag accent">Circom</span>
                <span className="skill-tag">Halo2</span>
                <span className="skill-tag">Viem</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-hairline)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>BUDGET RANGE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$15K – $25K USDC</div>
              </div>
              <Link href="/jobs/job-zk-circuit" className="btn-pill-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                Apply / Scope →
              </Link>
            </div>
          </div>

          {/* Job 3 */}
          <div className="card-editorial">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="client-badge">Polkadot Fellowship</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                  ● ESCROW PRE-FUNDED
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                Substrate Parachain Governance Pallet Developer
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Design and implement open governance pallets with multi-asset conviction voting and time-locked treasury executions.
              </p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <span className="skill-tag accent">Rust</span>
                <span className="skill-tag accent">Substrate</span>
                <span className="skill-tag">FRAME</span>
                <span className="skill-tag">Polkadot SDK</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-hairline)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>BUDGET RANGE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$10K – $16K USDC</div>
              </div>
              <Link href="/jobs/job-substrate-pallet" className="btn-pill-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                Apply / Scope →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Top Verified Talent Spotlight ───────────────── */}
      <section style={{ padding: '4.5rem 0', borderTop: '1px solid var(--border-hairline)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="hero-meta-strip">
              <span>SPECIALISTS</span>
              <span>•</span>
              <span>DEMO PERSONAS & SEPOLIA PROFILES</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0' }}>Featured Technical Talent</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Curated Web3 specialists. In testnet alpha mode, these highlight platform capabilities and testnet reputation.
            </p>
          </div>
          <Link href="/freelancers" className="btn-pill-secondary">
            Browse All Specialists →
          </Link>
        </div>

        <div className="editorial-grid">
          {/* Freelancer 1 */}
          <div className="card-editorial">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E6007A 0%, #7928CA 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                  }}>
                    E
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Elena Rostova</h3>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>@elena-rostova</div>
                  </div>
                </div>
                <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                  ★ 5.0 (14 reviews)
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-pink)', marginBottom: '0.5rem' }}>
                Senior Smart Contract Security Researcher & Auditor
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                Specializing in EVM reentrancy invariants, cross-chain state proofs, and formal verification using Halmos and Foundry.
              </p>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span className="skill-tag accent">Solidity</span>
                <span className="skill-tag accent">Rust</span>
                <span className="skill-tag">Halmos</span>
                <span className="skill-tag">Foundry</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-hairline)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                $150 <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ hr</span>
              </div>
              <Link href="/freelancers/elena-rostova" className="btn-pill-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                View Profile & Escrows →
              </Link>
            </div>
          </div>

          {/* Freelancer 2 */}
          <div className="card-editorial">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                  }}>
                    M
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Marcus Vance</h3>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>@marcus-vance</div>
                  </div>
                </div>
                <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                  ★ 4.9 (9 reviews)
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3B82F6', marginBottom: '0.5rem' }}>
                Zero-Knowledge Cryptographer & Rollup Architect
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                Deep background in Groth16, Plonk, and STARK recursive proof systems. Reduced gas overhead by 34% on recent rollup verification.
              </p>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span className="skill-tag accent">Zero-Knowledge</span>
                <span className="skill-tag accent">Rust</span>
                <span className="skill-tag">Circom</span>
                <span className="skill-tag">Halo2</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-hairline)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                $180 <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ hr</span>
              </div>
              <Link href="/freelancers/marcus-vance" className="btn-pill-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                View Profile & Escrows →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom Dual Portal Call-to-Action ───────────── */}
      <section style={{
        margin: '4rem 0 6rem 0',
        background: 'linear-gradient(180deg, rgba(230, 0, 122, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)',
        border: '1px solid rgba(230, 0, 122, 0.3)',
        borderRadius: '20px',
        padding: '3.5rem 2.5rem',
        textAlign: 'center',
      }}>
        <div className="hero-meta-strip" style={{ justifyContent: 'center' }}>
          <span>GET STARTED TODAY</span>
          <span>•</span>
          <span>TRUSTLESS COLLABORATION</span>
        </div>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0.75rem 0' }}>
          Ready to build with on-chain guarantees?
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '38rem', margin: '0 auto 2rem auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Join leading Web3 protocols, independent security researchers, and engineers working with non-custodial milestone protection.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <Link href="/jobs/create" className="btn-pill-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}>
            + Post a Milestone Bounty
          </Link>
          <Link href="/auth/sign-up" className="btn-pill-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}>
            Create Your Specialist Profile →
          </Link>
        </div>
      </section>
    </main>
  );
}
