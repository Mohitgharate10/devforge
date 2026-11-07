export interface DemoFreelancer {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  title: string;
  avatarUrl: string | null;
}

export interface DemoClient {
  id: string;
  userId: string;
  organizationName: string;
  slug: string | null;
}

export interface DemoProposal {
  id: string;
  jobId: string;
  jobTitle: string;
  freelancerProfileId: string;
  freelancer: DemoFreelancer;
  client: DemoClient;
  coverLetter: string;
  bidAmount: number;
  currency: string;
  status: 'SUBMITTED' | 'WITHDRAWN' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export interface DemoDelivery {
  id: string;
  milestoneId: string;
  freelancerProfileId: string;
  description: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface DemoMilestone {
  id: string;
  contractId: string;
  sequence: number;
  title: string;
  description: string | null;
  amount: number;
  dueDate: string | null;
  status: 'PENDING' | 'FUNDED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'DISPUTED' | 'REFUNDED';
  deliveries: DemoDelivery[];
  createdAt: string;
  updatedAt: string;
}

export interface DemoContract {
  id: string;
  jobId: string;
  proposalId: string;
  title: string;
  totalAmount: number;
  currency: string;
  status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'DISPUTED';
  client: DemoClient;
  freelancer: DemoFreelancer;
  milestones: DemoMilestone[];
  participants: Array<{
    userId: string;
    role: 'CLIENT' | 'FREELANCER' | 'ARBITRATOR' | 'OBSERVER';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface DemoEscrow {
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

export interface DemoReview {
  id: string;
  contractId: string;
  authorId: string;
  authorName: string;
  targetId: string;
  rating: number;
  feedback: string;
  qualityRating: number | null;
  communicationRating: number | null;
  deadlineRating: number | null;
  isRevealed: boolean;
  createdAt: string;
}

export interface DemoReport {
  id: string;
  reporterId: string;
  targetType: 'USER' | 'JOB' | 'PROPOSAL' | 'MESSAGE' | 'CONTRACT';
  targetId: string;
  category: string;
  reason: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

export const DEMO_FREELANCERS: Record<string, DemoFreelancer> = {
  'freelancer-elena': {
    id: 'freelancer-elena',
    userId: 'user-elena',
    displayName: 'Elena Rostova',
    handle: 'elena-rostova',
    title: 'Senior Smart Contract Security Researcher & Auditor',
    avatarUrl: null,
  },
  'freelancer-marcus': {
    id: 'freelancer-marcus',
    userId: 'user-marcus',
    displayName: 'Marcus Vance',
    handle: 'marcus-vance',
    title: 'Zero-Knowledge Cryptographer & Rollup Architect',
    avatarUrl: null,
  },
};

export const DEMO_CLIENTS: Record<string, DemoClient> = {
  'client-polka': {
    id: 'client-polka',
    userId: 'user-parity',
    organizationName: 'Parity Ecosystem Fund',
    slug: 'parity-ecosystem',
  },
  'client-zk-labs': {
    id: 'client-zk-labs',
    userId: 'user-axiom',
    organizationName: 'Axiom Research Labs',
    slug: 'axiom-research',
  },
};

const initialProposals: DemoProposal[] = [
  {
    id: 'prop-bridge-1',
    jobId: 'job-bridge-audit',
    jobTitle: 'EVM & Substrate Cross-Chain Bridge Security Audit',
    freelancerProfileId: 'freelancer-elena',
    freelancer: DEMO_FREELANCERS['freelancer-elena']!,
    client: DEMO_CLIENTS['client-polka']!,
    coverLetter:
      'I have conducted 14 cross-chain bridge audits and discovered 3 critical reentrancy and replay vulnerabilities in production protocols. I will deliver a comprehensive invariant test suite and formal verification report within 3 weeks.',
    bidAmount: 1500000,
    currency: 'USDC',
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: 'prop-zk-1',
    jobId: 'job-zk-circuit',
    jobTitle: 'ZK-Rollup Proof Verifier Circuit Optimization',
    freelancerProfileId: 'freelancer-marcus',
    freelancer: DEMO_FREELANCERS['freelancer-marcus']!,
    client: DEMO_CLIENTS['client-zk-labs']!,
    coverLetter:
      'Extensive background in Groth16 and Plonk proving systems. Reduced gas overhead by 34% on recent rollup verification contracts on Sepolia.',
    bidAmount: 2000000,
    currency: 'USDC',
    status: 'SUBMITTED',
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
];

const initialContracts: DemoContract[] = [
  {
    id: 'contract-bridge-audit',
    jobId: 'job-bridge-audit',
    proposalId: 'prop-bridge-1',
    title: 'EVM & Substrate Cross-Chain Bridge Security Audit',
    totalAmount: 1500000,
    currency: 'USDC',
    status: 'ACTIVE',
    client: DEMO_CLIENTS['client-polka']!,
    freelancer: DEMO_FREELANCERS['freelancer-elena']!,
    participants: [
      { userId: 'user-parity', role: 'CLIENT' },
      { userId: 'user-elena', role: 'FREELANCER' },
    ],
    milestones: [
      {
        id: 'ms-bridge-1',
        contractId: 'contract-bridge-audit',
        sequence: 1,
        title: 'Phase 1: Architecture Review & Threat Modeling',
        description:
          'Comprehensive analysis of EIP-712 token bridge endpoints, replay attacks, and state invariants.',
        amount: 500000,
        dueDate: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
        status: 'APPROVED',
        deliveries: [
          {
            id: 'del-bridge-1',
            milestoneId: 'ms-bridge-1',
            freelancerProfileId: 'freelancer-elena',
            description:
              'Delivered initial threat modeling matrix and identified 2 medium-severity replay edge cases.',
            status: 'ACCEPTED',
            feedback: 'Exceptional work. Findings verified by protocol engineering team.',
            submittedAt: new Date(Date.now() - 3600 * 1000 * 24 * 8).toISOString(),
            reviewedAt: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 14).toISOString(),
        updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
      },
      {
        id: 'ms-bridge-2',
        contractId: 'contract-bridge-audit',
        sequence: 2,
        title: 'Phase 2: Formal Verification & Invariant Proofs',
        description: 'Foundry invariant fuzzing suite and Certora / Halmos specification proofs.',
        amount: 500000,
        dueDate: new Date(Date.now() + 3600 * 1000 * 24 * 5).toISOString(),
        status: 'SUBMITTED',
        deliveries: [
          {
            id: 'del-bridge-2',
            milestoneId: 'ms-bridge-2',
            freelancerProfileId: 'freelancer-elena',
            description:
              'Submitted PR #48 with 12 state invariants and 500k Foundry fuzz iterations with 0 property breaks.',
            status: 'SUBMITTED',
            feedback: null,
            submittedAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
            reviewedAt: null,
          },
        ],
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 14).toISOString(),
        updatedAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
      },
      {
        id: 'ms-bridge-3',
        contractId: 'contract-bridge-audit',
        sequence: 3,
        title: 'Phase 3: Final Audit Report & Remediation Verification',
        description:
          'Executive summary report, re-test of remediated contracts, and public cryptographic disclosure.',
        amount: 500000,
        dueDate: new Date(Date.now() + 3600 * 1000 * 24 * 14).toISOString(),
        status: 'FUNDED',
        deliveries: [],
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 14).toISOString(),
        updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 14).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
  },
];

export interface DemoMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  type: 'TEXT' | 'SYSTEM' | 'FILE' | 'DELIVERY_SUBMITTED' | 'ESCROW_RELEASED';
  createdAt: string;
}

export interface DemoConversation {
  id: string;
  contractId: string | null;
  title: string | null;
  members: Array<{ userId: string; displayName: string; avatarUrl: string | null }>;
  messages: DemoMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface DemoNotification {
  id: string;
  userId: string;
  type:
    | 'PROPOSAL_RECEIVED'
    | 'PROPOSAL_ACCEPTED'
    | 'DELIVERY_SUBMITTED'
    | 'MILESTONE_APPROVED'
    | 'MESSAGE_RECEIVED'
    | 'DISPUTE_OPENED';
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

const initialConversations: DemoConversation[] = [
  {
    id: 'conv-bridge-audit',
    contractId: 'contract-bridge-audit',
    title: 'EVM & Substrate Cross-Chain Bridge Security Audit - Project Room',
    members: [
      { userId: 'user-parity', displayName: 'Parity Ecosystem Fund', avatarUrl: null },
      { userId: 'user-elena', displayName: 'Elena Rostova', avatarUrl: null },
    ],
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-bridge-audit',
        senderId: 'user-parity',
        senderName: 'Parity Ecosystem Fund',
        senderAvatar: null,
        content:
          'Welcome Elena! Phase 1 is officially funded. Looking forward to your architecture and threat modeling report.',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString(),
      },
      {
        id: 'msg-2',
        conversationId: 'conv-bridge-audit',
        senderId: 'user-elena',
        senderName: 'Elena Rostova',
        senderAvatar: null,
        content:
          'Thank you team. I have initiated the invariant test fuzzing and identified two replay attack vectors in the EIP-712 token handler.',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 8).toISOString(),
      },
      {
        id: 'msg-3',
        conversationId: 'conv-bridge-audit',
        senderId: 'user-parity',
        senderName: 'Parity Ecosystem Fund',
        senderAvatar: null,
        content: 'Phase 1 deliverable verified and accepted. $5,000 USDC escrow payout released!',
        type: 'ESCROW_RELEASED',
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
      },
      {
        id: 'msg-4',
        conversationId: 'conv-bridge-audit',
        senderId: 'user-elena',
        senderName: 'Elena Rostova',
        senderAvatar: null,
        content:
          'PR #48 is submitted with 500k Foundry fuzz iterations. Ready for Phase 2 verification review.',
        type: 'DELIVERY_SUBMITTED',
        createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
];

const initialNotifications: DemoNotification[] = [
  {
    id: 'notif-1',
    userId: 'user-elena',
    type: 'MILESTONE_APPROVED',
    title: 'Milestone 1 Approved',
    message: 'Parity Ecosystem Fund released $5,000 USDC for Phase 1 threat modeling.',
    linkUrl: '/dashboard/contracts/contract-bridge-audit',
    isRead: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'user-parity',
    type: 'DELIVERY_SUBMITTED',
    title: 'Work Deliverable Submitted',
    message: 'Elena Rostova submitted verification proofs for Phase 2.',
    linkUrl: '/dashboard/contracts/contract-bridge-audit',
    isRead: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
  {
    id: 'notif-3',
    userId: 'user-parity',
    type: 'PROPOSAL_RECEIVED',
    title: 'New Proposal Received',
    message: 'Marcus Vance submitted a $20,000 USDC bid on ZK-Rollup Proof Verifier.',
    linkUrl: '/dashboard/proposals',
    isRead: true,
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
];

const initialEscrows: DemoEscrow[] = [
  {
    id: 'escrow-ms-1',
    contractId: 'contract-bridge-audit',
    milestoneId: 'ms-bridge-1',
    vaultKey: '0xa41c30e7195c65a44ef69d7b4260fa143cbfa631fa8f81395b06606a24be51a1',
    chainId: 11155111,
    status: 'RELEASED',
    amount: '0.5',
    tokenSymbol: 'ETH',
    clientAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    freelancerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    depositTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    releaseTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 14).toISOString(),
  },
  {
    id: 'escrow-ms-2',
    contractId: 'contract-bridge-audit',
    milestoneId: 'ms-bridge-2',
    vaultKey: '0xb72d41f8206d76b55fa70e8c5371fb254dcfa742fb9f92406c17717b35cf62b2',
    chainId: 11155111,
    status: 'DEPOSITED',
    amount: '0.6',
    tokenSymbol: 'ETH',
    clientAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    freelancerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    depositTxHash: '0x7777567890abcdef1234567890abcdef1234567890abcdef1234567890777777',
    releaseTxHash: null,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 6).toISOString(),
  },
];

const initialReviews: DemoReview[] = [
  {
    id: 'rev-1',
    contractId: 'contract-bridge-audit',
    authorId: 'user-parity',
    authorName: 'Parity Ecosystem Fund',
    targetId: 'user-elena',
    rating: 5,
    feedback:
      'Elena is one of the top security researchers in the Web3 ecosystem. Found critical flaws before mainnet.',
    qualityRating: 5,
    communicationRating: 5,
    deadlineRating: 5,
    isRevealed: true,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
  },
];

const initialReports: DemoReport[] = [
  {
    id: 'rep-1',
    reporterId: 'user-parity',
    targetType: 'JOB',
    targetId: 'job-bridge-audit',
    category: 'SPAM_CHECK',
    reason: 'Routine compliance and verification check for grant-funded smart contract milestone.',
    status: 'PENDING',
    severity: 'LOW',
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
];

// Global persistent in-memory store for local demo mode
const globalStore = globalThis as unknown as {
  __devforge_proposals?: DemoProposal[];
  __devforge_contracts?: DemoContract[];
  __devforge_conversations?: DemoConversation[];
  __devforge_notifications?: DemoNotification[];
  __devforge_escrows?: DemoEscrow[];
  __devforge_reviews?: DemoReview[];
  __devforge_reports?: DemoReport[];
};

if (!globalStore.__devforge_proposals) {
  globalStore.__devforge_proposals = [...initialProposals];
}

if (!globalStore.__devforge_contracts) {
  globalStore.__devforge_contracts = [...initialContracts];
}

if (!globalStore.__devforge_conversations) {
  globalStore.__devforge_conversations = [...initialConversations];
}

if (!globalStore.__devforge_notifications) {
  globalStore.__devforge_notifications = [...initialNotifications];
}

if (!globalStore.__devforge_escrows) {
  globalStore.__devforge_escrows = [...initialEscrows];
}

if (!globalStore.__devforge_reviews) {
  globalStore.__devforge_reviews = [...initialReviews];
}

if (!globalStore.__devforge_reports) {
  globalStore.__devforge_reports = [...initialReports];
}

export const demoStore = {
  getProposals: () => globalStore.__devforge_proposals!,
  getContracts: () => globalStore.__devforge_contracts!,
  getConversations: () => globalStore.__devforge_conversations!,
  getNotifications: () => globalStore.__devforge_notifications!,

  getConversationByContractId: (contractId: string) => {
    let conv = globalStore.__devforge_conversations!.find((c) => c.contractId === contractId);
    if (!conv) {
      conv = {
        id: `conv-${contractId}`,
        contractId,
        title: 'Project Escrow Room',
        members: [
          { userId: 'user-client', displayName: 'Client', avatarUrl: null },
          { userId: 'user-freelancer', displayName: 'Freelancer', avatarUrl: null },
        ],
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      globalStore.__devforge_conversations!.push(conv);
    }
    return conv;
  },

  addMessage: (conversationId: string, message: DemoMessage) => {
    const conv = globalStore.__devforge_conversations!.find((c) => c.id === conversationId);
    if (conv) {
      conv.messages.push(message);
      conv.updatedAt = message.createdAt;
      return conv;
    }
    return null;
  },

  addNotification: (notification: DemoNotification) => {
    globalStore.__devforge_notifications!.unshift(notification);
  },

  markNotificationRead: (notificationId: string) => {
    const n = globalStore.__devforge_notifications!.find((notif) => notif.id === notificationId);
    if (n) {
      n.isRead = true;
    }
    return n;
  },

  markAllNotificationsRead: () => {
    for (const n of globalStore.__devforge_notifications!) {
      n.isRead = true;
    }
  },

  addProposal: (proposal: DemoProposal) => {
    globalStore.__devforge_proposals!.unshift(proposal);
  },

  updateProposalStatus: (proposalId: string, status: DemoProposal['status']) => {
    const prop = globalStore.__devforge_proposals!.find((p) => p.id === proposalId);
    if (prop) {
      prop.status = status;
      prop.updatedAt = new Date().toISOString();
    }
    return prop;
  },

  addContract: (contract: DemoContract) => {
    globalStore.__devforge_contracts!.unshift(contract);
  },

  getContractById: (contractId: string) => {
    return globalStore.__devforge_contracts!.find((c) => c.id === contractId) ?? null;
  },

  addDelivery: (milestoneId: string, delivery: DemoDelivery) => {
    for (const contract of globalStore.__devforge_contracts!) {
      const ms = contract.milestones.find((m) => m.id === milestoneId);
      if (ms) {
        ms.deliveries.unshift(delivery);
        ms.status = 'SUBMITTED';
        ms.updatedAt = new Date().toISOString();
        contract.updatedAt = new Date().toISOString();
        return { contract, milestone: ms };
      }
    }
    return null;
  },

  approveDelivery: (deliveryId: string, feedback?: string) => {
    for (const contract of globalStore.__devforge_contracts!) {
      for (const ms of contract.milestones) {
        const delivery = ms.deliveries.find((d) => d.id === deliveryId);
        if (delivery) {
          delivery.status = 'ACCEPTED';
          delivery.feedback = feedback ?? 'Deliverable accepted.';
          delivery.reviewedAt = new Date().toISOString();
          ms.status = 'APPROVED';
          ms.updatedAt = new Date().toISOString();

          // Check if all milestones are approved
          const allApproved = contract.milestones.every((m) => m.status === 'APPROVED');
          if (allApproved) {
            contract.status = 'COMPLETED';
          }
          contract.updatedAt = new Date().toISOString();
          return { contract, milestone: ms, delivery };
        }
      }
    }
    return null;
  },

  openDispute: (contractId: string, _reason: string) => {
    const contract = globalStore.__devforge_contracts!.find((c) => c.id === contractId);
    if (contract) {
      contract.status = 'DISPUTED';
      contract.updatedAt = new Date().toISOString();
      return contract;
    }
    return null;
  },

  getEscrowsByContractId: (contractId: string) => {
    return (globalStore.__devforge_escrows || []).filter((e) => e.contractId === contractId);
  },

  addOrUpdateEscrow: (escrow: DemoEscrow) => {
    if (!globalStore.__devforge_escrows) globalStore.__devforge_escrows = [];
    const idx = globalStore.__devforge_escrows.findIndex((e) => e.id === escrow.id);
    if (idx >= 0) {
      globalStore.__devforge_escrows[idx] = escrow;
    } else {
      globalStore.__devforge_escrows.unshift(escrow);
    }
    return escrow;
  },

  getReviews: (contractId?: string) => {
    const reviews = globalStore.__devforge_reviews || [];
    if (contractId) {
      return reviews.filter((r) => r.contractId === contractId);
    }
    return reviews;
  },

  addReview: (review: DemoReview) => {
    if (!globalStore.__devforge_reviews) globalStore.__devforge_reviews = [];
    globalStore.__devforge_reviews.unshift(review);
    return review;
  },

  getReports: () => {
    return globalStore.__devforge_reports || [];
  },

  addReport: (report: DemoReport) => {
    if (!globalStore.__devforge_reports) globalStore.__devforge_reports = [];
    globalStore.__devforge_reports.unshift(report);
    return report;
  },

  updateReportStatus: (reportId: string, status: DemoReport['status']) => {
    const r = (globalStore.__devforge_reports || []).find((rep) => rep.id === reportId);
    if (r) {
      r.status = status;
      return r;
    }
    return null;
  },

  getAnalytics: () => {
    const contracts = globalStore.__devforge_contracts || [];
    const escrows = globalStore.__devforge_escrows || [];
    const reviews = globalStore.__devforge_reviews || [];
    const reports = globalStore.__devforge_reports || [];

    const activeContractsCount = contracts.filter((c) => c.status === 'ACTIVE').length;
    const totalVolume = escrows.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
    const disputesCount =
      contracts.filter((c) => c.status === 'DISPUTED').length +
      reports.filter((r) => r.status === 'PENDING').length;
    const avgRating =
      reviews.length > 0
        ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
        : 5.0;

    return {
      activeContractsCount,
      totalEscrowVolumeEth: Number(totalVolume.toFixed(2)),
      totalDisputesCount: disputesCount,
      resolvedDisputesCount: 1,
      platformFeeEth: Number((totalVolume * 0.025).toFixed(4)),
      averageRating: avgRating,
      totalUsersCount: 24,
    };
  },
};
