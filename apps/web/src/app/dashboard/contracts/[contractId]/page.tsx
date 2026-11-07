'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ProjectChat } from '@/components/ProjectChat';
import { TransactionModal } from '@/components/TransactionModal';

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
  const { user } = useAuth();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [escrows, setEscrows] = useState<EscrowRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeliveryMilestoneId, setActiveDeliveryMilestoneId] = useState<string | null>(null);
  const [deliveryDescription, setDeliveryDescription] = useState('');
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [txModal, setTxModal] = useState<{
    isOpen: boolean;
    title: string;
    actionDescription: string;
    status: 'pending' | 'confirmed' | 'failed';
    errorMessage?: string | null;
  }>({ isOpen: false, title: '', actionDescription: '', status: 'pending' });
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [qualityRating, setQualityRating] = useState(5);
  const [commRating, setCommRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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

  const handleDepositEscrow = (milestone: Milestone) => {
    setTxModal({
      isOpen: true,
      title: `Funding unavailable for milestone #${milestone.sequence}`,
      actionDescription: `No payment was made for '${milestone.title}'. On-chain escrow funding is not connected in this prototype.`,
      status: 'failed',
      errorMessage: 'No funds were moved and no transaction was created.',
    });
  };

  const handleSubmitDelivery = async (e: React.FormEvent, milestoneId: string) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setActionMessage(null);
      const res = await fetch(`/api/v1/milestones/${milestoneId}/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id ? { 'x-user-id': user.id } : {}),
        },
        body: JSON.stringify({ description: deliveryDescription }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setActiveDeliveryMilestoneId(null);
        setDeliveryDescription('');
        setActionMessage('Milestone deliverable transmitted successfully for client review!');
        await reloadData();
      } else {
        setActionMessage(
          `Failed to transmit deliverable: ${json?.error?.message || res.statusText || 'Unable to record deliverable'}`,
        );
      }
    } catch (err) {
      console.error(err);
      setActionMessage('Network error occurred while transmitting deliverable.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveDelivery = async (deliveryId: string) => {
    setTxModal({
      isOpen: true,
      title: 'Recording delivery approval',
      actionDescription:
        'Saving the approval in DevForge. This does not release funds or create a blockchain transaction.',
      status: 'pending',
    });
    try {
      setSubmitting(true);
      const res = await fetch(`/api/v1/deliveries/${deliveryId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: approvalFeedback || 'Approved and accepted. High quality deliverables.',
        }),
      });
      if (res.ok) {
        setApprovalFeedback('');
        setActionMessage('Delivery approved in DevForge. No on-chain payment was made.');
        setTxModal({
          isOpen: true,
          title: 'Delivery approved',
          actionDescription:
            'The delivery status was updated in DevForge. No funds were transferred and no blockchain transaction was submitted.',
          status: 'confirmed',
        });
        await reloadData();
      } else {
        setTxModal((prev) => ({
          ...prev,
          status: 'failed',
          errorMessage: 'Could not save the delivery approval.',
        }));
      }
    } catch (err: unknown) {
      setTxModal((prev) => ({
        ...prev,
        status: 'failed',
        errorMessage:
          err instanceof Error ? err.message : 'Transaction error during payout release.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectDelivery = async (deliveryId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/v1/deliveries/${deliveryId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback:
            approvalFeedback ||
            'Revisions requested by client. Please address comments and submit updated deliverable.',
        }),
      });
      if (res.ok) {
        setApprovalFeedback('');
        setActionMessage(
          'Revisions requested. Milestone returned to In Progress for specialist updates.',
        );
        await reloadData();
      } else {
        const json = await res.json().catch(() => null);
        setActionMessage(json?.error?.message || 'Failed to request revisions on deliverable.');
      }
    } catch {
      setActionMessage('Network error occurred while requesting revisions.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowDisputeModal(false);
    setTxModal({
      isOpen: true,
      title: 'Recording dispute request',
      actionDescription:
        'Submitting a dispute request to DevForge. This does not freeze escrow or initiate on-chain arbitration.',
      status: 'pending',
    });
    try {
      setSubmitting(true);
      const combinedReason = evidenceUrl
        ? `${disputeReason} [Evidence URL: ${evidenceUrl}]`
        : disputeReason;
      const res = await fetch(`/api/v1/contracts/${contractId}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: combinedReason || 'Milestone deliverables do not meet agreed specification.',
        }),
      });
      if (res.ok) {
        setDisputeReason('');
        setEvidenceUrl('');
        setActionMessage('Dispute request recorded in DevForge. No on-chain action occurred.');
        setTxModal({
          isOpen: true,
          title: 'Dispute request recorded',
          actionDescription:
            'The dispute request was recorded in DevForge only. No escrow was frozen and no arbitration was initiated.',
          status: 'confirmed',
        });
        await reloadData();
      } else {
        setTxModal((prev) => ({
          ...prev,
          status: 'failed',
          errorMessage: 'Failed to broadcast dispute registration.',
        }));
      }
    } catch (err: unknown) {
      setTxModal((prev) => ({
        ...prev,
        status: 'failed',
        errorMessage:
          err instanceof Error ? err.message : 'Encountered error while initiating dispute.',
      }));
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
            ✓ APPROVED & RELEASED
          </span>
        );
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
            ● DELIVERABLE SUBMITTED
          </span>
        );
      case 'FUNDED':
      case 'IN_PROGRESS':
        return (
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3B82F6',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            ⚡ ESCROW FUNDED ON SEPOLIA
          </span>
        );
      case 'PENDING':
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
            AWAITING ESCROW DEPOSIT
          </span>
        );
      case 'DISPUTED':
        return (
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ⚠ DISPUTE REQUEST RECORDED
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <main
        style={{
          padding: '5rem 2rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Connecting to on-chain escrow telemetry & DevForge smart contracts...
      </main>
    );
  }

  if (!contract) {
    return (
      <main style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          Contract Not Found
        </h2>
        <Link href="/dashboard/contracts" className="btn-pill-primary">
          ← Return to Contracts
        </Link>
      </main>
    );
  }

  const approvedCount = contract.milestones.filter((m) => m.status === 'APPROVED').length;
  const progressPercent = Math.round((approvedCount / contract.milestones.length) * 100);

  const isClient =
    user?.role === 'client' ||
    user?.role === 'admin' ||
    contract.participants.some((p) => p.userId === user?.id && p.role === 'CLIENT') ||
    (user?.displayName &&
      contract.client.organizationName.toLowerCase().includes(user.displayName.toLowerCase()));

  const isFreelancer =
    user?.role === 'freelancer' ||
    contract.participants.some((p) => p.userId === user?.id && p.role === 'FREELANCER') ||
    (user?.displayName &&
      contract.freelancer.displayName.toLowerCase().includes(user.displayName.toLowerCase())) ||
    !isClient;

  return (
    <main style={{ padding: '3.5rem 2rem', maxWidth: '78rem', margin: '0 auto' }}>
      {/* Breadcrumb Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
        }}
      >
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
            Request dispute review
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            background: 'rgba(230, 0, 122, 0.15)',
            border: '1px solid rgba(230, 0, 122, 0.4)',
            borderRadius: '10px',
            padding: '0.75rem 1.25rem',
            color: '#E6007A',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* Contract Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-hairline)',
          padding: '2.5rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1.5rem',
            marginBottom: '1.75rem',
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
                  color:
                    contract.status === 'COMPLETED'
                      ? '#10B981'
                      : contract.status === 'DISPUTED'
                        ? '#EF4444'
                        : '#E6007A',
                  border: `1px solid ${contract.status === 'COMPLETED' ? '#10B981' : contract.status === 'DISPUTED' ? '#EF4444' : '#E6007A'}`,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                {contract.status}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#3B82F6',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                }}
              >
                Prototype · no verified escrow
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              {contract.title}
            </h1>
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span>
                Client:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {contract.client.organizationName}
                </strong>
              </span>
              <span>•</span>
              <span>
                Freelancer:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {contract.freelancer.displayName}
                </strong>
              </span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                DevForgeEscrow.sol: <strong>0x633C...4426</strong>
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '0.25rem',
              }}
            >
              ESCROW TOTAL VALUE
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--accent-pink)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ${(contract.totalAmount / 100).toLocaleString()}{' '}
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                {contract.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
            }}
          >
            <span>
              Milestone Progress ({approvedCount} of {contract.milestones.length} Released)
            </span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'var(--accent-pink)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Workbench & Right Project Room */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Milestones, Escrow & Reviews */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Milestones & Escrow Vaults
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              marginBottom: '2.5rem',
            }}
          >
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
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
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
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                          }}
                        >
                          PHASE 0{milestone.sequence}
                        </span>
                        {getMilestoneStatusPill(milestone.status)}
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                        {milestone.title}
                      </h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        ${(milestone.amount / 100).toLocaleString()} {contract.currency}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        ≈ {(milestone.amount / 1000000).toFixed(2)} ETH
                      </div>
                    </div>
                  </div>

                  {milestone.description && (
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        margin: '0 0 1rem 0',
                      }}
                    >
                      {milestone.description}
                    </p>
                  )}

                  {/* Prototype Escrow Status Card */}
                  <div
                    style={{
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
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        Escrow record:{' '}
                      </span>
                      {escrow ? (
                        <span
                          style={{ color: escrow.status === 'RELEASED' ? '#10B981' : '#3B82F6' }}
                        >
                          ● {escrow.status} ({escrow.amount} {escrow.tokenSymbol}) · not verified
                          on-chain
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>No verified funding</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255,255,255,0.4)',
                          borderLeft: '1px solid rgba(255,255,255,0.1)',
                          paddingLeft: '0.5rem',
                        }}
                      >
                        On-chain funding and automatic release/refund are unavailable
                      </span>
                    </div>
                  </div>

                  {/* Action: Deposit Escrow */}
                  {milestone.status === 'PENDING' && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        onClick={() => handleDepositEscrow(milestone)}
                        disabled={submitting}
                        className="btn-pill-primary"
                        style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                      >
                        Funding unavailable
                      </button>
                    </div>
                  )}

                  {/* Deliveries */}
                  {milestone.deliveries && milestone.deliveries.length > 0 && (
                    <div
                      style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border-hairline)',
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
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background:
                                  delivery.status === 'ACCEPTED'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : delivery.status === 'REJECTED'
                                      ? 'rgba(239, 68, 68, 0.15)'
                                      : 'rgba(230, 0, 122, 0.15)',
                                color:
                                  delivery.status === 'ACCEPTED'
                                    ? '#10B981'
                                    : delivery.status === 'REJECTED'
                                      ? '#EF4444'
                                      : '#E6007A',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 600,
                              }}
                            >
                              {delivery.status === 'REJECTED'
                                ? 'REVISIONS REQUESTED'
                                : delivery.status}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {new Date(delivery.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-primary)',
                              margin: '0 0 0.5rem 0',
                              lineHeight: 1.4,
                            }}
                          >
                            {delivery.description}
                          </p>

                          {/* Client Feedback / Revision Notes */}
                          {delivery.feedback && (
                            <div
                              style={{
                                marginTop: '0.5rem',
                                marginBottom: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                background:
                                  delivery.status === 'REJECTED'
                                    ? 'rgba(239, 68, 68, 0.08)'
                                    : 'rgba(16, 185, 129, 0.08)',
                                border: `1px solid ${
                                  delivery.status === 'REJECTED'
                                    ? 'rgba(239, 68, 68, 0.25)'
                                    : 'rgba(16, 185, 129, 0.25)'
                                }`,
                                fontSize: '0.8rem',
                                color: delivery.status === 'REJECTED' ? '#EF4444' : '#10B981',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              <strong>
                                {delivery.status === 'REJECTED'
                                  ? '⚠️ Client Revision Notes:'
                                  : '✓ Client Approval Notes:'}
                              </strong>{' '}
                              {delivery.feedback}
                            </div>
                          )}

                          {/* Client Approval / Escrow Release */}
                          {delivery.status === 'SUBMITTED' &&
                            (isClient ? (
                              <div
                                style={{
                                  marginTop: '1rem',
                                  display: 'flex',
                                  gap: '0.75rem',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <input
                                  type="text"
                                  placeholder="Review notes for release..."
                                  value={approvalFeedback}
                                  onChange={(e) => setApprovalFeedback(e.target.value)}
                                  style={{
                                    flex: 1,
                                    minWidth: '220px',
                                    padding: '0.5rem 0.75rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-hairline)',
                                    borderRadius: '6px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                  }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => handleApproveDelivery(delivery.id)}
                                    disabled={submitting}
                                    className="btn-pill-primary"
                                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                  >
                                    {submitting ? 'Saving...' : '✓ Approve & Release'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectDelivery(delivery.id)}
                                    disabled={submitting}
                                    type="button"
                                    style={{
                                      fontSize: '0.8rem',
                                      padding: '0.5rem 1rem',
                                      borderRadius: '9999px',
                                      background: 'rgba(239, 68, 68, 0.12)',
                                      border: '1px solid rgba(239, 68, 68, 0.35)',
                                      color: '#EF4444',
                                      cursor: submitting ? 'not-allowed' : 'pointer',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {submitting ? 'Saving...' : '✗ Request Revisions'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  marginTop: '0.75rem',
                                  padding: '0.45rem 0.75rem',
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  fontSize: '0.8rem',
                                  color: '#10B981',
                                  fontFamily: 'var(--font-mono)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                }}
                              >
                                <span>●</span>
                                <span>
                                  Deliverable submitted. Awaiting client review and milestone
                                  approval.
                                </span>
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Milestone Delivery Submission Action (Freelancers Only) */}
                  {(milestone.status === 'FUNDED' || milestone.status === 'IN_PROGRESS') && (
                    <div
                      style={{
                        marginTop: '1.25rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border-hairline)',
                      }}
                    >
                      {isFreelancer ? (
                        activeDeliveryMilestoneId === milestone.id ? (
                          <form
                            onSubmit={(e) => handleSubmitDelivery(e, milestone.id)}
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                          >
                            <div
                              style={{
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--text-secondary)',
                              }}
                            >
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
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.75rem',
                              }}
                            >
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
                            {milestone.status === 'IN_PROGRESS'
                              ? '↻ Submit Revised Deliverable'
                              : '+ Submit Milestone Deliverable'}
                          </button>
                        )
                      ) : /* Client View: Show status if no deliveries submitted yet */
                      milestone.deliveries.length === 0 ? (
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <span>⏳</span>
                          <span>
                            Awaiting specialist ({contract.freelancer.displayName}) to submit
                            deliverables for this milestone.
                          </span>
                        </div>
                      ) : null}
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
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.authorName}
                      </span>
                      <span
                        style={{
                          color: '#F59E0B',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {'★'.repeat(r.rating)} ({r.rating}/5)
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        margin: '0 0 0.5rem 0',
                        lineHeight: 1.5,
                      }}
                    >
                      &ldquo;{r.feedback}&rdquo;
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {r.qualityRating && <span>Quality: {r.qualityRating}/5</span>}
                      {r.communicationRating && (
                        <span>Communication: {r.communicationRating}/5</span>
                      )}
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
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '16px',
              maxWidth: '34rem',
              width: '100%',
              padding: '2rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#F59E0B',
                marginBottom: '0.5rem',
              }}
            >
              Submit Verified Review
            </h2>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
              }}
            >
              Double-blind review. Revealed upon mutual submission or after the 14-day completion
              period.
            </p>

            <form
              onSubmit={handleSubmitReview}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.35rem',
                  }}
                >
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
                        background:
                          reviewRating >= star ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
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
                  <label
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Code / Work Quality
                  </label>
                  <select
                    value={qualityRating}
                    onChange={(e) => setQualityRating(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                    }}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} Stars
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Communication
                  </label>
                  <select
                    value={commRating}
                    onChange={(e) => setCommRating(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                    }}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} Stars
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.35rem',
                  }}
                >
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

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '0.5rem',
                }}
              >
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

      {/* Enhanced Dispute Mediation Modal */}
      {showDisputeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#0D0D12',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '16px',
              maxWidth: '40rem',
              width: '100%',
              padding: '2.25rem',
              boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 40px rgba(239, 68, 68, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444',
                  fontSize: '1.1rem',
                }}
              >
                ⚖
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#EF4444', margin: 0 }}>
                Dispute request (prototype)
              </h2>
            </div>

            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}
            >
              Records a dispute request in DevForge only. It does not freeze funds or start on-chain
              arbitration.
            </p>

            {/* Arbitration Timeline Rail */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '0.65rem',
                  fontWeight: 700,
                }}
              >
                DISPUTE HANDLING STATUS
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    padding: '0.6rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    borderLeft: '3px solid #3B82F6',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#60A5FA', fontWeight: 700 }}>
                    Not automated
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      marginTop: '0.2rem',
                    }}
                  >
                    In-app communication
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    No automatic negotiation workflow
                  </div>
                </div>
                <div
                  style={{
                    padding: '0.6rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    borderLeft: '3px solid #E6007A',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#F472B6', fontWeight: 700 }}>
                    Not available
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      marginTop: '0.2rem',
                    }}
                  >
                    Arbitration
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    No arbiters are configured
                  </div>
                </div>
                <div
                  style={{
                    padding: '0.6rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    borderLeft: '3px solid #10B981',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 700 }}>
                    Not available
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      marginTop: '0.2rem',
                    }}
                  >
                    Automatic release/refund
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    No automatic fund movement
                  </div>
                </div>
              </div>
            </div>

            {/* Arbitration availability */}
            <div
              style={{
                background: 'rgba(230, 0, 122, 0.05)',
                border: '1px solid rgba(230, 0, 122, 0.2)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: '#E6007A', fontWeight: 700 }}>No arbiters configured: </span>
              dispute requests are recorded in the application only and do not result in arbitration
              or escrow changes.
            </div>

            <form
              onSubmit={handleOpenDispute}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.35rem',
                  }}
                >
                  Reason for Dispute Mediation (min. 10 characters) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe specifically which milestones or deliverables fail the agreed acceptance criteria..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.35rem',
                  }}
                >
                  Evidence / Artifact URL (GitHub PR, Commit hash, IPFS CID, or test report)
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/org/repo/pull/42 or ipfs://..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
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
                  gap: '1rem',
                  marginTop: '0.5rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="btn-pill-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || disputeReason.trim().length < 10}
                  className="btn-pill-primary"
                  style={{ background: '#EF4444', borderColor: '#EF4444' }}
                >
                  {submitting ? 'Recording request...' : 'Record dispute request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable prototype action modal */}
      <TransactionModal
        isOpen={txModal.isOpen}
        title={txModal.title}
        actionDescription={txModal.actionDescription}
        status={txModal.status}
        errorMessage={txModal.errorMessage}
        onClose={() => setTxModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}
