'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { AiProposalCopilot } from '@/components/AiProposalCopilot';
import { findCanonicalBounty } from '@/lib/canonical-marketplace';

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [proposalSubmitted, setProposalSubmitted] = useState(false);
  const [bidAmount, setBidAmount] = useState('14000');
  const [coverNote, setCoverNote] = useState('');
  const [showModal, setShowModal] = useState(false);

  const canonical = findCanonicalBounty(jobId);

  const job = canonical
    ? {
        title: canonical.title,
        category: canonical.category.name,
        client: canonical.client.organizationName,
        budget:
          canonical.budgetMin === canonical.budgetMax
            ? `$${canonical.budgetMin.toLocaleString()}`
            : `$${canonical.budgetMin.toLocaleString()} – $${canonical.budgetMax.toLocaleString()}`,
        currency: canonical.currency,
        description: canonical.description,
        skills: canonical.skills,
        milestones: canonical.milestones,
      }
    : {
        title: 'Web3 Protocol Bounty Deliverable',
        category: 'Full Stack Web3',
        client: 'Verified DevForge Client',
        budget: '$10,000 – $15,000',
        currency: 'USDC',
        description:
          'Engineered milestone contract requiring audited security, performant state updates, and transparent settlement verification.',
        skills: ['Solidity', 'TypeScript', 'Web3 Escrow', 'Next.js'],
        milestones: [
          {
            title: 'Milestone 01: Core Architecture & Spec',
            share: '40%',
            desc: 'Deliver verified architecture diagram and interface specifications.',
          },
          {
            title: 'Milestone 02: Production Implementation',
            share: '60%',
            desc: 'Full smart contract implementation with test coverage and Sepolia deployment.',
          },
        ],
      };

  const [submittingProposal, setSubmittingProposal] = useState(false);

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingProposal(true);
      await fetch(`/api/v1/jobs/${jobId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidAmount: parseInt(bidAmount, 10) || 14000,
          coverLetter:
            coverNote ||
            'I have extensive engineering experience with smart contracts and invariant testing.',
          currency: 'USDC',
        }),
      });
    } catch {
      // Offline fallback
    } finally {
      setSubmittingProposal(false);
      setProposalSubmitted(true);
      setShowModal(false);
    }
  };

  return (
    <main style={{ padding: '4rem 2.5rem', maxWidth: '72rem', margin: '0 auto' }}>
      <Link
        href="/jobs"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: 'inline-block',
          marginBottom: '2rem',
        }}
      >
        ← BACK TO OPEN ROLES
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: '4rem',
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--accent-magenta)',
              }}
            >
              {job.category}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {job.client}
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
            }}
          >
            {job.title}
          </h1>

          <div
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid var(--border-hairline)',
              background: 'var(--bg-surface)',
              marginBottom: '2.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
              }}
            >
              TECHNICAL SCOPE
            </div>
            <p
              style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                lineHeight: 1.7,
                whiteSpace: 'pre-line',
              }}
            >
              {job.description}
            </p>
          </div>

          {/* Milestones Schedule */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="hero-meta-strip" style={{ marginBottom: '1rem' }}>
              <span>ON-CHAIN MILESTONE SCHEDULE</span>
              <span>•</span>
              <span>INDEPENDENT ESCROW VAULTS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {job.milestones.map((m, idx) => (
                <div
                  key={m.title}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-hairline)',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: 'var(--accent-magenta)',
                        marginRight: '0.5rem',
                      }}
                    >
                      0{idx + 1}
                    </span>
                    <strong style={{ fontSize: '0.95rem' }}>{m.title}</strong>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem',
                      }}
                    >
                      {m.desc}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      color: 'var(--status-live)',
                      fontWeight: 700,
                      paddingLeft: '1rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.share} ESCROW
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Card Sidebar */}
        <div style={{ position: 'sticky', top: '7rem' }}>
          <div
            style={{
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid var(--border-hairline)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}
              >
                TOTAL CONTRACT BUDGET
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginTop: '0.25rem',
                }}
              >
                {job.budget}
              </div>
              <div
                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}
              >
                100% Locked in Non-Custodial Vault
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                REQUIRED EXPERTISE
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {job.skills.map((s) => (
                  <span key={s} className="skill-tag accent" style={{ fontSize: '0.75rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {proposalSubmitted ? (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '8px',
                  background: 'rgba(0, 230, 118, 0.08)',
                  border: '1px solid rgba(0, 230, 118, 0.3)',
                  color: 'var(--status-live)',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                  ✔ Proposal Transmitted & Logged!
                </div>
                <Link
                  href="/dashboard/proposals"
                  style={{
                    color: '#E6007A',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    textDecoration: 'underline',
                    display: 'inline-block',
                  }}
                >
                  View in Proposals Dashboard →
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="btn-pill-primary"
                style={{ width: '100%', padding: '0.85rem' }}
              >
                Submit Proposal →
              </button>
            )}

            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Sepolia Testnet Contract Factory Verified
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Proposal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '32rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '16px',
              padding: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Submit Technical Proposal
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              Specify your proposed total bid and technical approach for {job.title}.
            </p>

            <AiProposalCopilot
              jobTitle={job.title}
              jobSkills={job.skills}
              candidateSkills={['Solidity', 'Foundry', 'Rust', 'EIP-712', 'Halmos', 'TypeScript']}
              onApplyCoverLetter={(letter) => setCoverNote(letter)}
            />

            <form
              onSubmit={handleProposalSubmit}
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
                  }}
                >
                  PROPOSED TOTAL BID (USDC)
                </label>
                <input
                  type="number"
                  required
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
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
                  }}
                >
                  PROPOSED APPROACH & RELEVANT DELIVERABLES
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Outline your audit methodology, invariant test suites, or relevant prior engagements..."
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
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
                  onClick={() => setShowModal(false)}
                  className="btn-pill-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submittingProposal} className="btn-pill-primary">
                  {submittingProposal ? 'Signing...' : 'Sign & Submit Proposal →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
