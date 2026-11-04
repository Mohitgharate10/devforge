'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';

export type JobCard = {
  id: string;
  title: string;
  description: string;
  category: string;
  client: string;
  budget: string;
  currency: string;
  skills: string[];
  publishedAt: string;
  isLocalNew?: boolean;
};

const DEFAULT_JOBS: JobCard[] = [
  {
    id: 'job-substrate-pallet',
    title: 'Substrate Parachain Governance Pallet Developer',
    description:
      'Design and implement open governance pallets with multi-asset conviction voting and time-locked treasury executions for the Polkadot Fellowship.',
    category: 'Full Stack Web3',
    client: 'Polkadot Fellowship',
    budget: '$10,000 – $16,000',
    currency: 'USDC',
    skills: ['Rust', 'Substrate', 'FRAME', 'Polkadot SDK'],
    publishedAt: '3 hours ago',
  },
  {
    id: 'job-bridge-audit',
    title: 'EVM & Substrate Cross-Chain Bridge Security Audit',
    description:
      'Seeking senior smart contract security researchers to perform formal verification and manual auditing on our EIP-712 cross-chain token bridge contracts.',
    category: 'Smart Contract Auditing',
    client: 'Parity Ecosystem Fund',
    budget: '$12,000 – $18,000',
    currency: 'USDC',
    skills: ['Solidity', 'Foundry', 'Rust'],
    publishedAt: '4 hours ago',
  },
  {
    id: 'job-zk-circuit',
    title: 'ZK-Rollup Proof Verifier Circuit Optimization',
    description:
      'We need a cryptography systems specialist to optimize on-chain Groth16 proof verifier contracts on Sepolia to minimize Layer 2 verification gas.',
    category: 'Zero Knowledge & Cryptography',
    client: 'Axiom Research Labs',
    budget: '$15,000 – $25,000',
    currency: 'USDC',
    skills: ['Zero-Knowledge', 'Rust', 'Viem'],
    publishedAt: '12 hours ago',
  },
  {
    id: 'job-escrow-ui',
    title: 'Polkadot-Aesthetic Web3 Escrow Terminal',
    description:
      'Looking for a frontend specialist to craft high-frequency milestone settlement dashboards with Next.js 16, Viem, and custom SVG telemetry.',
    category: 'Full Stack Web3',
    client: 'DevForge Labs',
    budget: '$8,000 – $14,000',
    currency: 'USDC',
    skills: ['Next.js', 'TypeScript', 'Viem'],
    publishedAt: '1 day ago',
  },
  {
    id: 'job-keeper-bot',
    title: 'Decentralized Liquidation Keeper Bot in Rust',
    description:
      'High-speed off-chain liquidation keeper watching mempool arbitrage and executing instant Flash-Loan liquidation transactions.',
    category: 'Infrastructure & DevOps',
    client: 'Koda Liquidations',
    budget: '$6,000 – $10,000',
    currency: 'USDC',
    skills: ['Rust', 'Solidity', 'Mempool'],
    publishedAt: '2 days ago',
  },
];

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): string {
  try {
    return localStorage.getItem('devforge_demo_jobs') || '[]';
  } catch {
    return '[]';
  }
}

function getServerSnapshot(): string {
  return '[]';
}

export function JobMarketplaceGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const rawStored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let allJobs = DEFAULT_JOBS;
  try {
    const parsed: JobCard[] = JSON.parse(rawStored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const combined = [...parsed, ...DEFAULT_JOBS];
      allJobs = Array.from(new Map(combined.map((j) => [j.id, j])).values());
    }
  } catch {
    // ignore
  }

  const categories = ['ALL', 'Smart Contract Auditing', 'Zero Knowledge & Cryptography', 'Full Stack Web3', 'Infrastructure & DevOps'];

  const filteredJobs = allJobs.filter((job) => {
    const matchesCategory = selectedCategory === 'ALL' || job.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search roles by title, keyword, or skill (e.g. Solidity, ZK, Rust)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                border: selectedCategory === cat ? '1px solid var(--accent-magenta)' : '1px solid var(--border-hairline)',
                background: selectedCategory === cat ? 'rgba(230, 0, 122, 0.1)' : 'var(--bg-surface)',
                color: selectedCategory === cat ? 'var(--accent-magenta)' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat === 'ALL' ? 'ALL DISCIPLINES' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredJobs.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              borderRadius: '12px',
              border: '1px dashed var(--border-hairline)',
              color: 'var(--text-secondary)',
            }}
          >
            No open roles found matching your criteria.
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="card-editorial"
              style={{
                display: 'block',
                textDecoration: 'none',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: 'var(--accent-magenta)',
                      }}
                    >
                      {job.category}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {job.client}
                    </span>
                    {job.isLocalNew && (
                      <span className="skill-tag" style={{ fontSize: '0.65rem', borderColor: 'var(--status-live)', color: 'var(--status-live)' }}>
                        NEW BOUNTY
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    {job.title}
                  </h2>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-live)' }}>
                    {job.budget}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {job.currency} ESCROW
                  </div>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {job.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {job.skills.map((s) => (
                    <span key={s} className="skill-tag accent" style={{ fontSize: '0.75rem' }}>
                      {s}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Posted {job.publishedAt} →
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
