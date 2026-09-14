'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ProjectChat } from '@/components/ProjectChat';

interface Delivery {
  id: string;
  milestoneId: string;
  freelancerProfileId: string;
  description: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

interface Milestone {
  id: string;
  contractId: string;
  sequence: number;
  title: string;
  description: string | null;
  amount: number;
  dueDate: string | null;
  status: 'PENDING' | 'FUNDED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'DISPUTED' | 'REFUNDED';
  deliveries: Delivery[];
  createdAt: string;
  updatedAt: string;
}

interface ContractDetail {
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
  milestones: Milestone[];
  participants: Array<{ userId: string; role: string }>;
  createdAt: string;
  updatedAt: string;
}

interface EscrowRecord {
  id: string;
  contractId: string;
  milestoneId: string | null;
  vaultKey: string;
  chainId: number;
  status: 'PENDING' | 'DEPOSITED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  amount: string;
  tokenSymbol: string;
  clientAddress: string;
  freelancerAddress: string;
  depositTxHash: string | null;
  releaseTxHash: string | null;
  createdAt: string;
}

interface ReviewRecord {
  id: string;
  contractId: string;
  authorId: string;
  authorName: string;
  rating: number;
  feedback: string;
  qualityRating: number | null;
  communicationRating: number | null;
  deadlineRating: number | null;
  createdAt: string;
}

export default function ContractWorkbenchPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = use(params);
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [escrows, setEscrows] = useState<EscrowRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeliveryMilestoneId, setActiveDeliveryMilestoneId] = useState<string | null>(null);
  const [deliveryDescription, setDeliveryDescription] = useState('');
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [qualityRating, setQualityRating] = useState(5);
  const [commRating, setCommRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [blockchainActionMsg, setBlockchainActionMsg] = useState<string | null>(null);

  const reloadData = async () => {
    try {
      const [cRes, eRes, rRes] = await Promise.all([
        fetch(`/api/v1/contracts/${contractId}`),
        fetch(`/api/v1/contracts/${contractId}/escrow`),
        fetch(`/api/v1/contracts/${contractId}/reviews`),
      ]);

      const [cJson, eJson, rJson] = await Promise.all([cRes.json(), eRes.json(), rRes.json()]);
      if (cJson.data) setContract(cJson.data);
      if (eJson.data) setEscrows(eJson.data);
      if (rJson.data) setReviews(rJson.data);
    } catch (err) {
      console.error('Failed to reload contract workbench data:', err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [cRes, eRes, rRes] = await Promise.all([
          fetch(`/api/v1/contracts/${contractId}`),
          fetch(`/api/v1/contracts/${contractId}/escrow`),
          fetch(`/api/v1/contracts/${contractId}/reviews`),
        ]);

        const [cJson, eJson, rJson] = await Promise.all([cRes.json(), eRes.json(), rRes.json()]);
        if (!ignore) {
          if (cJson.data) setContract(cJson.data);
          if (eJson.data) setEscrows(eJson.data);
          if (rJson.data) setReviews(rJson.data);
        }
      } catch (err) {
        console.error(err);
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
  }, [contractId]);

  const handleDepositEscrow = async (milestone: Milestone) => {
    try {
      setSubmitting(true);
      setBlockchainActionMsg(`Broadcasting milestone #${milestone.sequence} deposit to Sepolia network...`);

      // Mocked deterministic transaction hash for demonstration on Sepolia
      const mockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      const res = await fetch(`/api/v1/contracts/${contractId}/escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: milestone.id,
          milestoneIndex: milestone.sequence - 1,
          amountEth: (milestone.amount / 1000000).toFixed(2),
          clientAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          freelancerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          txHash: mockHash,
        }),
      });

      if (res.ok) {
        setBlockchainActionMsg(`✓ Sepolia Escrow Funded: Tx ${mockHash.slice(0, 10)}...`);
        await reloadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
      setTimeout(() => setBlockchainActionMsg(null), 6000);
    }
  };

  const handleSubmitDelivery = async (e: React.FormEvent, milestoneId: string) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/v1/milestones/${milestoneId}/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: deliveryDescription }),
      });
      if (res.ok) {
        setActiveDeliveryMilestoneId(null);
        setDeliveryDescription('');
        await reloadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveDelivery = async (deliveryId: string) => {
    try {
      setSubmitting(true);
      setBlockchainActionMsg('Releasing milestone funds on Sepolia DevForgeEscrow contract...');

      const res = await fetch(`/api/v1/deliveries/${deliveryId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: approvalFeedback || 'Approved and accepted. High quality deliverables.' }),
      });
      if (res.ok) {
        setApprovalFeedback('');
        setBlockchainActionMsg('✓ Milestone Approved & Payout Transferred to Freelancer!');
        await reloadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
      setTimeout(() => setBlockchainActionMsg(null), 6000);
    }
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/v1/contracts/${contractId}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason || 'Parties disagree on milestone completion criteria.' }),
      });
      if (res.ok) {
        setShowDisputeModal(false);
        setDisputeReason('');
        await reloadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/v1/contracts/${contractId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: '00000000-0000-0000-0000-000000000002', // Freelancer target ID
          rating: reviewRating,
          feedback: reviewFeedback,
          qualityRating,
          communicationRating: commRating,
        }),
      });
      if (res.ok) {
        setShowReviewModal(false);
        setReviewFeedback('');
        await reloadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getMilestoneStatusPill = (status: Milestone['status']) => {
    switch (status) {
      case 'APPROVED':
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
            ✓ APPROVED & RELEASED
          </span>
        );
      case 'SUBMITTED':
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
            ● DELIVERABLE SUBMITTED
          </span>
        );
      case 'FUNDED':
      case 'IN_PROGRESS':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#3B82F6',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}>
            ⚡ ESCROW FUNDED ON SEPOLIA
          </span>
        );
      case 'PENDING':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-hairline)',
            fontFamily: 'var(--font-mono)',
          }}>
            AWAITING ESCROW DEPOSIT
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
          }}>
            ⚠ IN ARBITRATION DISPUTE
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <main style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
        Connecting to on-chain escrow telemetry & DevForge smart contracts...
      </main>
    );
  }

  if (!contract) {
    return (
      <main style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Contract Not Found</h2>
        <Link href="/dashboard/contracts" className="btn-pill-primary">
          ← Return to Contracts
        </Link>
      </main>
    );
  }

  const approvedCount = contract.milestones.filter((m) => m.status === 'APPROVED').length;
  const progressPercent = Math.round((approvedCount / contract.milestones.length) * 100);

  return (
    <main style={{ padding: '3.5rem 2rem', maxWidth: '78rem', margin: '0 auto' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <Link
          href="/dashboard/contracts"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            display: 'inline-block',
            textDecoration: 'none',
          }}
        >
          ← BACK TO CONTRACTS REGISTRY
        </Link>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowReviewModal(true)}
            className="btn-pill-secondary"
            style={{ fontSize: '0.8rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#F59E0B' }}
          >
            ★ Leave Rating & Review
          </button>
          <button
            onClick={() => setShowDisputeModal(true)}
            style={{
              fontSize: '0.8rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'transparent',
              color: '#EF4444',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Open Arbitration Dispute
          </button>
        </div>
      </div>

      {blockchainActionMsg && (
        <div style={{
          background: 'rgba(230, 0, 122, 0.15)',
          border: '1px solid rgba(230, 0, 122, 0.4)',
          borderRadius: '10px',
          padding: '0.75rem 1.25rem',
          color: '#E6007A',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
        }}>
          {blockchainActionMsg}
        </div>
      )}

      {/* Contract Banner */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-hairline)',
        padding: '2.5rem',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: contract.status === 'COMPLETED' ? '#10B981' : contract.status === 'DISPUTED' ? '#EF4444' : '#E6007A',
                border: `1px solid ${contract.status === 'COMPLETED' ? '#10B981' : contract.status === 'DISPUTED' ? '#EF4444' : '#E6007A'}`,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 600,
              }}>
                {contract.status}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#3B82F6',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                background: 'rgba(59, 130, 246, 0.08)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}>
                Sepolia Testnet (ID 11155111)
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{contract.title}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Client: <strong style={{ color: 'var(--text-primary)' }}>{contract.client.organizationName}</strong></span>
              <span>•</span>
              <span>Freelancer: <strong style={{ color: 'var(--text-primary)' }}>{contract.freelancer.displayName}</strong></span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>DevForgeEscrow.sol: <strong>0x633C...4426</strong></span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
              ESCROW TOTAL VALUE
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-pink)', fontFamily: 'var(--font-mono)' }}>
              ${(contract.totalAmount / 100).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{contract.currency}</span>
            </div>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span>Milestone Progress ({approvedCount} of {contract.milestones.length} Released)</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent-pink)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Workbench & Right Project Room */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Milestones, Escrow & Reviews */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Milestones & Escrow Vaults
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {contract.milestones.map((milestone) => {
              const escrow = escrows.find((e) => e.milestoneId === milestone.id);

              return (
                <div
                  key={milestone.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '12px',
                    padding: '1.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          PHASE 0{milestone.sequence}
                        </span>
                        {getMilestoneStatusPill(milestone.status)}
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{milestone.title}</h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        ${(milestone.amount / 100).toLocaleString()} {contract.currency}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        ≈ {(milestone.amount / 1000000).toFixed(2)} ETH
                      </div>
                    </div>
                  </div>

                  {milestone.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                      {milestone.description}
                    </p>
                  )}

                  {/* On-Chain Escrow Status Card */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Sepolia Escrow: </span>
                      {escrow ? (
                        <span style={{ color: escrow.status === 'RELEASED' ? '#10B981' : '#3B82F6' }}>
                          ● {escrow.status} ({escrow.amount} {escrow.tokenSymbol})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>Unfunded Vault</span>
                      )}
                    </div>
                    {escrow?.depositTxHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${escrow.depositTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#E6007A', textDecoration: 'none' }}
                      >
                        Tx: {escrow.depositTxHash.slice(0, 10)}... ↗
                      </a>
                    )}
                  </div>

                  {/* Action: Deposit Escrow */}
                  {milestone.status === 'PENDING' && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleDepositEscrow(milestone)}
                        disabled={submitting}
                        className="btn-pill-primary"
                        style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                      >
                        {submitting ? 'Broadcasting...' : `⚡ Deposit Milestone Escrow on Sepolia (${(milestone.amount / 1000000).toFixed(2)} ETH)`}
                      </button>
                    </div>
                  )}

                  {/* Deliveries */}
                  {milestone.deliveries && milestone.deliveries.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-hairline)' }}>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        SUBMITTED WORK ARTIFACTS
                      </div>
                      {milestone.deliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border-hairline)',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: delivery.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(230, 0, 122, 0.15)',
                              color: delivery.status === 'ACCEPTED' ? '#10B981' : '#E6007A',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600,
                            }}>
                              {delivery.status}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                              {new Date(delivery.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                            {delivery.description}
                          </p>

                          {/* Client Approval / Escrow Release */}
                          {delivery.status === 'SUBMITTED' && (
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                              <input
                                type="text"
                                placeholder="Review notes for release..."
                                value={approvalFeedback}
                                onChange={(e) => setApprovalFeedback(e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem 0.75rem',
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-hairline)',
                                  borderRadius: '6px',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.85rem',
                                }}
                              />
                              <button
                                onClick={() => handleApproveDelivery(delivery.id)}
                                disabled={submitting}
                                className="btn-pill-primary"
                                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                              >
                                {submitting ? 'Releasing Escrow...' : 'Approve & Release Sepolia Payout ✓'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Freelancer Delivery Submission Action */}
                  {(milestone.status === 'FUNDED' || milestone.status === 'IN_PROGRESS') && (
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-hairline)' }}>
                      {activeDeliveryMilestoneId === milestone.id ? (
                        <form onSubmit={(e) => handleSubmitDelivery(e, milestone.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            SUBMIT WORK FOR REVIEW & ON-CHAIN ESCROW RELEASE
                          </div>
                          <textarea
                            required
                            rows={3}
                            placeholder="Detail completed deliverables, PR links, deployment contracts, or IPFS artifacts..."
                            value={deliveryDescription}
                            onChange={(e) => setDeliveryDescription(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              background: 'rgba(0,0,0,0.4)',
                              border: '1px solid var(--border-hairline)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              fontFamily: 'inherit',
                              fontSize: '0.9rem',
                              outline: 'none',
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                              type="button"
                              onClick={() => setActiveDeliveryMilestoneId(null)}
                              className="btn-pill-secondary"
                              style={{ fontSize: '0.8rem' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={submitting}
                              className="btn-pill-primary"
                              style={{ fontSize: '0.8rem' }}
                            >
                              {submitting ? 'Submitting...' : 'Transmit Deliverable →'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setActiveDeliveryMilestoneId(milestone.id)}
                          className="btn-pill-primary"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                        >
                          + Submit Milestone Deliverable
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Published Reviews Section */}
          {reviews.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
                Verified Contract Reviews ({reviews.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: '10px',
                      padding: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.authorName}</span>
                      <span style={{ color: '#F59E0B', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {'★'.repeat(r.rating)} ({r.rating}/5)
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                      &ldquo;{r.feedback}&rdquo;
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {r.qualityRating && <span>Quality: {r.qualityRating}/5</span>}
                      {r.communicationRating && <span>Communication: {r.communicationRating}/5</span>}
                      {r.deadlineRating && <span>Deadline: {r.deadlineRating}/5</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Project Room Chat */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <ProjectChat contractId={contract.id} />
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            maxWidth: '34rem',
            width: '100%',
            padding: '2rem',
          }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F59E0B', marginBottom: '0.5rem' }}>
              Submit Verified Review
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Double-blind review. Revealed upon mutual submission or after the 14-day completion period.
            </p>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Overall Rating (1 to 5 Stars)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-hairline)',
                        background: reviewRating >= star ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                        color: reviewRating >= star ? '#F59E0B' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                    Code / Work Quality
                  </label>
                  <select
                    value={qualityRating}
                    onChange={(e) => setQualityRating(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-hairline)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  >
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                    Communication
                  </label>
                  <select
                    value={commRating}
                    onChange={(e) => setCommRating(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-hairline)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  >
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Detailed Written Feedback (min 10 characters)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your working experience, delivery timeliness, technical precision, and communication..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="btn-pill-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || reviewFeedback.trim().length < 10}
                  className="btn-pill-primary"
                  style={{ background: '#F59E0B', borderColor: '#F59E0B' }}
                >
                  {submitting ? 'Publishing Review...' : 'Submit Review ★'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            maxWidth: '34rem',
            width: '100%',
            padding: '2rem',
          }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#EF4444', marginBottom: '0.75rem' }}>
              Initiate Dispute Mediation
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Freezes automated escrow release for this contract and triggers neutral arbitrator review per Web3 course escrow guidelines.
            </p>

            <form onSubmit={handleOpenDispute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea
                required
                rows={4}
                placeholder="Reason for dispute mediation..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="btn-pill-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-pill-primary"
                  style={{ background: '#EF4444', borderColor: '#EF4444' }}
                >
                  {submitting ? 'Opening Dispute...' : 'Confirm Dispute Freeze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
