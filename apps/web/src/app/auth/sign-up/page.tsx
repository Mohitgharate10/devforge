'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');

  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [hourlyRate, setHourlyRate] = useState('150');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const userHandle = handle || displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    try {
      const res = await fetch('/api/v1/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName,
          role,
          handle: userHandle,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(
          data?.error?.message || 'Could not create account. Please check your inputs.',
        );
        setIsSubmitting(false);
        return;
      }

      const createdUser = data?.data?.user;

      // Prime auth state with registered user
      if (!createdUser?.id || !createdUser?.email || !createdUser?.displayName) {
        throw new Error('The sign-up response did not contain a valid user.');
      }
      signIn({
        id: createdUser.id,
        email: createdUser.email,
        displayName: createdUser.displayName,
        role,
        roles: createdUser.roles ?? [role],
        handle: userHandle,
      });

      setSuccessMessage(
        `Account created successfully as ${role === 'client' ? 'Protocol / Client Team' : 'Technical Specialist'}! Redirecting...`,
      );
      setTimeout(() => {
        router.push(role === 'client' ? '/jobs/create' : '/jobs');
      }, 1000);
    } catch {
      setErrorMessage('Network error during account creation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ padding: '4rem 1.5rem', maxWidth: '42rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="hero-meta-strip">
          <span>03 / ONBOARDING</span>
          <span>•</span>
          <span>EMAIL ACCOUNT</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            marginBottom: '0.75rem',
          }}
        >
          Create Your Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
          Create a client or specialist account to explore job listings and proposal workflows.
          Escrow is a testnet prototype and must not be used for real funds.
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '2rem',
          padding: '0.35rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '12px',
        }}
      >
        <button
          type="button"
          onClick={() => setRole('freelancer')}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: role === 'freelancer' ? 'var(--bg-card)' : 'transparent',
            color: role === 'freelancer' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: role === 'freelancer' ? 'var(--accent-magenta)' : 'var(--text-muted)',
            }}
          />
          Technical Specialist
        </button>
        <button
          type="button"
          onClick={() => setRole('client')}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: role === 'client' ? 'var(--bg-card)' : 'transparent',
            color: role === 'client' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: role === 'client' ? 'var(--accent-magenta)' : 'var(--text-muted)',
            }}
          />
          Protocol / Client Team
        </button>
      </div>

      {successMessage && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '8px',
            background: 'rgba(0, 230, 118, 0.08)',
            border: '1px solid rgba(0, 230, 118, 0.3)',
            color: 'var(--status-live)',
            fontSize: '0.9rem',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          {successMessage}
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link
              href="/auth/sign-in"
              style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
              }}
            >
              Click here if not redirected automatically →
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            background: 'rgba(230, 0, 122, 0.1)',
            border: '1px solid rgba(230, 0, 122, 0.3)',
            color: 'var(--accent-magenta)',
            fontSize: '0.875rem',
            marginBottom: '2rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Profile Creation Form */}
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Full Name / Organization *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Elena Rostova"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Public Handle *
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                }}
              >
                @
              </span>
              <input
                type="text"
                required
                placeholder="satoshi_core"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem 0.85rem 2.2rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="builder@devforge.network"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Password *
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {role === 'freelancer' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Primary Specialization / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. EVM & Substrate Security Auditor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Hourly Rate (USD)
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Wallet linking
              </label>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Wallet linking is not available yet. We will only mark a wallet as yours after you
                verify ownership with a signature.
              </p>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Engineering Background & Bio
              </label>
              <textarea
                rows={4}
                placeholder="Highlight your experience with smart contract security, zero-knowledge, or protocol development..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        )}

        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/auth/sign-in"
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Already have an identity? Sign In →
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pill-primary"
            style={{ minWidth: '160px', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Registering...' : 'Register Profile →'}
          </button>
        </div>
      </form>
    </main>
  );
}
