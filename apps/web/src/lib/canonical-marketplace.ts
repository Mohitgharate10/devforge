/**
 * Single Typed Source of Truth for DevForge Marketplace Entities
 *
 * Rule: No marketplace entity may be represented twice.
 * Listings, detail pages, counts, status, escrow metadata, and profile cards
 * must all originate from this module or the primary PostgreSQL database.
 */

export interface CanonicalBounty {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  client: {
    id: string;
    organizationName: string;
    slug: string;
    avatarLetter: string;
    brandColor: string;
  };
  type: 'BOUNTY' | 'AUDIT CONTEST' | 'GRANT';
  rewardUsdc: number;
  budgetMin: number;
  budgetMax: number;
  currency: 'USDC' | 'ETH';
  deadlineDaysLeft: number;
  baseSubmissionsCount: number;
  escrowStatus: 'PRE-FUNDED' | 'VERIFIED';
  prizeSplit: string;
  skills: string[];
  milestones: Array<{
    title: string;
    share: string;
    desc: string;
  }>;
}

export interface CanonicalSpecialist {
  id: string;
  canonicalHandle: string;
  aliases: string[];
  displayName: string;
  title: string;
  bio: string;
  hourlyRateUsd: number;
  availability: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE';
  walletAddress: string;
  chainId: number;
  rating: number;
  reviewsCount: number;
  completedJobsCount: number;
  escrowVolumeLockedUsd: number;
  skills: Array<{ name: string; proficiency: 'EXPERT' | 'INTERMEDIATE' | 'ADVANCED' }>;
  portfolioProjects: Array<{
    id: string;
    title: string;
    description: string;
    projectUrl: string;
    repositoryUrl?: string;
  }>;
}

export const CANONICAL_BOUNTIES: CanonicalBounty[] = [
  {
    id: 'job-substrate-pallet',
    slug: 'job-substrate-pallet',
    title: 'Substrate Parachain Governance Pallet Developer',
    description:
      'Design and implement open governance pallets with multi-asset conviction voting and time-locked treasury executions for the Polkadot Fellowship.',
    category: {
      id: 'cat-fullstack',
      name: 'Full Stack Web3',
      slug: 'fullstack-web3',
    },
    client: {
      id: 'client-polkadot',
      organizationName: 'Polkadot Fellowship',
      slug: 'polkadot-fellowship',
      avatarLetter: 'P',
      brandColor: '#E6007A',
    },
    type: 'BOUNTY',
    rewardUsdc: 15000,
    budgetMin: 10000,
    budgetMax: 16000,
    currency: 'USDC',
    deadlineDaysLeft: 6,
    baseSubmissionsCount: 8,
    escrowStatus: 'PRE-FUNDED',
    prizeSplit: '1st: $9,000 • 2nd: $4,500 • 3rd: $1,500',
    skills: ['Rust', 'Substrate', 'FRAME', 'Polkadot SDK'],
    milestones: [
      {
        title: 'Milestone 01: Pallet Trait Definitions & Storage Map',
        share: '35%',
        desc: 'Define conviction weight curves and asset registry traits for custom parachains.',
      },
      {
        title: 'Milestone 02: Conviction Voting & Time-lock Execution',
        share: '40%',
        desc: 'Implement tallying logic with linear and non-linear conviction locks.',
      },
      {
        title: 'Milestone 03: Benchmarking & Try-Runtime Tests',
        share: '25%',
        desc: 'Complete FRAME weight benchmarking and end-to-end integration test coverage.',
      },
    ],
  },
  {
    id: 'job-bridge-audit',
    slug: 'job-bridge-audit',
    title: 'EVM & Substrate Cross-Chain Bridge Security Audit',
    description:
      'Seeking a senior smart contract security researcher to perform a rigorous formal verification and manual audit on our EIP-712 token bridge contracts before mainnet release.\nScope covers reentrancy guards, replay attack mitigation, and multi-sig emergency pauses.',
    category: {
      id: 'cat-security',
      name: 'Smart Contract Auditing',
      slug: 'security-auditing',
    },
    client: {
      id: 'client-parity',
      organizationName: 'Parity Ecosystem Fund',
      slug: 'parity-ecosystem',
      avatarLetter: 'E',
      brandColor: '#9333EA',
    },
    type: 'AUDIT CONTEST',
    rewardUsdc: 18000,
    budgetMin: 12000,
    budgetMax: 18000,
    currency: 'USDC',
    deadlineDaysLeft: 4,
    baseSubmissionsCount: 14,
    escrowStatus: 'PRE-FUNDED',
    prizeSplit: '1st: $10,800 • 2nd: $5,400 • 3rd: $1,800',
    skills: ['Solidity', 'Foundry', 'Halmos', 'Security', 'Rust'],
    milestones: [
      {
        title: 'Milestone 01: Threat Modeling & Architecture Review',
        share: '30%',
        desc: 'Identify trust boundaries and state invariants across EVM and Substrate nodes.',
      },
      {
        title: 'Milestone 02: Formal Verification & Invariant Fuzzing',
        share: '40%',
        desc: 'Run Halmos and Foundry invariant fuzzing and deliver initial vulnerability finding list.',
      },
      {
        title: 'Milestone 03: Final Audited Report & Fix Sign-off',
        share: '30%',
        desc: 'Verify protocol patches and sign off with cryptographic audit artifact.',
      },
    ],
  },
  {
    id: 'job-zk-circuit',
    slug: 'job-zk-circuit',
    title: 'Groth16 Verifier Smart Contract Gas Optimization on Sepolia',
    description:
      'We need a cryptography systems specialist to optimize on-chain Groth16 / Plonk proof verification contracts on Sepolia.\nGoal is reducing Layer-2 calldata and pairing execution gas by at least 25% while maintaining soundness.',
    category: {
      id: 'cat-zk',
      name: 'Zero Knowledge & Cryptography',
      slug: 'zero-knowledge',
    },
    client: {
      id: 'client-axiom',
      organizationName: 'Axiom Research Labs',
      slug: 'axiom-research',
      avatarLetter: 'A',
      brandColor: '#059669',
    },
    type: 'BOUNTY',
    rewardUsdc: 20000,
    budgetMin: 15000,
    budgetMax: 25000,
    currency: 'USDC',
    deadlineDaysLeft: 9,
    baseSubmissionsCount: 5,
    escrowStatus: 'PRE-FUNDED',
    prizeSplit: '1st: $12,000 • 2nd: $6,000 • 3rd: $2,000',
    skills: ['Zero-Knowledge', 'Circom', 'Rust', 'Viem', 'Halo2'],
    milestones: [
      {
        title: 'Milestone 01: Circuit Profiling & Pairing Analysis',
        share: '35%',
        desc: 'Benchmark constraint count and pairing precompile overhead on Sepolia testnet.',
      },
      {
        title: 'Milestone 02: Verification Logic Refactor & Affine Optimization',
        share: '65%',
        desc: 'Deliver rewritten EVM verifier contract achieving >25% gas reduction.',
      },
    ],
  },
  {
    id: 'job-keeper-bot',
    slug: 'job-keeper-bot',
    title: 'High-Frequency Decentralized Liquidation Keeper Daemon in Rust',
    description:
      'Develop an ultra-low latency off-chain keeper bot monitoring mempool price oracle feeds and executing automated Flash-Loan liquidations through multi-call smart contracts on Arbitrum & Sepolia.',
    category: {
      id: 'cat-infra',
      name: 'Node & Subgraph Infrastructure',
      slug: 'infrastructure',
    },
    client: {
      id: 'client-arbitrum',
      organizationName: 'Arbitrum Foundation',
      slug: 'arbitrum-foundation',
      avatarLetter: 'K',
      brandColor: '#2563EB',
    },
    type: 'GRANT',
    rewardUsdc: 8500,
    budgetMin: 8500,
    budgetMax: 8500,
    currency: 'USDC',
    deadlineDaysLeft: 12,
    baseSubmissionsCount: 11,
    escrowStatus: 'VERIFIED',
    prizeSplit: 'Full Grant Payout: $8,500 USDC',
    skills: ['Rust', 'Mempool', 'Solidity', 'Arbitrum', 'Viem'],
    milestones: [
      {
        title: 'Milestone 01: Mempool Streamer & Oracle Decoder',
        share: '40%',
        desc: 'Low-latency websocket pipeline decoding Pyth and Chainlink price tick events.',
      },
      {
        title: 'Milestone 02: Flash Loan Multi-Call Settlement Contract',
        share: '60%',
        desc: 'Atomic arbitrage & liquidation executor contract with slippage circuit breaker.',
      },
    ],
  },
];

export const CANONICAL_SPECIALISTS: CanonicalSpecialist[] = [
  {
    id: 'spec-elena-rostova',
    canonicalHandle: 'elena-rostova',
    aliases: ['satoshi_core', 'elena_rostova'],
    displayName: 'Elena Rostova',
    title: 'EVM & Substrate Security Auditor',
    bio: 'Senior smart contract security researcher with 6+ years auditing high-volume DeFi protocols and cross-chain messaging bridges.\nSpecialized in reentrancy, oracle manipulation vectors, and formal verification using Foundry and Halmos.',
    hourlyRateUsd: 150,
    availability: 'AVAILABLE',
    walletAddress: '0x71C84164b3c915122e265646cD8266395A344e45',
    chainId: 11155111,
    rating: 4.98,
    reviewsCount: 42,
    completedJobsCount: 38,
    escrowVolumeLockedUsd: 840000,
    skills: [
      { name: 'Solidity', proficiency: 'EXPERT' },
      { name: 'Smart Contract Auditing', proficiency: 'EXPERT' },
      { name: 'Rust', proficiency: 'INTERMEDIATE' },
      { name: 'Foundry', proficiency: 'EXPERT' },
      { name: 'Halmos', proficiency: 'ADVANCED' },
    ],
    portfolioProjects: [
      {
        id: 'p1',
        title: 'Perpetuals DEX Liquidation Audit',
        description:
          'Audited core margin engine and liquidation keeper contracts protecting $45M in TVL. Identified 2 high-severity reentrancy vectors before mainnet deployment.',
        projectUrl: 'https://polkadot.com',
        repositoryUrl: 'https://github.com/polkadot-js/api',
      },
      {
        id: 'p2',
        title: 'Cross-Chain Token Bridge Escrow',
        description:
          'Implemented EIP-712 signature verification and multi-sig emergency pauses for EVM-to-Substrate asset transfers.',
        projectUrl: 'https://sepolia.etherscan.io',
        repositoryUrl: 'https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md',
      },
    ],
  },
  {
    id: 'spec-marcus-vance',
    canonicalHandle: 'marcus-vance',
    aliases: ['zk_builder', 'marcus_vance'],
    displayName: 'Marcus Vance',
    title: 'Zero Knowledge & DeFi Systems Engineer',
    bio: 'Core contributor to zero-knowledge circuits and privacy-preserving automated market makers.\nExpertise in Circom, Halo2, and developing high-throughput rollups.',
    hourlyRateUsd: 175,
    availability: 'PARTIALLY_AVAILABLE',
    walletAddress: '0x388C818CA8B9251b393131C08a73683246A73134',
    chainId: 1,
    rating: 5.0,
    reviewsCount: 28,
    completedJobsCount: 24,
    escrowVolumeLockedUsd: 620000,
    skills: [
      { name: 'Rust', proficiency: 'EXPERT' },
      { name: 'Zero-Knowledge', proficiency: 'EXPERT' },
      { name: 'DeFi Protocols', proficiency: 'EXPERT' },
      { name: 'Viem', proficiency: 'ADVANCED' },
    ],
    portfolioProjects: [
      {
        id: 'p3',
        title: 'ZK-SNARK State Verifier',
        description:
          'Optimized on-chain proof verification reducing gas consumption by 38% across Layer 2 settlements.',
        projectUrl: 'https://zksync.io',
        repositoryUrl: 'https://github.com/matter-labs/zksync-era',
      },
    ],
  },
  {
    id: 'spec-kenji-sato',
    canonicalHandle: 'kenji-sato',
    aliases: ['polka_dev', 'kenji_sato'],
    displayName: 'Kenji Sato',
    title: 'Full Stack Web3 Architect',
    bio: 'Full-stack dApp engineer specialized in Polkadot SDK, Substrate parachain RPC integrations, subgraphs, and React/Next.js interfaces.',
    hourlyRateUsd: 130,
    availability: 'AVAILABLE',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: 11155111,
    rating: 4.95,
    reviewsCount: 19,
    completedJobsCount: 16,
    escrowVolumeLockedUsd: 380000,
    skills: [
      { name: 'TypeScript', proficiency: 'EXPERT' },
      { name: 'Next.js', proficiency: 'EXPERT' },
      { name: 'Solidity', proficiency: 'INTERMEDIATE' },
      { name: 'Subgraphs', proficiency: 'ADVANCED' },
    ],
    portfolioProjects: [
      {
        id: 'p4',
        title: 'Polkadot OpenGov Voting Portal',
        description:
          'Built accessible web portal for conviction tallying and referendum delegation.',
        projectUrl: 'https://polkadot.network',
      },
    ],
  },
];

export const CANONICAL_JOB_UUIDS: Record<string, string> = {
  'job-substrate-pallet': '11111111-1111-4111-a111-111111111111',
  'job-bridge-audit': '22222222-2222-4222-a222-222222222222',
  'job-zk-circuit': '33333333-3333-4333-a333-333333333333',
  'job-keeper-bot': '44444444-4444-4444-a444-444444444444',
};

export function getCanonicalJobUuid(bountyId: string): string | undefined {
  const normalized = bountyId.trim().toLowerCase();
  return CANONICAL_JOB_UUIDS[normalized];
}

export function findCanonicalBounty(idOrSlug: string): CanonicalBounty | undefined {
  const normalized = idOrSlug.trim().toLowerCase();
  return CANONICAL_BOUNTIES.find(
    (b) =>
      b.id.toLowerCase() === normalized ||
      b.slug.toLowerCase() === normalized ||
      CANONICAL_JOB_UUIDS[b.id] === normalized,
  );
}

export function findCanonicalBountyByUuid(uuid: string): CanonicalBounty | undefined {
  const entry = Object.entries(CANONICAL_JOB_UUIDS).find(
    ([, u]) => u.toLowerCase() === uuid.toLowerCase(),
  );
  if (!entry) return undefined;
  return findCanonicalBounty(entry[0]);
}

export function findCanonicalSpecialist(handle: string): CanonicalSpecialist | undefined {
  const normalized = handle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
  return CANONICAL_SPECIALISTS.find(
    (s) =>
      s.canonicalHandle.toLowerCase() === normalized ||
      s.aliases.some((a) => a.toLowerCase() === normalized),
  );
}
