'use client';

import { useState } from 'react';

interface AiJobOutput {
  title: string;
  description: string;
  suggestedBudgetMin: number;
  suggestedBudgetMax: number;
  milestones: Array<{ title: string; percentage: number; description: string }>;
}

interface AiJobGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDraft: (draft: AiJobOutput) => void;
}

export function AiJobGeneratorModal({ isOpen, onClose, onApplyDraft }: AiJobGeneratorModalProps) {
  const [jobIdea, setJobIdea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Smart Contract Security');
  const [selectedSkills, setSelectedSkills] = useState('Rust, Substrate, Ink!, Solidity');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AiJobOutput | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const skillsArray = selectedSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch('/api/v1/ai/generate-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobIdea || 'Senior Substrate Runtime Architect',
          category: selectedCategory,
          skills: skillsArray,
        }),
      });

      const json = await res.json();
      if (json.data) {
        setResult(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{
        background: '#111114',
        border: '1px solid rgba(230, 0, 122, 0.4)',
        borderRadius: '16px',
        maxWidth: '42rem',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
              DevForge AI Job Specification Assistant
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Describe your project needs in plain language. DevForge AI will generate technical acceptance criteria, required competencies, and milestone-based escrow structures.
        </p>

        {!result ? (
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Job Title or High-Level Objective
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cross-Chain Bridge Auditor, Zero-Knowledge Rollup Engineer..."
                value={jobIdea}
                onChange={(e) => setJobIdea(e.target.value)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Target Domain
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="Smart Contract Security">Smart Contract Security</option>
                  <option value="Zero-Knowledge Systems">Zero-Knowledge Systems</option>
                  <option value="Substrate / Polkadot Runtimes">Substrate / Polkadot Runtimes</option>
                  <option value="DeFi Protocol Architecture">DeFi Protocol Architecture</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Key Skill Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={selectedSkills}
                  onChange={(e) => setSelectedSkills(e.target.value)}
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={onClose} className="btn-pill-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="btn-pill-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {generating ? 'Synthesizing Spec...' : '✨ Generate Structured Spec'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              background: 'rgba(230, 0, 122, 0.08)',
              border: '1px solid rgba(230, 0, 122, 0.3)',
              borderRadius: '10px',
              padding: '1.25rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#E6007A', marginBottom: '0.25rem' }}>
                GENERATED SPECIFICATION
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{result.title}</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Suggested Budget: <strong style={{ color: '#10B981' }}>${result.suggestedBudgetMin.toLocaleString()} - ${result.suggestedBudgetMax.toLocaleString()} USDC</strong>
              </div>
              <pre style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                maxHeight: '14rem',
                overflowY: 'auto',
                border: '1px solid var(--border-hairline)',
              }}>
                {result.description}
              </pre>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                SUGGESTED MILESTONE PHASES ({result.milestones.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.milestones.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.description}</div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: '#E6007A', fontWeight: 700 }}>
                      {m.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="btn-pill-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                ↺ Regenerate
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} className="btn-pill-secondary" style={{ fontSize: '0.8rem' }}>
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyDraft(result);
                    onClose();
                  }}
                  className="btn-pill-primary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Apply to Job Draft ✓
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
