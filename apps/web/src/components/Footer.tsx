import Link from 'next/link';

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-hairline)',
        background: '#09090b',
        color: 'var(--text-secondary)',
        padding: '4rem 1.5rem 2.5rem',
        marginTop: '6rem',
      }}
    >
      <div
        style={{
          maxWidth: '82rem',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3.5rem',
        }}
      >
        {/* Brand & Testnet Notice */}
        <div style={{ gridColumn: 'span 2' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--accent-magenta)',
                boxShadow: '0 0 10px var(--accent-magenta)',
              }}
            />
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
              }}
            >
              DevForge
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                background: 'rgba(230, 0, 122, 0.12)',
                color: '#E6007A',
                border: '1px solid rgba(230, 0, 122, 0.3)',
              }}
            >
              SEPOLIA TESTNET
            </span>
          </div>
          <p
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.6,
              maxWidth: '28rem',
              marginBottom: '1.25rem',
            }}
          >
            A decentralized milestone escrow platform for Web3 engineers and technical teams. All
            settlements currently run on Ethereum Sepolia testnet with zero real monetary value.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href="https://github.com/Mohitgharate10/devforge"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--border-hairline)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>GitHub Repo</span>
              <span>↗</span>
            </a>
            <a
              href="https://sepolia.etherscan.io/address/0x633C1B2dE8d4380E83141f2359489569777E4426"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--border-hairline)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>Escrow Contract</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        {/* Marketplace */}
        <div>
          <h4
            style={{
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem',
            }}
          >
            Marketplace
          </h4>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              fontSize: '0.875rem',
            }}
          >
            <li>
              <Link href="/freelancers" style={{ color: 'var(--text-secondary)' }}>
                Browse Talent
              </Link>
            </li>
            <li>
              <Link href="/jobs" style={{ color: 'var(--text-secondary)' }}>
                Open Roles & Bounties
              </Link>
            </li>
            <li>
              <Link href="/jobs/create" style={{ color: 'var(--text-secondary)' }}>
                Post a Bounty
              </Link>
            </li>
            <li>
              <Link href="/auth/sign-up" style={{ color: 'var(--text-secondary)' }}>
                Join as Specialist
              </Link>
            </li>
          </ul>
        </div>

        {/* Protocol & Security */}
        <div>
          <h4
            style={{
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem',
            }}
          >
            Protocol
          </h4>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              fontSize: '0.875rem',
            }}
          >
            <li>
              <Link href="/escrow" style={{ color: 'var(--text-secondary)' }}>
                Escrow Architecture
              </Link>
            </li>
            <li>
              <Link href="/docs" style={{ color: 'var(--text-secondary)' }}>
                Documentation
              </Link>
            </li>
            <li>
              <a
                href="https://sepolia.etherscan.io/address/0x633C1B2dE8d4380E83141f2359489569777E4426"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-secondary)' }}
              >
                Sepolia Contract
              </a>
            </li>
            <li>
              <Link href="/terms#arbitration" style={{ color: 'var(--text-secondary)' }}>
                Arbiter Transparency
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance */}
        <div>
          <h4
            style={{
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem',
            }}
          >
            Legal
          </h4>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              fontSize: '0.875rem',
            }}
          >
            <li>
              <Link href="/terms" style={{ color: 'var(--text-secondary)' }}>
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" style={{ color: 'var(--text-secondary)' }}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms#disclaimer" style={{ color: '#E6007A' }}>
                Testnet Disclaimer
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/Mohitgharate10/devforge/issues"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-secondary)' }}
              >
                Report an Issue
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal Rail */}
      <div
        style={{
          maxWidth: '82rem',
          margin: '0 auto',
          paddingTop: '2rem',
          borderTop: '1px solid var(--border-hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
        }}
      >
        <div>© {new Date().getFullYear()} DevForge Protocol. Distributed under MIT License.</div>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          TESTNET DEMO ONLY • NOT FINANCIAL OR LEGAL ADVICE
        </div>
      </div>
    </footer>
  );
}
