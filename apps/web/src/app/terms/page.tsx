import Link from 'next/link';

export default function TermsPage() {
  return (
    <main style={{ padding: '4rem 1.5rem', maxWidth: '52rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="hero-meta-strip">
          <span>LEGAL PROTOCOL SPECIFICATION</span>
          <span>•</span>
          <span>UPDATED NOVEMBER 2026</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
          Terms of Service & Protocol Disclaimers
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          DevForge is an experimental decentralized milestone escrow interface. By interacting with DevForge, you acknowledge and agree to these terms.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.7, fontSize: '0.95rem', color: '#d1d5db' }}>
        <section id="disclaimer" style={{ background: 'rgba(230, 0, 122, 0.08)', border: '1px solid rgba(230, 0, 122, 0.3)', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#E6007A', marginBottom: '0.75rem' }}>
            ⚠️ Sepolia Testnet Alpha Disclaimer
          </h2>
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>
            DevForge is currently deployed exclusively to the Ethereum Sepolia Testnet (Chain ID 11155111). All tokens, deposits, rewards, and escrow values are testnet assets (Sepolia ETH, mock USDC) with <strong>zero real-world economic value</strong>. DevForge is not a registered financial custodian, bank, or broker. Never deposit real mainnet funds to testnet contract addresses.
          </p>
        </section>

        <section id="arbitration">
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            1. Escrow Trust Assumptions & Multi-Sig Arbitration
          </h2>
          <p>
            DevForge smart contract vaults (<code style={{ color: '#E6007A' }}>DevForgeEscrow.sol</code>) are non-custodial in standard execution: funds are released solely upon client cryptographic authorization or refund authorization.
          </p>
          <p>
            In the event of a contested milestone deliverable, a dispute can be initiated by either party. Dispute resolution utilizes an explicit <strong>2-of-3 multi-sig committee</strong> composed of:
          </p>
          <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
            <li><strong>The Client address</strong> (party who pre-funded the vault).</li>
            <li><strong>The Freelancer address</strong> (party executing technical deliverables).</li>
            <li><strong>The DevForge Arbitration Key</strong> (an appointed dispute resolution panel).</li>
          </ul>
          <p>
            Any distribution requires consensus between at least two of these signers. Users acknowledge this trust assumption prior to locking funds into escrow.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            2. Code Quality & Smart Contract Security
          </h2>
          <p>
            The DevForge smart contracts and frontend interface are provided &quot;as is&quot; without warranties of any kind. While the contract employs ReentrancyGuard, explicit access controls, and deterministic state transitions, users interact at their own risk during the testnet alpha period.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            3. Freelancer Independent Contractor Status
          </h2>
          <p>
            DevForge is a decentralized marketplace facilitator. Freelancers listed on DevForge are independent contractors, not employees, agents, or partners of DevForge. Clients are solely responsible for verifying the technical deliverables and running their own independent testing prior to milestone payout approvals.
          </p>
        </section>
      </div>

      <div style={{ marginTop: '3.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-hairline)' }}>
        <Link href="/" style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'underline' }}>
          ← Back to DevForge Home
        </Link>
      </div>
    </main>
  );
}
