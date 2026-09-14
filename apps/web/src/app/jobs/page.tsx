import Link from 'next/link';
import { JobMarketplaceGrid } from '@/components/JobMarketplaceGrid';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Open Roles & Bounties | DevForge',
  description: 'Explore technical contracts, auditing scopes, and protocol development bounties with on-chain milestone escrow.',
};

export default function JobsPage() {
  return (
    <main style={{ padding: '4rem 2.5rem', maxWidth: '84rem', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div className="hero-meta-strip">
            <span>02 / MARKETPLACE</span>
            <span>•</span>
            <span>VERIFIED BOUNTIES</span>
            <span>•</span>
            <span>SEPOLIA ESCROW</span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
            }}
          >
            Open Roles & Bounties
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.75rem', maxWidth: '44rem' }}>
            Work directly with verified Web3 protocols, research funds, and decentralized teams.
            Every deliverable is backed by 100% pre-funded on-chain escrow.
          </p>
        </div>

        <Link href="/jobs/create" className="btn-pill-primary">
          + Post a Bounty / Job
        </Link>
      </div>

      <JobMarketplaceGrid />
    </main>
  );
}
