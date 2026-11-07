'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { NotificationCenter } from './NotificationCenter';
import { WalletConnectButton } from './WalletConnectButton';
import { useAuth } from '@/context/AuthContext';

export function Navigation() {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <>
      <header className="site-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '0.45rem 0.65rem',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            {mobileMenuOpen ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          <Link href="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <span className="brand-dot" aria-hidden="true" />
            <span>DevForge</span>
          </Link>
        </div>

        <nav className="nav-links desktop-only" aria-label="Main Navigation">
          <Link href="/bounties">Bounties</Link>
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
          <div className="status-pill desktop-only" title="Network status">
            <span className="live-indicator" aria-hidden="true" />
            <span>Sepolia Escrow</span>
          </div>

          <WalletConnectButton />
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
                <div
                  style={{
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
                  }}
                >
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>

                <span
                  style={{
                    fontWeight: 600,
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.displayName}
                </span>

                <span
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '9999px',
                    background:
                      user.role === 'freelancer'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(230, 0, 122, 0.15)',
                    color: user.role === 'freelancer' ? '#10B981' : '#E6007A',
                    fontWeight: 600,
                  }}
                >
                  {user.role.toUpperCase()}
                </span>

                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>▼</span>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  style={{
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
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderBottom: '1px solid var(--border-hairline)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div
                      style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      {user.displayName}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        wordBreak: 'break-all',
                      }}
                    >
                      {user.email || user.walletAddress}
                    </div>
                  </div>

                  <Link
                    href={
                      user.role === 'freelancer'
                        ? `/freelancers/${user.handle || 'elena-rostova'}`
                        : '/bounties/new'
                    }
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
                    <span>
                      {user.role === 'client'
                        ? '+ Post New Bounty / Job'
                        : 'My Profile & Portfolio'}
                    </span>
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
                    <span>
                      {user.role === 'client' ? 'Manage Active Bounties' : 'My Proposals & Bids'}
                    </span>
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

                  <div
                    style={{
                      height: '1px',
                      background: 'var(--border-hairline)',
                      margin: '0.35rem 0',
                    }}
                  />

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

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              href="/bounties"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
              <span>Earn Bounties & Grants</span>
              <span>→</span>
            </Link>
            <Link
              href="/freelancers"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
              <span>Technical Talent</span>
              <span>→</span>
            </Link>
            <Link href="/jobs" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">
              <span>Open Bounties & Roles</span>
              <span>→</span>
            </Link>
            <Link
              href="/dashboard/proposals"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
              <span>Proposals</span>
              <span>→</span>
            </Link>
            <Link
              href="/dashboard/contracts"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
              <span>Contracts Workbench</span>
              <span>→</span>
            </Link>
            <Link
              href="/escrow"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
              <span>Escrow Protocol</span>
              <span>→</span>
            </Link>
            <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">
              <span>Documentation</span>
              <span>→</span>
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-link"
                style={{ color: '#E6007A' }}
              >
                <span>Admin Portal</span>
                <span>→</span>
              </Link>
            )}

            <div
              style={{ height: '1px', background: 'var(--border-hairline)', margin: '0.5rem 0' }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                NETWORK
              </span>
              <div className="status-pill" style={{ margin: 0 }}>
                <span className="live-indicator" aria-hidden="true" />
                <span>Sepolia Escrow</span>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
