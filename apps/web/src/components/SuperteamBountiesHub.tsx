'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { CANONICAL_BOUNTIES, type CanonicalBounty } from '@/lib/canonical-marketplace';

export interface BountyItem {
  id: string;
  title: string;
  description: string;
  sponsorName: string;
  sponsorAvatar: string;
  sponsorColor: string;
  type: 'BOUNTY' | 'AUDIT CONTEST' | 'GRANT';
  rewardUsdc: number;
  deadlineDaysLeft: number;
  submissionsCount: number;
  tags: string[];
  linkUrl: string;
  escrowStatus: 'PRE-FUNDED' | 'VERIFIED';
  prizeSplit?: string;
}

function canonicalToBountyItem(b: CanonicalBounty, additionalCount = 0): BountyItem {
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    sponsorName: b.client.organizationName,
    sponsorAvatar: b.client.avatarLetter,
    sponsorColor: b.client.brandColor,
    type: b.type,
    rewardUsdc: b.rewardUsdc,
    deadlineDaysLeft: b.deadlineDaysLeft,
    submissionsCount: b.baseSubmissionsCount + additionalCount,
    tags: b.skills,
    linkUrl: `/jobs/${b.slug}`,
    escrowStatus: b.escrowStatus,
    prizeSplit: b.prizeSplit,
  };
}

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function SuperteamBountiesHub({ isHomepage = false }: { isHomepage?: boolean }) {
  const { user } = useAuth();
  const [bounties, setBounties] = useState<BountyItem[]>(() =>
    CANONICAL_BOUNTIES.map((b) => canonicalToBountyItem(b)),
  );
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'BOUNTY' | 'AUDIT CONTEST' | 'GRANT'>(
    'ALL',
  );
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [activeSubmissionBounty, setActiveSubmissionBounty] = useState<BountyItem | null>(null);

  // Submission Form State
  const [prUrl, setPrUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    id: string;
    submittedAt: string;
    payoutAddress: string;
  } | null>(null);

  // Fetch real persisted submission counts from server on mount
  useEffect(() => {
    fetch('/api/v1/bounties/submit')
      .then((res) => res.json())
      .then((json) => {
        if (json?.data?.countsByBounty) {
          const counts = json.data.countsByBounty as Record<string, number>;
          setBounties(CANONICAL_BOUNTIES.map((b) => canonicalToBountyItem(b, counts[b.id] || 0)));
        }
      })
      .catch(() => {
        // use canonical base counts
      });
  }, []);

  const [authGateBounty, setAuthGateBounty] = useState<BountyItem | null>(null);
  const prInputRef = useRef<HTMLInputElement>(null);

  // Focus management and Escape key dismissal
  useEffect(() => {
    if (!activeSubmissionBounty && !authGateBounty) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSubmissionBounty(null);
        setAuthGateBounty(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubmissionBounty, authGateBounty]);

  useEffect(() => {
    if (activeSubmissionBounty && user) {
      const timer = setTimeout(() => {
        prInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeSubmissionBounty, user]);

  const availableTags = ['ALL', 'Rust', 'Solidity', 'Zero-Knowledge', 'Substrate', 'Foundry'];

  const filtered = bounties.filter((b) => {
    const matchesTab = selectedTab === 'ALL' || b.type === selectedTab;
    const matchesTag = selectedTag === 'ALL' || b.tags.includes(selectedTag);
    return matchesTab && matchesTag;
  });

  const handleOpenSubmit = (bounty: BountyItem) => {
    if (!user) {
      // Immediate gate: unauthenticated visitors cannot open the submission form
      setAuthGateBounty(bounty);
      return;
    }
    setActiveSubmissionBounty(bounty);
    setSubmissionResult(null);
    setFormError(null);
    setPrUrl('');
    setDemoUrl('');
    setSummary('');
    if (user?.walletAddress) {
      setPayoutAddress(user.walletAddress);
    } else {
      setPayoutAddress('');
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionBounty) return;
    setFormError(null);

    if (!user) {
      setFormError(
        'Authentication required. Please sign in to submit deliverables for this bounty.',
      );
      return;
    }

    if (!EVM_ADDRESS_REGEX.test(payoutAddress.trim())) {
      setFormError(
        'Please enter a valid 42-character EVM address (e.g. 0x71C84164b3c915122e265646cD8266395A344e45).',
      );
      return;
    }

    if (!prUrl.trim().startsWith('http')) {
      setFormError('Please enter a valid Pull Request or repository URL (https://...).');
      return;
    }

    if (summary.trim().length < 10) {
      setFormError('Summary must be at least 10 characters detailing your deliverable.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/bounties/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user.id ? { 'x-user-id': user.id } : {}),
        },
        body: JSON.stringify({
          bountyId: activeSubmissionBounty.id,
          prUrl: prUrl.trim(),
          demoUrl: demoUrl.trim() || undefined,
          summary: summary.trim(),
          payoutAddress: payoutAddress.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(json?.error?.message || 'Submission failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const rec = json.data?.submission;
      setSubmissionResult({
        id: rec?.id || `sub-${Date.now()}`,
        submittedAt: rec?.submittedAt || new Date().toISOString(),
        payoutAddress: payoutAddress.trim(),
      });

      // Increment local state count
      setBounties((prev) =>
        prev.map((item) =>
          item.id === activeSubmissionBounty.id
            ? { ...item, submissionsCount: item.submissionsCount + 1 }
            : item,
        ),
      );
    } catch {
      setFormError(
        'Network error while recording submission. Please check connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Superteam-Style Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#E6007A',
              fontWeight: 700,
              letterSpacing: '0.08em',
              marginBottom: '0.4rem',
            }}
          >
            <span>CANONICAL MARKETPLACE REPOSITORY</span>
            <span>•</span>
            <span>SEPOLIA ESCROW</span>
          </div>
          <h2
            style={{
              fontSize: isHomepage ? '2rem' : '2.5rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              margin: '0.2rem 0',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Bounties & Ecosystem Grants
          </h2>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '0.95rem',
              margin: 0,
              maxWidth: '38rem',
              lineHeight: 1.5,
            }}
          >
            Fixed-scope Web3 tasks, security audits, and developer grants. Illustrative Sepolia
            testnet prize pool and prototype escrow scenario.
          </p>
        </div>

        {/* Tab Filter Pill Row */}
        <div
          style={{
            display: 'inline-flex',
            background: '#0D0D12',
            padding: '0.3rem',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '0.25rem',
          }}
        >
          {(['ALL', 'BOUNTY', 'AUDIT CONTEST', 'GRANT'] as const).map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedTab(tab)}
                style={{
                  background: isActive ? '#E6007A' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '0.45rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  letterSpacing: '0.04em',
                }}
              >
                {tab === 'ALL' ? 'ALL OPPORTUNITIES' : tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Filters: Skill Tags */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginRight: '0.5rem',
          }}
        >
          Filter by Stack:
        </span>
        {availableTags.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              style={{
                background: isSelected ? 'rgba(230, 0, 122, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? '#E6007A' : 'rgba(255, 255, 255, 0.08)'}`,
                color: isSelected ? '#ff40a4' : 'rgba(255, 255, 255, 0.7)',
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Bounty Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 18rem), 1fr))',
          gap: '1.25rem',
        }}
      >
        {filtered.map((bounty) => (
          <div
            key={bounty.id}
            style={{
              background: '#0D0D12',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Top Strip: Sponsor & Type Tag */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: bounty.sponsorColor,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {bounty.sponsorAvatar}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      {bounty.sponsorName}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'rgba(255, 255, 255, 0.45)',
                      }}
                    >
                      {bounty.escrowStatus === 'PRE-FUNDED'
                        ? 'Sepolia Testnet Escrow Scenario'
                        : 'Verified Protocol Multi-Sig'}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    background:
                      bounty.type === 'BOUNTY'
                        ? 'rgba(230, 0, 122, 0.12)'
                        : bounty.type === 'AUDIT CONTEST'
                          ? 'rgba(147, 51, 234, 0.12)'
                          : 'rgba(37, 99, 235, 0.12)',
                    color:
                      bounty.type === 'BOUNTY'
                        ? '#E6007A'
                        : bounty.type === 'AUDIT CONTEST'
                          ? '#A855F7'
                          : '#3B82F6',
                    border: `1px solid ${
                      bounty.type === 'BOUNTY'
                        ? 'rgba(230, 0, 122, 0.3)'
                        : bounty.type === 'AUDIT CONTEST'
                          ? 'rgba(147, 51, 234, 0.3)'
                          : 'rgba(37, 99, 235, 0.3)'
                    }`,
                  }}
                >
                  {bounty.type}
                </span>
              </div>

              {/* Bounty Title */}
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.35,
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.01em',
                }}
              >
                <Link href={bounty.linkUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {bounty.title}
                </Link>
              </h3>

              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  marginBottom: '1.25rem',
                }}
              >
                {bounty.description}
              </p>

              {/* Tags */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                  marginBottom: '1.5rem',
                }}
              >
                {bounty.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.75)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Strip: Reward & CTA Buttons */}
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '0.75rem',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'rgba(255, 255, 255, 0.45)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Total Prize Pool
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: '#10B981',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ${bounty.rewardUsdc.toLocaleString()}{' '}
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      USDC
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#E6007A',
                      fontWeight: 600,
                    }}
                  >
                    {bounty.deadlineDaysLeft} Days Left
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.45)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {bounty.submissionsCount} submissions
                  </div>
                </div>
              </div>

              {bounty.prizeSplit && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(255, 255, 255, 0.45)',
                    marginBottom: '1rem',
                  }}
                >
                  {bounty.prizeSplit}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Link
                  href={bounty.linkUrl}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  View Scope
                </Link>

                <button
                  type="button"
                  onClick={() => handleOpenSubmit(bounty)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: '#E6007A',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Submit Work
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submission Modal */}
      {activeSubmissionBounty && (
        <div
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveSubmissionBounty(null);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.25rem',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bounty-submission-dialog-title"
            style={{
              background: '#0D0D12',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              maxWidth: '38rem',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveSubmissionBounty(null)}
              aria-label="Close dialog"
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ✕
            </button>

            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#E6007A',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: '0.35rem',
              }}
            >
              OFFICIAL DELIVERABLE SUBMISSION
            </div>
            <h3
              id="bounty-submission-dialog-title"
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '0.5rem',
              }}
            >
              {activeSubmissionBounty.title}
            </h3>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.65)',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              Submit your completed Pull Request, code repository, and verification notes for review
              under this prototype escrow scenario on Sepolia testnet.
            </p>

            {/* Auth check banner */}
            {!user && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(230, 0, 122, 0.08)',
                  border: '1px solid rgba(230, 0, 122, 0.3)',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: '#ff40a4',
                    fontSize: '0.875rem',
                    marginBottom: '0.35rem',
                  }}
                >
                  Authentication Required
                </div>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.75)',
                    margin: '0 0 0.75rem',
                  }}
                >
                  You must be signed in to submit deliverables and receive escrow payouts on
                  DevForge.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link
                    href={`/auth/sign-in?redirect=${encodeURIComponent(activeSubmissionBounty.linkUrl)}`}
                    className="btn-pill-primary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/sign-up?role=freelancer"
                    className="btn-pill-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
                  >
                    Register Specialist
                  </Link>
                </div>
              </div>
            )}

            {formError && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#EF4444',
                  fontSize: '0.825rem',
                  marginBottom: '1.25rem',
                }}
              >
                {formError}
              </div>
            )}

            {submissionResult ? (
              <div
                style={{
                  padding: '1.75rem',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#10B981',
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    margin: '0 auto 1rem',
                  }}
                >
                  ✓
                </div>
                <h4 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Deliverable Registered in Database
                </h4>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#10B981',
                    marginBottom: '0.75rem',
                  }}
                >
                  Submission ID: {submissionResult.id}
                </div>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.75)',
                    lineHeight: 1.6,
                    maxWidth: '28rem',
                    margin: '0 auto 1.5rem',
                  }}
                >
                  Your work deliverable has been recorded in the DevForge database and queued for
                  technical review. Once approved, escrow funds will release to:
                  <span
                    style={{
                      display: 'block',
                      marginTop: '0.35rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    {submissionResult.payoutAddress}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubmissionBounty(null)}
                  className="btn-pill-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitWork}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.75)',
                      display: 'block',
                      marginBottom: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    Pull Request or Public Repository URL *
                  </label>
                  <input
                    ref={prInputRef}
                    type="url"
                    required
                    placeholder="https://github.com/organization/repo/pull/42"
                    value={prUrl}
                    onChange={(e) => setPrUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.75)',
                      display: 'block',
                      marginBottom: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    Live Demo / Sepolia Transaction Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://sepolia.etherscan.io/tx/0x... or live app URL"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.75)',
                      display: 'block',
                      marginBottom: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    Implementation Summary & Verification Notes *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Explain your approach, testing setup (e.g. Foundry/Halmos passes), and how the acceptance criteria are met..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      lineHeight: 1.45,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.75)',
                      display: 'block',
                      marginBottom: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    Sepolia Payout Address (ERC-20 USDC) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0x71C84164b3c915122e265646cD8266395A344e45"
                    value={payoutAddress}
                    onChange={(e) => setPayoutAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.45)',
                      marginTop: '0.35rem',
                    }}
                  >
                    Must be a valid 42-character Ethereum address (0x...)
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSubmissionBounty(null)}
                    className="btn-pill-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !prUrl || !summary || !payoutAddress}
                    className="btn-pill-primary"
                    style={{
                      fontSize: '0.85rem',
                      opacity: isSubmitting || !prUrl || !summary || !payoutAddress ? 0.6 : 1,
                    }}
                  >
                    {isSubmitting ? 'Registering Submission...' : 'Submit Work for Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Sign-in Gate Dialog for Anonymous Visitors */}
      {authGateBounty && (
        <div
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuthGateBounty(null);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.25rem',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-gate-dialog-title"
            style={{
              background: '#0D0D12',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              maxWidth: '32rem',
              width: '100%',
              padding: '2.25rem 2rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setAuthGateBounty(null)}
              aria-label="Close dialog"
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(230, 0, 122, 0.12)',
                color: '#E6007A',
                border: '1px solid rgba(230, 0, 122, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                margin: '0 auto 1.25rem',
              }}
            >
              🔒
            </div>
            <h3
              id="auth-gate-dialog-title"
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '0.65rem',
              }}
            >
              Authentication Required
            </h3>
            <p
              style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.6,
                marginBottom: '1.75rem',
              }}
            >
              You must be signed in as a verified specialist to submit deliverables and receive
              testnet escrow payouts for{' '}
              <strong style={{ color: '#FFFFFF' }}>{authGateBounty.title}</strong>.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href={`/auth/sign-in?redirect=${encodeURIComponent(authGateBounty.linkUrl)}`}
                className="btn-pill-primary"
                style={{ fontSize: '0.85rem', padding: '0.65rem 1.4rem' }}
              >
                Sign In to DevForge →
              </Link>
              <Link
                href="/auth/sign-up?role=freelancer"
                className="btn-pill-secondary"
                style={{ fontSize: '0.85rem', padding: '0.65rem 1.25rem' }}
              >
                Register Specialist
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
