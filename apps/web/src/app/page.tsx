import Link from 'next/link';
import { SuperteamBountiesHub } from '@/components/SuperteamBountiesHub';

export default function HomePage() {
  return (
    <main style={{ padding: '0 1.5rem', maxWidth: '82rem', margin: '0 auto' }}>
      {/* ─── Hero Section ─────────────────────────────────── */}
      <section className="hero-editorial" style={{ paddingTop: '5rem', paddingBottom: '3.5rem' }}>
        <div className="hero-meta-strip">
          <span>01 / MARKETPLACE</span>
          <span>•</span>
          <span>WEB3 TALENT & PROJECTS</span>
        </div>

        <h1 className="hero-title">
          Find Web3 specialists. <span className="highlight">Hire by milestone.</span>
        </h1>

        <p className="hero-subtitle">
          DevForge is a marketplace prototype for technical teams and independent Web3 builders.
          Explore work, compare specialists, and follow milestone-based projects.
        </p>

        <div className="hero-cta-container">
          <Link href="/jobs" className="btn-pill-primary">
            Browse open work →
          </Link>
          <Link href="/freelancers" className="btn-pill-secondary">
            Find specialists
          </Link>
          <Link href="/jobs/create" className="btn-pill-secondary">
            Post a job
          </Link>
        </div>

        {/* Current product status, not live protocol telemetry. */}
        <div className="stats-rail" style={{ marginTop: '3.5rem' }}>
          <div className="stat-item">
            <span className="stat-number">Sepolia</span>
            <span className="stat-label">Test network only · no real funds</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">Milestones</span>
            <span className="stat-label">Escrow prototype in development</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">Email</span>
            <span className="stat-label">Wallet sign-in is not available yet</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">Demo</span>
            <span className="stat-label">Some listings and profiles are examples</span>
          </div>
        </div>
      </section>

      {/* ─── How It Works (3-Step Escrow Architecture) ─────── */}
      <section style={{ padding: '4.5rem 0', borderTop: '1px solid var(--border-hairline)' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div className="hero-meta-strip" style={{ justifyContent: 'center' }}>
            <span>ARCHITECTURE</span>
            <span>•</span>
            <span>PROPOSED TESTNET WORKFLOW</span>
          </div>
          <h2
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0.5rem 0',
            }}
          >
            How milestone escrow is intended to work
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '42rem',
              margin: '0 auto',
              fontSize: '1rem',
              lineHeight: 1.6,
            }}
          >
            This is a product prototype, not a live payment service. Escrow currently targets
            Ethereum Sepolia testnet only; do not send real funds.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {/* Step 1 */}
          <div
            style={{
              background: '#0D0D12',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '2.25rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(230, 0, 122, 0.1)',
                  border: '1px solid rgba(230, 0, 122, 0.25)',
                  color: '#E6007A',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                01
              </div>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: '0.75rem',
                }}
              >
                Agree on milestones
              </h3>
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Clients and specialists define the work, acceptance criteria, and payment schedule
                before an engagement begins. On-chain funding is still a testnet prototype.
              </p>
            </div>
            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E6007A' }} />
              <span>Testnet only · no real funds</span>
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              background: '#0D0D12',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '2.25rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(230, 0, 122, 0.1)',
                  border: '1px solid rgba(230, 0, 122, 0.25)',
                  color: '#E6007A',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                02
              </div>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: '0.75rem',
                }}
              >
                Track the work
              </h3>
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Use the project workflow to submit work and review progress. Realtime collaboration
                and on-chain delivery verification are not available yet.
              </p>
            </div>
            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E6007A' }} />
              <span>Project workflow prototype</span>
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              background: '#0D0D12',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '2.25rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(230, 0, 122, 0.1)',
                  border: '1px solid rgba(230, 0, 122, 0.25)',
                  color: '#E6007A',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                03
              </div>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: '0.75rem',
                }}
              >
                Review before release
              </h3>
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                A future release flow should require client approval and send funds directly to the
                specialist. Payment release and dispute arbitration are not production-ready.
              </p>
            </div>
            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E6007A' }} />
              <Link href="/escrow" style={{ textDecoration: 'none', color: 'inherit' }}>
                Read testnet details ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Superteam Earn-Style Bounties & Grants Section ───────── */}
      <section style={{ padding: '4.5rem 0', borderTop: '1px solid var(--border-hairline)' }}>
        <SuperteamBountiesHub isHomepage={true} />
      </section>

      {/* ─── Example Talent Profiles ─────────────────────── */}
      <section style={{ padding: '4.5rem 0', borderTop: '1px solid var(--border-hairline)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div className="hero-meta-strip">
              <span>EXAMPLE PROFILES</span>
              <span>•</span>
              <span>NOT VERIFIED USERS</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0' }}>
              Example specialist profiles
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              These sample profiles demonstrate the directory interface. Names, ratings, and reviews
              shown here are illustrative, not verified marketplace activity.
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #E6007A 0%, #7928CA 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    E
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                      Elena Rostova
                    </h3>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      @elena-rostova
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    color: '#F59E0B',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Example profile
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--accent-pink)',
                  marginBottom: '0.5rem',
                }}
              >
                Senior Smart Contract Security Researcher & Auditor
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  marginBottom: '1rem',
                }}
              >
                Specializing in EVM reentrancy invariants, cross-chain state proofs, and formal
                verification using Halmos and Foundry.
              </p>

              <div
                style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}
              >
                <span className="skill-tag accent">Solidity</span>
                <span className="skill-tag accent">Rust</span>
                <span className="skill-tag">Halmos</span>
                <span className="skill-tag">Foundry</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-hairline)',
              }}
            >
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                }}
              >
                $150{' '}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ hr</span>
              </div>
              <Link
                href="/freelancers/elena-rostova"
                className="btn-pill-primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
              >
                View Profile & Escrows →
              </Link>
            </div>
          </div>

          {/* Freelancer 2 */}
          <div className="card-editorial">
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    M
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                      Marcus Vance
                    </h3>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      @marcus-vance
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    color: '#F59E0B',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Example profile
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#3B82F6',
                  marginBottom: '0.5rem',
                }}
              >
                Zero-Knowledge Cryptographer & Rollup Architect
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  marginBottom: '1rem',
                }}
              >
                Deep background in Groth16, Plonk, and STARK recursive proof systems. Reduced gas
                overhead by 34% on recent rollup verification.
              </p>

              <div
                style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}
              >
                <span className="skill-tag accent">Zero-Knowledge</span>
                <span className="skill-tag accent">Rust</span>
                <span className="skill-tag">Circom</span>
                <span className="skill-tag">Halo2</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-hairline)',
              }}
            >
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                }}
              >
                $180{' '}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ hr</span>
              </div>
              <Link
                href="/freelancers/marcus-vance"
                className="btn-pill-primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
              >
                View Profile & Escrows →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom Dual Portal Call-to-Action ───────────── */}
      <section
        style={{
          margin: '4rem 0 6rem 0',
          background:
            'linear-gradient(180deg, rgba(230, 0, 122, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)',
          border: '1px solid rgba(230, 0, 122, 0.3)',
          borderRadius: '20px',
          padding: '3.5rem 2.5rem',
          textAlign: 'center',
        }}
      >
        <div className="hero-meta-strip" style={{ justifyContent: 'center' }}>
          <span>GET STARTED TODAY</span>
          <span>•</span>
          <span>TRUSTLESS COLLABORATION</span>
        </div>
        <h2
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0.75rem 0',
          }}
        >
          Ready to build with on-chain guarantees?
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            maxWidth: '38rem',
            margin: '0 auto 2rem auto',
            fontSize: '1.05rem',
            lineHeight: 1.6,
          }}
        >
          Join leading Web3 protocols, independent security researchers, and engineers working with
          non-custodial milestone protection.
        </p>

        <div
          style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}
        >
          <Link
            href="/jobs/create"
            className="btn-pill-primary"
            style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
          >
            + Post a Milestone Bounty
          </Link>
          <Link
            href="/auth/sign-up"
            className="btn-pill-secondary"
            style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
          >
            Create Your Specialist Profile →
          </Link>
        </div>
      </section>
    </main>
  );
}
