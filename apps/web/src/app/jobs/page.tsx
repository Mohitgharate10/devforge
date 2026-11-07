import Link from 'next/link';
import { JobMarketplaceGrid } from '@/components/JobMarketplaceGrid';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Open Roles & Bounties | DevForge',
  description:
    'Browse Web3 projects, bounties, and technical roles. DevForge is a testnet marketplace prototype.',
};

export default function JobsPage() {
  return (
    <main style={{ padding: '4rem 2.5rem', maxWidth: '84rem', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '3rem',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div className="hero-meta-strip">
            <span>02 / MARKETPLACE</span>
            <span>•</span>
            <span>MARKETPLACE PROTOTYPE</span>
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
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              marginTop: '0.75rem',
              maxWidth: '44rem',
            }}
          >
            Browse technical Web3 projects and example bounties. Listings may be demonstration
            data; payments and escrow are testnet-only and must not be used for real funds.
          </p>
        </div>

        <Link href="/jobs/create" className="btn-pill-primary">
          + Post a job
        </Link>
      </div>

      <JobMarketplaceGrid />
    </main>
  );
}
