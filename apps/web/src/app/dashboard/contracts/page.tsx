'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ContractItem {
  id: string;
  jobId: string;
  proposalId: string;
  title: string;
  totalAmount: number;
  currency: string;
  status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'DISPUTED';
  client: {
    id: string;
    organizationName: string;
    slug: string | null;
  };
  freelancer: {
    id: string;
    displayName: string;
    handle: string;
    title: string;
  };
  milestonesCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ContractsDashboardPage() {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'DISPUTED'>('ALL');

  useEffect(() => {
    async function fetchContracts() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/contracts');
        const json = await res.json();
        if (json.data?.items) {
          setContracts(json.data.items);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    fetchContracts();
  }, []);

  const filteredContracts = contracts.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const getStatusBadge = (status: ContractItem['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10B981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}>
            ● ACTIVE ENGAGEMENT
          </span>
        );
      case 'COMPLETED':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: 'rgba(230, 0, 122, 0.12)',
            color: '#E6007A',
            border: '1px solid rgba(230, 0, 122, 0.3)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}>
            ✓ SETTLED & COMPLETE
          </span>
        );
      case 'DISPUTED':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#EF4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}>
            ⚠ ARBITRATION OPEN
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <main style={{ padding: '3.5rem 2rem', maxWidth: '75rem', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              display: 'inline-block',
              boxShadow: '0 0 10px #10B981',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              color: '#10B981',
              fontWeight: 600,
            }}>
              MILESTONE ESCROW REGISTRY
            </span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Active Engagements & Contracts
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
            Governed milestone smart contracts, escrow liquidity balances, and delivery acceptance workbench.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/dashboard/proposals" className="btn-pill-secondary" style={{ fontSize: '0.85rem' }}>
            ← Bids & Proposals
          </Link>
          <Link href="/jobs" className="btn-pill-primary" style={{ fontSize: '0.85rem' }}>
            Find New Engagement →
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-hairline)',
        marginBottom: '2rem',
        paddingBottom: '0.75rem',
      }}>
        {(['ALL', 'ACTIVE', 'COMPLETED', 'DISPUTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: statusFilter === tab ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: statusFilter === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: statusFilter === tab ? '1px solid var(--border-hairline)' : '1px solid transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab === 'ALL' ? 'All Contracts' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Listing */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Syncing contract escrow state...
        </div>
      ) : filteredContracts.length === 0 ? (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-hairline)',
        }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            No contracts found under this filter.
          </p>
          <Link href="/dashboard/proposals" className="btn-pill-primary" style={{ fontSize: '0.85rem' }}>
            Review Pending Proposals
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
          {filteredContracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/dashboard/contracts/${contract.id}`}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-hairline)',
                padding: '2rem',
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.2s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(230,0,122,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hairline)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                      {contract.title}
                    </h3>
                    {getStatusBadge(contract.status)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    <span>Client: <strong style={{ color: 'var(--text-primary)' }}>{contract.client.organizationName}</strong></span>
                    <span>•</span>
                    <span>Freelancer: <strong style={{ color: 'var(--text-primary)' }}>{contract.freelancer.displayName}</strong></span>
                    <span>•</span>
                    <span>Milestones: {contract.milestonesCount} phases</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: '#E6007A',
                  }}>
                    ${contract.totalAmount.toLocaleString()} {contract.currency}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Total Locked Value
                  </div>
                </div>
              </div>

              {/* Progress and status line */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-hairline)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
              }}>
                <span>Contract ID: <code>{contract.id}</code></span>
                <span style={{ color: '#E6007A', fontWeight: 600 }}>Open Escrow Workbench →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
