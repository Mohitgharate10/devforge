'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user } = useAuth();

  const [role, setRole] = useState<'freelancer' | 'client'>(() => {
    const qRole = searchParams.get('role');
    return qRole === 'client' ? 'client' : 'freelancer';
  });
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(() => {
    return searchParams.get('registered') === 'true'
      ? 'Account created successfully in database! Please sign in with your credentials.'
      : null;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/v1/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, rememberMe: keepSignedIn }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setErrorMessage(
          errJson?.error?.message || 'Invalid email or password. Please check your credentials.',
        );
        setIsSubmitting(false);
        return;
      }

      const json = await res.json();
      const sessionUser = json?.data?.user;
      if (!sessionUser?.id || !sessionUser?.email || !sessionUser?.displayName) {
        throw new Error('The sign-in response did not contain a valid user.');
      }
      const activeRole =
        sessionUser.role === 'client' || sessionUser.role === 'admin'
          ? sessionUser.role
          : sessionUser.role === 'freelancer'
            ? sessionUser.role
            : role;
      const authedUser = {
        id: sessionUser.id,
        email: sessionUser.email,
        displayName: sessionUser.displayName,
        avatarUrl: sessionUser.avatarUrl ?? null,
        roles: sessionUser.roles ?? [],
        role: activeRole,
        handle: sessionUser.handle,
      };

      signIn(authedUser);
      setSuccessMessage(
        `Authenticated successfully as ${authedUser.role.toUpperCase()}! Redirecting...`,
      );
      setTimeout(() => {
        const requestedRedirect = searchParams.get('redirect');
        if (requestedRedirect) {
          try {
            const target = new URL(requestedRedirect, window.location.origin);
            if (target.origin === window.location.origin) {
              router.push(`${target.pathname}${target.search}${target.hash}`);
              return;
            }
          } catch {
            // Fall through to the role-specific start page for invalid redirects.
          }
        }
        router.push(authedUser.role === 'client' ? '/jobs/create' : '/jobs');
      }, 800);
    } catch {
      setErrorMessage('Network error during sign-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ padding: '4rem 1.5rem', maxWidth: '34rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="hero-meta-strip">
          <span>01 / AUTHENTICATION</span>
          <span>•</span>
          <span>WEB3 & CREDENTIALS</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            marginBottom: '0.75rem',
          }}
        >
          Sign In
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
          Sign in to manage your DevForge account and marketplace activity.
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
              background: role === 'freelancer' ? '#10B981' : 'var(--text-muted)',
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
              background: role === 'client' ? '#E6007A' : 'var(--text-muted)',
            }}
          />
          Protocol / Client Team
        </button>
      </div>

      {user && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#3B82F6',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          Currently signed in as <strong>{user.displayName}</strong> ({user.role.toUpperCase()}).
        </div>
      )}

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
          }}
        >
          {successMessage}
          <div style={{ marginTop: '0.75rem' }}>
            <Link
              href="/dashboard/contracts"
              style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
              }}
            >
              Go to Contracts Workbench →
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

      {/* Web3 SIWE Option */}
      <button
        type="button"
        onClick={() =>
          setErrorMessage('Wallet sign-in is not available yet. Use your email and password.')
        }
        style={{
          width: '100%',
          padding: '0.85rem 1.5rem',
          borderRadius: '9999px',
          border: '1px solid var(--border-hairline)',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
          transition: 'all 0.2s ease',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--text-muted)',
          }}
        />
        Wallet sign-in coming soon
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
        <span>OR CONTINUE WITH EMAIL AS {role.toUpperCase()}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
      </div>

      {/* Standard Form */}
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
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
            Email Address ({role === 'client' ? 'Client / Team Account' : 'Specialist Account'})
          </label>
          <input
            type="email"
            required
            placeholder={role === 'client' ? 'fund@devforge.network' : 'engineer@devforge.network'}
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
            Password
          </label>
          <input
            type="password"
            required
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

        {/* Keep Me Signed In Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="keepSignedIn"
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
            style={{ cursor: 'pointer', accentColor: '#E6007A' }}
          />
          <label
            htmlFor="keepSignedIn"
            style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            Keep me signed in on this device (Persistent session)
          </label>
        </div>

        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/auth/sign-up"
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Need an account? Register →
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pill-primary"
            style={{ minWidth: '130px', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting
              ? 'Authenticating...'
              : `Sign In as ${role === 'client' ? 'Client' : 'Freelancer'} →`}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}
        >
          Loading Sign In...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
