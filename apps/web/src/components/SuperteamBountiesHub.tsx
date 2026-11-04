'use client';

import { useState } from 'react';
import Link from 'next/link';

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

const INITIAL_BOUNTIES: BountyItem[] = [
  {
    id: 'bounty-substrate-pallet',
    title: 'Substrate Parachain OpenGov Multi-Asset Conviction Pallet',
    description:
      'Build a custom FRAME pallet allowing parachains to run conviction voting using non-native wrapped reserve tokens with time-locked treasury payout dispatches.',
    sponsorName: 'Polkadot Fellowship',
    sponsorAvatar: 'P',
    sponsorColor: '#E6007A',
    type: 'BOUNTY',
    rewardUsdc: 15000,
    deadlineDaysLeft: 6,
    submissionsCount: 8,
    tags: ['Rust', 'Substrate', 'FRAME', 'Polkadot SDK'],
    linkUrl: '/jobs/job-substrate-pallet',
    escrowStatus: 'PRE-FUNDED',
    prizeSplit: '1st: $9,000 • 2nd: $4,500 • 3rd: $1,500',
  },
  {
    id: 'bounty-bridge-audit',
    title: 'EVM to Substrate Cross-Chain EIP-712 Bridge Formal Verification',
    description:
      'Perform invariant fuzzing and formal verification using Halmos and Foundry to catch reentrancy, signature replay, and relay validation bugs in bridge contracts.',
    sponsorName: 'Parity Ecosystem Fund',
    sponsorAvatar: 'E',
    sponsorColor: '#9333EA',
    type: 'AUDIT CONTEST',
    rewardUsdc: 18000,
    deadlineDaysLeft: 4,
    submissionsCount: 14,
    tags: ['Solidity', 'Foundry', 'Halmos', 'Security'],
    linkUrl: '/jobs/job-bridge-audit',
    escrowStatus: 'PRE-FUNDED',
    prizeSplit: '1st: $10,800 • 2nd: $5,400 • 3rd: $1,800',
  },
  {
    id: 'bounty-zk-circuit',
    title: 'Groth16 Verifier Smart Contract Gas Optimization on Sepolia',
    description:
      'Reduce Layer-2 calldata and pairing execution gas on EVM Groth16 verification contracts by restructuring pairing checks and implementing affine coordinate pre-computations.',
    sponsorName: 'Axiom Research Labs',
    sponsorAvatar: 'A',
    sponsorColor: '#059669',
    type: 'BOUNTY',
    rewardUsdc: 20000,
    deadlineDaysLeft: 9,
    submissionsCount: 5,
    tags: ['Zero-Knowledge', 'Circom', 'Rust', 'Viem'],
    linkUrl: '/jobs/job-zk-circuit',
    escrowStatus: 'PRE-FUNDED',
    prizeSplit: '1st: $12,000 • 2nd: $6,000 • 3rd: $2,000',
  },
  {
    id: 'bounty-keeper-bot',
    title: 'High-Frequency Decentralized Liquidation Keeper Daemon in Rust',
    description:
      'Develop an ultra-low latency off-chain keeper bot monitoring mempool price oracle feeds and executing automated Flash-Loan liquidations through multi-call smart contracts.',
    sponsorName: 'Arbitrum Foundation',
    sponsorAvatar: 'K',
    sponsorColor: '#2563EB',
    type: 'GRANT',
    rewardUsdc: 8500,
    deadlineDaysLeft: 12,
    submissionsCount: 11,
    tags: ['Rust', 'Mempool', 'Solidity', 'Arbitrum'],
    linkUrl: '/jobs',
    escrowStatus: 'VERIFIED',
    prizeSplit: 'Full Grant Payout: $8,500 USDC',
  },
];

export function SuperteamBountiesHub({ isHomepage = false }: { isHomepage?: boolean }) {
  const [bounties, setBounties] = useState<BountyItem[]>(INITIAL_BOUNTIES);
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'BOUNTY' | 'AUDIT CONTEST' | 'GRANT'>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [activeSubmissionBounty, setActiveSubmissionBounty] = useState<BountyItem | null>(null);

  // Submission Form State
  const [prUrl, setPrUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('0x71C84164b3c915122e265646cD8266395A344e45');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const availableTags = ['ALL', 'Rust', 'Solidity', 'Zero-Knowledge', 'Substrate', 'Foundry'];

  const filtered = bounties.filter((b) => {
    const matchesTab = selectedTab === 'ALL' || b.type === selectedTab;
    const matchesTag = selectedTag === 'ALL' || b.tags.includes(selectedTag);
    return matchesTab && matchesTag;
  });

  const handleOpenSubmit = (bounty: BountyItem) => {
    setActiveSubmissionBounty(bounty);
    setSubmissionSuccess(false);
    setPrUrl('');
    setDemoUrl('');
    setSummary('');
  };

  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionBounty) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Increment submission counter in local state
      setBounties((prev) =>
        prev.map((item) =>
          item.id === activeSubmissionBounty.id
            ? { ...item, submissionsCount: item.submissionsCount + 1 }
            : item,
        ),
      );
      setIsSubmitting(false);
      setSubmissionSuccess(true);
    }, 900);
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
            <span>SUPERTEAM EARN ARCHITECTURE</span>
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
            Fixed-scope Web3 tasks, security audits, and developer grants. Pre-funded in smart contract vaults on Sepolia with guaranteed payouts.
          </p>
        </div>

        {isHomepage && (
          <Link
            href="/bounties"
            className="btn-pill-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }}
          >
            <span>Explore All Bounties</span>
            <span>→</span>
          </Link>
        )}
      </div>

      {/* Superteam Filter Rail: Type Tabs & Skill Pills */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.5rem',
          marginBottom: '1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Type Tabs */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            padding: '3px',
            gap: '2px',
          }}
        >
          {[
            { id: 'ALL', label: 'All Opportunities' },
            { id: 'BOUNTY', label: 'Bounties' },
            { id: 'AUDIT CONTEST', label: 'Audit Contests' },
            { id: 'GRANT', label: 'Grants' },
          ].map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '9999px',
                  border: 'none',
                  background: isActive ? '#E6007A' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Skill Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {availableTags.map((tag) => {
            const isActive = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  border: isActive
                    ? '1px solid rgba(230, 0, 122, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isActive ? 'rgba(230, 0, 122, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? '#E6007A' : 'rgba(255, 255, 255, 0.6)',
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
      </div>

      {/* Bounties List: Clean, Handcrafted Superteam Earn Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              gap: '1.25rem',
              transition: 'border-color 0.2s ease, transform 0.2s ease',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
            }}
          >
            {/* Top Bar: Sponsor + Bounty Type + Reward Pill */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `${bounty.sponsorColor}22`,
                    border: `1px solid ${bounty.sponsorColor}55`,
                    color: bounty.sponsorColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {bounty.sponsorAvatar}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.85)',
                      }}
                    >
                      {bounty.sponsorName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(230, 0, 122, 0.1)',
                        border: '1px solid rgba(230, 0, 122, 0.25)',
                        color: '#E6007A',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                      }}
                    >
                      {bounty.type}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    ● Sepolia Vault Pre-Funded
                  </span>
                </div>
              </div>

              {/* Reward Badge */}
              <div
                style={{
                  textAlign: 'right',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                  }}
                >
                  ${bounty.rewardUsdc.toLocaleString()} USDC
                </div>
                {bounty.prizeSplit && (
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {bounty.prizeSplit}
                  </div>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <Link
                href={bounty.linkUrl}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h3
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    margin: '0 0 0.5rem 0',
                    lineHeight: 1.35,
                  }}
                >
                  {bounty.title}
                </h3>
              </Link>
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '0.88rem',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {bounty.description}
              </p>
            </div>

            {/* Bottom Meta Bar: Tags, Deadline, Submissions, Submit Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {/* Skill Tags */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {bounty.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Right Side: Timeline & CTA Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                    {bounty.deadlineDaysLeft} days left
                  </span>
                  <span>{bounty.submissionsCount} submissions</span>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <Link
                    href={bounty.linkUrl}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '9999px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: 'transparent',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Details
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleOpenSubmit(bounty)}
                    style={{
                      padding: '0.45rem 1.1rem',
                      borderRadius: '9999px',
                      border: '1px solid #E6007A',
                      background: '#E6007A',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 0 16px rgba(230, 0, 122, 0.25)',
                    }}
                  >
                    Submit Work
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Superteam Earn-Style Work Submission Modal */}
      {activeSubmissionBounty && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#0D0D12',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              maxWidth: '36rem',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#E6007A',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  SUPERTEAM EARN SUBMISSION
                </span>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    margin: '0.25rem 0',
                  }}
                >
                  {activeSubmissionBounty.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.825rem',
                    color: 'rgba(255, 255, 255, 0.55)',
                    margin: 0,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Prize Pool: ${activeSubmissionBounty.rewardUsdc.toLocaleString()} USDC • Sepolia Smart Escrow
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubmissionBounty(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                ✕
              </button>
            </div>

            {submissionSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10B981',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    margin: '0 auto 1rem auto',
                  }}
                >
                  ✓
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Work Submission Received!
                </h4>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.65)',
                    lineHeight: 1.5,
                    marginBottom: '1.5rem',
                  }}
                >
                  Your submission has been registered and timestamped. The sponsor council will evaluate pull request invariants when the bounty concludes in {activeSubmissionBounty.deadlineDaysLeft} days.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubmissionBounty(null)}
                  className="btn-pill-primary"
                  style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitWork} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
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
                    GitHub Pull Request or Repository Link *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/org/repo/pull/14"
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
                      fontFamily: 'var(--font-mono)',
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
                    Live Demo, Contract Deployment, or IPFS Link (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://sepolia.etherscan.io/address/0x... or ipfs://..."
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
                      fontFamily: 'var(--font-mono)',
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
                    placeholder="0x..."
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
                    disabled={isSubmitting || !prUrl || !summary}
                    className="btn-pill-primary"
                    style={{
                      fontSize: '0.85rem',
                      opacity: isSubmitting || !prUrl || !summary ? 0.6 : 1,
                    }}
                  >
                    {isSubmitting ? 'Submitting to Escrow...' : 'Submit Work for Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
