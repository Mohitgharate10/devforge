'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AiJobGeneratorModal } from '@/components/AiJobGeneratorModal';

export default function CreateJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Smart Contract Auditing');
  const [organization, setOrganization] = useState('');
  const [budgetMin, setBudgetMin] = useState('10000');
  const [budgetMax, setBudgetMax] = useState('20000');
  const [currency, setCurrency] = useState('USDC');
  const [skills, setSkills] = useState('Solidity, Foundry, Rust');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
    let resolvedJobId = `job-${Date.now().toString(36)}`;

    try {
      // 1. Persist directly into Supabase PostgreSQL Database
      const res = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || 'Technical specification and milestone deliverables for protocol implementation.',
          budgetMin: Number(budgetMin) * 100,
          budgetMax: Number(budgetMax) * 100,
          currency,
          category,
          client: organization || 'Protocol / Client Team',
          skills: skillList.length > 0 ? skillList : ['Solidity', 'Web3'],
        }),
      });

      const json = await res.json().catch(() => null);
      if (json?.data?.id) {
        resolvedJobId = json.data.id;
      }
    } catch (err) {
      console.warn('API post fallback to local storage:', err);
    }

    const newJob = {
      id: resolvedJobId,
      title,
      description,
      category,
      client: organization || 'Protocol / Client Team',
      budget: `$${Number(budgetMin).toLocaleString()} – $${Number(budgetMax).toLocaleString()}`,
      currency,
      skills: skillList.length > 0 ? skillList : ['Solidity', 'Web3'],
      publishedAt: 'Just now',
      isLocalNew: true,
    };

    try {
      const existing = JSON.parse(localStorage.getItem('devforge_demo_jobs') || '[]');
      localStorage.setItem('devforge_demo_jobs', JSON.stringify([newJob, ...existing]));
    } catch {
      // ignore
    }

    setSuccessMessage('Bounty created and published to the database! Redirecting...');
    setIsSubmitting(false);

    setTimeout(() => {
      router.push('/jobs');
    }, 1000);
  };

  return (
    <main style={{ padding: '4rem 1.5rem', maxWidth: '44rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="hero-meta-strip">
          <span>03 / CLIENT PORTAL</span>
          <span>•</span>
          <span>CREATE BOUNTY</span>
          <span>•</span>
          <span>ESCROW LOCKUP</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            marginBottom: '0.75rem',
          }}
        >
          Post a Bounty or Role
        </h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, margin: 0, maxWidth: '28rem' }}>
            Publish your technical specification to elite Web3 engineers. Escrow is locked upon milestone agreement.
          </p>
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="btn-pill-secondary"
            style={{
              borderColor: 'rgba(230, 0, 122, 0.4)',
              color: '#E6007A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
            }}
          >
            ✨ AI Draft Assist
          </button>
        </div>
      </div>


      {successMessage && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '8px',
            background: 'rgba(0, 230, 118, 0.08)',
            border: '1px solid rgba(0, 230, 118, 0.3)',
            color: 'var(--status-live)',
            fontSize: '0.9rem',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          {successMessage}
          <div style={{ marginTop: '0.5rem' }}>
            <Link href="/jobs" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
              Redirecting to Open Roles →
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Role / Bounty Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. EVM Reentrancy & Flash-Loan Audit for Lending Protocol"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            >
              <option value="Smart Contract Auditing">Smart Contract Auditing</option>
              <option value="Zero Knowledge & Cryptography">Zero Knowledge & Cryptography</option>
              <option value="Full Stack Web3">Full Stack Web3</option>
              <option value="Infrastructure & DevOps">Infrastructure & DevOps</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Organization / Protocol Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aave Ecosystem DAO"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Budget Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Min Budget
            </label>
            <input
              type="number"
              min="100"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Max Budget
            </label>
            <input
              type="number"
              min="100"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            >
              <option value="USDC">USDC (Sepolia)</option>
              <option value="ETH">ETH (Native)</option>
              <option value="DOT">DOT (Substrate)</option>
            </select>
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Required Skills (comma-separated) *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Solidity, Foundry, Halmos, Rust"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Technical Scope & Deliverables *
          </label>
          <textarea
            required
            rows={5}
            placeholder="Describe the milestone deliverables, smart contract repositories, architecture diagrams, and timeline expectations..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <Link href="/jobs" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            ← Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pill-primary"
            style={{ minWidth: '180px', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Bounty →'}
          </button>
        </div>
      </form>

      <AiJobGeneratorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyDraft={(draft) => {
          setTitle(draft.title);
          setDescription(draft.description);
          setBudgetMin(draft.suggestedBudgetMin.toString());
          setBudgetMax(draft.suggestedBudgetMax.toString());
        }}
      />
    </main>
  );
}

