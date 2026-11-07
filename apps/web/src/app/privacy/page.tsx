import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main style={{ padding: '4rem 1.5rem', maxWidth: '52rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="hero-meta-strip">
          <span>PRIVACY & DATA POLICIES</span>
          <span>•</span>
          <span>EIP-4361 MINIMAL RETENTION</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          DevForge is architected around pseudonymous Web3 identity and minimal data retention.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          lineHeight: 1.7,
          fontSize: '0.95rem',
          color: '#d1d5db',
        }}
      >
        <section>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            1. Public Blockchain Telemetry
          </h2>
          <p>
            When you deposit into or release funds from the{' '}
            <code style={{ color: '#E6007A' }}>DevForgeEscrow.sol</code> contract, your Ethereum
            wallet address, transaction hash, and timestamp are broadcast publicly to the Ethereum
            Sepolia network. Public blockchain records are immutable and cannot be altered or
            removed by DevForge.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            2. Off-Chain Account Data
          </h2>
          <p>
            DevForge stores minimal profile information (handle, display name, hourly rate, and
            encrypted credentials if using email login). If authenticating purely via Sign-In with
            Ethereum (EIP-4361), your cryptographic signature verifies ownership without requiring
            email or passwords.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            3. Local Storage & Cookies
          </h2>
          <p>
            DevForge utilizes browser local storage and standard session cookies solely to preserve
            your active authentication state and keep you signed in across browser sessions. We do
            not sell user data to advertising third parties.
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
