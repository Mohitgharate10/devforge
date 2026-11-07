'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface ProposalItem {
  id: string;
  jobId: string;
  jobTitle?: string;
  freelancerProfileId: string;
  freelancer?: {
    id: string;
    displayName: string;
    handle: string;
    title: string;
    avatarUrl: string | null;
  };
  coverLetter: string;
  bidAmount: number;
  currency: string;
  status: 'SUBMITTED' | 'WITHDRAWN' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export default function ProposalsDashboardPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Accept Proposal Modal State
  const [acceptingProposal, setAcceptingProposal] = useState<ProposalItem | null>(null);
  const [milestone1Title, setMilestone1Title] = useState('Phase 1: Architecture Review & Spec');
  const [milestone1Amount, setMilestone1Amount] = useState<number>(0);
  const [milestone2Title, setMilestone2Title] = useState(
    'Phase 2: Final Implementation & Verification',
  );
  const [milestone2Amount, setMilestone2Amount] = useState<number>(0);

  const reloadProposals = async () => {
    try {
      const res = await fetch('/api/v1/proposals');
      const json = await res.json();
      if (json.data?.items) {
        setProposals(json.data.items);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/v1/proposals');
        const json = await res.json();
        if (!ignore && json.data?.items) {
          setProposals(json.data.items);
        }
      } catch {
        // Ignore
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const openAcceptModal = (proposal: ProposalItem) => {
    setAcceptingProposal(proposal);
    const half = Math.floor(proposal.bidAmount / 2);
    setMilestone1Amount(half);
    setMilestone2Amount(proposal.bidAmount - half);
  };

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingProposal) return;

    try {
      setActionInProgress(acceptingProposal.id);
      const res = await fetch(`/api/v1/proposals/${acceptingProposal.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestones: [
            {
              title: milestone1Title,
              amount: milestone1Amount,
              description: 'Initial review and architecture deliverables',
            },
            {
              title: milestone2Title,
              amount: milestone2Amount,
              description: 'Production implementation and test suites',
            },
          ],
        }),
      });

      if (res.ok) {
        setAcceptingProposal(null);
        await reloadProposals();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleWithdraw = async (proposalId: string) => {
    try {
      setActionInProgress(proposalId);
      const res = await fetch(`/api/v1/proposals/${proposalId}/withdraw`, {
        method: 'POST',
      });
      if (res.ok) {
        await reloadProposals();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      setActionInProgress(proposalId);
      const res = await fetch(`/api/v1/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Client opted for an alternate candidate proposal.' }),
      });
      if (res.ok) {
        await reloadProposals();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredProposals = proposals.filter((p) => {
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  const getStatusBadge = (status: ProposalItem['status']) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(230, 0, 122, 0.12)',
              color: '#E6007A',
              border: '1px solid rgba(230, 0, 122, 0.3)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            ● PENDING REVIEW
          </span>
        );
      case 'ACCEPTED':
        return (
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            ✓ HIRED & ACTIVE
          </span>
        );
      case 'WITHDRAWN':
        return (
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-hairline)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            WITHDRAWN
          </span>
        );
      case 'REJECTED':
        return (
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <main
        style={{ padding: '6rem 1.5rem', maxWidth: '36rem', margin: '0 auto', textAlign: 'center' }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '16px',
            padding: '3rem 2rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(230, 0, 122, 0.12)',
              border: '1px solid rgba(230, 0, 122, 0.3)',
              color: '#E6007A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.25rem',
            }}
          >
            🔒
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Authentication Required
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            You need to be signed in as a client or specialist to access submitted bids and
            proposals.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/auth/sign-in"
              className="btn-pill-primary"
              style={{ padding: '0.75rem 1.75rem' }}
            >
              Sign In to DevForge →
            </Link>
            <Link href="/jobs" className="btn-pill-secondary" style={{ padding: '0.75rem 1.5rem' }}>
              Browse Open Roles
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '3.5rem 2rem', maxWidth: '75rem', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#E6007A',
                display: 'inline-block',
                boxShadow: '0 0 10px #E6007A',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                color: '#E6007A',
                fontWeight: 600,
              }}
            >
              ENGAGEMENT DISPATCH
            </span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Proposals & Bids
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
            Review incoming contractor bids, execute milestone contracts, and monitor submitted work
            proposals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/jobs" className="btn-pill-secondary" style={{ fontSize: '0.85rem' }}>
            Browse Open Roles ↗
          </Link>
          <Link
            href="/dashboard/contracts"
            className="btn-pill-primary"
            style={{ fontSize: '0.85rem' }}
          >
            Active Contracts ({proposals.filter((p) => p.status === 'ACCEPTED').length}) →
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-hairline)',
          marginBottom: '2rem',
          paddingBottom: '0.75rem',
        }}
      >
        {(['ALL', 'SUBMITTED', 'ACCEPTED', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: activeTab === tab ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              border:
                activeTab === tab ? '1px solid var(--border-hairline)' : '1px solid transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab === 'ALL' ? 'All Bids' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Proposals Listing */}
      {loading ? (
        <div
          style={{
            padding: '4rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Loading proposals telemetry...
        </div>
      ) : filteredProposals.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-hairline)',
          }}
        >
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            No proposals found under this filter.
          </p>
          <Link href="/jobs" className="btn-pill-primary" style={{ fontSize: '0.85rem' }}>
            Explore Jobs & Submit Bids
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredProposals.map((proposal) => (
            <div
              key={proposal.id}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-hairline)',
                padding: '1.75rem',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                      {proposal.jobTitle ?? 'Job Engagement'}
                    </h3>
                    {getStatusBadge(proposal.status)}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span>
                      Candidate:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {proposal.freelancer?.displayName ?? 'Elena Rostova'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>Role: {proposal.freelancer?.title ?? 'Security Researcher'}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: '#E6007A',
                    }}
                  >
                    ${proposal.bidAmount.toLocaleString()} {proposal.currency}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Total Proposed Escrow
                  </div>
                </div>
              </div>

              {/* Cover Note */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '0.4rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  PROPOSAL MEMORANDUM
                </div>
                {proposal.coverLetter}
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Submitted:{' '}
                  {new Date(proposal.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {proposal.status === 'SUBMITTED' && (
                    <>
                      <button
                        onClick={() => handleWithdraw(proposal.id)}
                        disabled={actionInProgress === proposal.id}
                        className="btn-pill-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                      >
                        Withdraw
                      </button>
                      <button
                        onClick={() => handleReject(proposal.id)}
                        disabled={actionInProgress === proposal.id}
                        className="btn-pill-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', color: '#EF4444' }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => openAcceptModal(proposal)}
                        disabled={actionInProgress === proposal.id}
                        className="btn-pill-primary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 1.2rem' }}
                      >
                        Accept & Hire Candidate →
                      </button>
                    </>
                  )}

                  {proposal.status === 'ACCEPTED' && (
                    <Link
                      href="/dashboard/contracts"
                      className="btn-pill-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                    >
                      View Live Contract Workbench →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accept & Create Contract Modal */}
      {acceptingProposal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '16px',
              maxWidth: '38rem',
              width: '100%',
              padding: '2.5rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                Accept Proposal & Authorize Contract
              </h2>
              <button
                onClick={() => setAcceptingProposal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                }}
              >
                ✕
              </button>
            </div>

            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.75rem',
                lineHeight: 1.5,
              }}
            >
              Accepting this proposal creates a legally binding Web3 milestone contract for{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {acceptingProposal.freelancer?.displayName ?? 'the candidate'}
              </strong>{' '}
              at{' '}
              <strong style={{ color: '#E6007A' }}>
                ${acceptingProposal.bidAmount.toLocaleString()} {acceptingProposal.currency}
              </strong>
              .
            </p>

            <form
              onSubmit={handleAcceptSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem',
                  }}
                >
                  MILESTONE 01 (INITIAL DELIVERABLE)
                </div>
                <input
                  type="text"
                  required
                  value={milestone1Title}
                  onChange={(e) => setMilestone1Title(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Amount ($):
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={milestone1Amount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setMilestone1Amount(val);
                      setMilestone2Amount(acceptingProposal.bidAmount - val);
                    }}
                    style={{
                      width: '140px',
                      padding: '0.4rem 0.6rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem',
                  }}
                >
                  MILESTONE 02 (FINAL COMPLETION)
                </div>
                <input
                  type="text"
                  required
                  value={milestone2Title}
                  onChange={(e) => setMilestone2Title(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Amount ($):
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={milestone2Amount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setMilestone2Amount(val);
                      setMilestone1Amount(acceptingProposal.bidAmount - val);
                    }}
                    style={{
                      width: '140px',
                      padding: '0.4rem 0.6rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'rgba(230,0,122,0.06)',
                  borderRadius: '8px',
                  border: '1px solid rgba(230,0,122,0.2)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                }}
              >
                <span>Total Escrow Commitment:</span>
                <strong style={{ color: '#E6007A' }}>
                  ${(milestone1Amount + milestone2Amount).toLocaleString()}{' '}
                  {acceptingProposal.currency}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '1rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setAcceptingProposal(null)}
                  className="btn-pill-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress === acceptingProposal.id}
                  className="btn-pill-primary"
                >
                  {actionInProgress === acceptingProposal.id
                    ? 'Deploying Contract...'
                    : 'Authorize & Start Contract →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
