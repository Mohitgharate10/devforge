'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdminAnalytics {
  activeContractsCount: number;
  totalEscrowVolumeEth: number;
  totalDisputesCount: number;
  resolvedDisputesCount: number;
  platformFeeEth: number;
  averageRating: number;
  totalUsersCount: number;
}

interface ReportItem {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  category: string;
  reason: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [aRes, rRes] = await Promise.all([
        fetch('/api/v1/admin/analytics'),
        fetch('/api/v1/admin/moderation'),
      ]);
      const [aJson, rJson] = await Promise.all([aRes.json(), rRes.json()]);
      if (aJson.data) setAnalytics(aJson.data);
      if (rJson.data) setReports(rJson.data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [aRes, rRes] = await Promise.all([
          fetch('/api/v1/admin/analytics'),
          fetch('/api/v1/admin/moderation'),
        ]);
        const [aJson, rJson] = await Promise.all([aRes.json(), rRes.json()]);
        if (!ignore) {
          if (aJson.data) setAnalytics(aJson.data);
          if (rJson.data) setReports(rJson.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleUpdateReportStatus = async (reportId: string, status: ReportItem['status']) => {
    try {
      setUpdatingId(reportId);
      const res = await fetch('/api/v1/admin/moderation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getSeverityPill = (severity: ReportItem['severity']) => {
    const colors: Record<string, { bg: string; color: string; border: string }> = {
      CRITICAL: {
        bg: 'rgba(239, 68, 68, 0.2)',
        color: '#EF4444',
        border: 'rgba(239, 68, 68, 0.4)',
      },
      HIGH: { bg: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.4)' },
      MEDIUM: {
        bg: 'rgba(59, 130, 246, 0.2)',
        color: '#3B82F6',
        border: 'rgba(59, 130, 246, 0.4)',
      },
      LOW: {
        bg: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--text-secondary)',
        border: 'var(--border-hairline)',
      },
    };
    const c = colors[severity] || colors.LOW!;
    return (
      <span
        style={{
          fontSize: '0.7rem',
          padding: '0.15rem 0.5rem',
          borderRadius: '9999px',
          background: c.bg,
          color: c.color,
          border: `1px solid ${c.border}`,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
        }}
      >
        {severity}
      </span>
    );
  };

  if (loading) {
    return (
      <main
        style={{
          padding: '5rem 2rem',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
        }}
      >
        Loading platform governance & operations telemetry...
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
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#E6007A',
                border: '1px solid rgba(230, 0, 122, 0.4)',
                background: 'rgba(230, 0, 122, 0.08)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              PLATFORM GOVERNANCE & ARBITRATION
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                background: 'rgba(16, 185, 129, 0.08)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              ● Sepolia Live
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
            DevForge Admin Operations
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
            Smart contract escrow arbitration, dispute mediation queue, trust metrics, and platform
            fee settlement.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            href="/dashboard/contracts"
            className="btn-pill-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            ← Contracts Registry
          </Link>
          <a
            href="https://sepolia.etherscan.io/address/0x633C1B2dE8d4380E83141f2359489569777E4426"
            target="_blank"
            rel="noreferrer"
            className="btn-pill-primary"
            style={{ fontSize: '0.85rem' }}
          >
            Escrow Contract Etherscan ↗
          </a>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      {analytics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
              }}
            >
              ESCROW VOLUME LOCKED
            </div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--accent-pink)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {analytics.totalEscrowVolumeEth} ETH
            </div>
            <div
              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}
            >
              Across active milestone vaults
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
              }}
            >
              ACTIVE ENGAGEMENTS
            </div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {analytics.activeContractsCount}
            </div>
            <div
              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}
            >
              Verified Web3 contracts
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
              }}
            >
              PROTOCOL FEE ACCRUED
            </div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#10B981',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {analytics.platformFeeEth} ETH
            </div>
            <div
              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}
            >
              2.5% platform rate
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
              }}
            >
              TRUST & SATISFACTION
            </div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#F59E0B',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ★ {analytics.averageRating} / 5.0
            </div>
            <div
              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}
            >
              Double-blind review score
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
              }}
            >
              DISPUTE QUEUE
            </div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: analytics.totalDisputesCount > 0 ? '#EF4444' : '#10B981',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {analytics.totalDisputesCount}
            </div>
            <div
              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}
            >
              {analytics.resolvedDisputesCount} resolved
            </div>
          </div>
        </div>
      )}

      {/* Moderation & Dispute Resolution Queue */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-hairline)',
          padding: '2rem',
          marginBottom: '2.5rem',
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
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
              Dispute Arbitration & Moderation Queue
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Audit reports, flag violations, and exercise non-custodial dispute division on escrow
              smart contracts.
            </p>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            {reports.length} Case Records
          </span>
        </div>

        {reports.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ✓ No outstanding disputes or compliance flags in moderation queue.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: '#E6007A',
                        fontWeight: 600,
                      }}
                    >
                      TARGET: {report.targetType}
                    </span>
                    {getSeverityPill(report.severity)}
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background:
                          report.status === 'RESOLVED'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(255, 255, 255, 0.05)',
                        color: report.status === 'RESOLVED' ? '#10B981' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {report.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Category: {report.category}
                  </div>
                  <div
                    style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}
                  >
                    {report.reason}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {report.status !== 'RESOLVED' && (
                    <button
                      disabled={updatingId === report.id}
                      onClick={() => handleUpdateReportStatus(report.id, 'RESOLVED')}
                      className="btn-pill-primary"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.85rem',
                        background: '#10B981',
                        borderColor: '#10B981',
                      }}
                    >
                      {updatingId === report.id ? 'Resolving...' : 'Arbitrate & Resolve ✓'}
                    </button>
                  )}
                  {report.status !== 'INVESTIGATING' && report.status !== 'RESOLVED' && (
                    <button
                      disabled={updatingId === report.id}
                      onClick={() => handleUpdateReportStatus(report.id, 'INVESTIGATING')}
                      className="btn-pill-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
                    >
                      Investigate
                    </button>
                  )}
                  {report.status !== 'DISMISSED' && (
                    <button
                      disabled={updatingId === report.id}
                      onClick={() => handleUpdateReportStatus(report.id, 'DISMISSED')}
                      className="btn-pill-secondary"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.85rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Contract Infrastructure Section */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-hairline)',
          padding: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Smart Contract Infrastructure & Architecture
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Production non-custodial milestone escrow deployed on Sepolia (EVM target: Paris, Solidity
          0.8.24).
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#3B82F6',
                marginBottom: '0.5rem',
              }}
            >
              DEVFORGE ESCROW SMART CONTRACT
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                wordBreak: 'break-all',
              }}
            >
              0x633C1B2dE8d4380E83141f2359489569777E4426
            </div>
            <div
              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}
            >
              Features: ReentrancyGuard, Ownable, MilestoneVault, Dispute Arbitration
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#10B981',
                marginBottom: '0.5rem',
              }}
            >
              ARBITRATOR / PLATFORM MULTISIG
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                wordBreak: 'break-all',
              }}
            >
              0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
            </div>
            <div
              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}
            >
              Enforces dispute resolution split and emergency protocol mediation
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
