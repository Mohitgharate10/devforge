'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '@/context/AuthContext';

export function Navigation() {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="site-nav">
      <Link href="/" className="brand-logo">
        <span className="brand-dot" aria-hidden="true" />
        <span>DevForge</span>
      </Link>

      <nav className="nav-links" aria-label="Main Navigation">
        <Link href="/freelancers">Freelancers</Link>
        <Link href="/jobs">Open Roles</Link>
        <Link href="/dashboard/proposals">Proposals</Link>
        <Link href="/dashboard/contracts">Contracts</Link>
        <Link href="/escrow">Escrow Protocol</Link>
        <Link href="/docs">Docs</Link>
        {user?.role === 'admin' && (
          <Link href="/admin" style={{ color: '#E6007A' }}>
            Admin Portal
          </Link>
        )}
      </nav>

      <div className="nav-cta-group">
        <div className="status-pill" title="Network status">
          <span className="live-indicator" aria-hidden="true" />
          <span>Sepolia Escrow</span>
        </div>

        <NotificationCenter />

        {user ? (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '9999px',
                padding: '0.35rem 0.85rem 0.35rem 0.4rem',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Avatar circle */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E6007A 0%, #7928CA 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}>
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>

              <span style={{ fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName}
              </span>

              <span style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                background: user.role === 'freelancer' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(230, 0, 122, 0.15)',
                color: user.role === 'freelancer' ? '#10B981' : '#E6007A',
                fontWeight: 600,
              }}>
                {user.role.toUpperCase()}
              </span>

              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 0.6rem)',
                width: '16rem',
                background: '#111114',
                border: '1px solid var(--border-hairline)',
                borderRadius: '12px',
                padding: '0.75rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}>
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-hairline)', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.displayName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                    {user.email || user.walletAddress}
                  </div>
                </div>

                <Link
                  href={user.role === 'freelancer' ? `/freelancers/${user.handle || 'elena-rostova'}` : '/bounties/new'}
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  className="nav-dropdown-item"
                >
                  <span>{user.role === 'client' ? '+ Post New Bounty / Job' : 'My Profile & Portfolio'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>→</span>
                </Link>

                <Link
                  href={user.role === 'client' ? '/bounties' : '/dashboard/proposals'}
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  className="nav-dropdown-item"
                >
                  <span>{user.role === 'client' ? 'Manage Active Bounties' : 'My Proposals & Bids'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>→</span>
                </Link>

                <Link
                  href="/dashboard/contracts"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  className="nav-dropdown-item"
                >
                  <span>Escrow Contracts</span>
                  <span style={{ color: 'var(--text-secondary)' }}>→</span>
                </Link>

                <Link
                  href="/admin"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  className="nav-dropdown-item"
                >
                  <span>Admin & Dispute Queue</span>
                  <span style={{ color: 'var(--text-secondary)' }}>→</span>
                </Link>

                <div style={{ height: '1px', background: 'var(--border-hairline)', margin: '0.35rem 0' }} />

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    signOut();
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/auth/sign-in" className="btn-pill-secondary">
              Sign In
            </Link>
            <Link href="/auth/sign-up" className="btn-pill-primary">
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
