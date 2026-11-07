import { SuperteamBountiesHub } from '@/components/SuperteamBountiesHub';
import Link from 'next/link';

export const metadata = {
  title: 'Web3 Bounties & Ecosystem Grants | DevForge Earn',
  description:
    'Browse example developer bounties, security audit contests, and research grants in the DevForge testnet prototype.',
};

export default function BountiesPage() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>
      {/* Breadcrumb Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '2rem',
        }}
      >
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          Home
        </Link>
        <span>/</span>
        <span style={{ color: '#E6007A', fontWeight: 600 }}>Bounties & Grants</span>
      </div>

      <SuperteamBountiesHub isHomepage={false} />
    </main>
  );
}
