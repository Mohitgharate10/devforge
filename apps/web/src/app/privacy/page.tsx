import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main style={{ padding: '4rem 1.5rem', maxWidth: '52rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="hero-meta-strip">
          <span>PRIVACY & DATA POLICIES</span>
          <span>•</span>
          <span>PROTOTYPE DATA HANDLING</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
          }}
        >
          Privacy information
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          DevForge is a prototype. This page summarizes the data handling implemented in the
          application and is not a substitute for legal review.
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
            1. Testnet and wallet activity
          </h2>
          <p>
            Wallet connection can read an address and network from a browser wallet. Wallet
            connection is not account authentication. The application is a testnet prototype; do
            not submit real funds or sensitive information. Any transaction submitted to a public
            blockchain may be visible and irreversible.
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
            2. Account data
          </h2>
          <p>
            When you create an account, the service stores account and profile information in its
            database. Passwords are stored as Argon2 hashes. Do not enter information you would not
            want stored in this prototype.
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
            3. Sessions and browser storage
          </h2>
          <p>
            Authentication uses a server-managed session referenced by an HttpOnly cookie; the
            browser does not use local storage as the source of account identity. Cookie lifetime
            depends on the sign-in option. Review browser settings to manage or clear cookies.
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
