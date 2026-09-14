'use client';

import { useState, useEffect } from 'react';

interface AiProposalCopilotProps {
  jobTitle: string;
  jobSkills: string[];
  candidateSkills: string[];
  onApplyCoverLetter: (letter: string) => void;
}

interface MatchAnalysis {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  tier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'LOW';
  explanation: string;
}

export function AiProposalCopilot({
  jobTitle,
  jobSkills,
  candidateSkills,
  onApplyCoverLetter,
}: AiProposalCopilotProps) {
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function evaluate() {
      try {
        const res = await fetch('/api/v1/ai/match-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requiredSkills: jobSkills,
            candidateSkills: candidateSkills,
          }),
        });
        const json = await res.json();
        if (!ignore && json.data) {
          setAnalysis(json.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    evaluate();
    return () => {
      ignore = true;
    };
  }, [jobSkills, candidateSkills]);

  const handleGenerateProposalDraft = async () => {
    try {
      setGenerating(true);
      const res = await fetch('/api/v1/ai/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          freelancerName: 'Elena Rostova',
          skills: candidateSkills,
        }),
      });
      const json = await res.json();
      if (json.data?.coverLetter) {
        onApplyCoverLetter(json.data.coverLetter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'EXCELLENT':
        return '#10B981';
      case 'GOOD':
        return '#3B82F6';
      case 'FAIR':
        return '#F59E0B';
      default:
        return '#EF4444';
    }
  };

  return (
    <div style={{
      background: 'rgba(230, 0, 122, 0.05)',
      border: '1px solid rgba(230, 0, 122, 0.25)',
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>✨</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            DevForge AI Proposal Copilot
          </span>
        </div>

        {analysis && (
          <span style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            color: getTierColor(analysis.tier),
            border: `1px solid ${getTierColor(analysis.tier)}`,
          }}>
            {analysis.score}% MATCH ({analysis.tier})
          </span>
        )}
      </div>

      {analysis && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
          {analysis.explanation}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {analysis?.matchedSkills.map((skill) => (
            <span
              key={skill}
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ✓ {skill}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGenerateProposalDraft}
          disabled={generating}
          className="btn-pill-primary"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
        >
          {generating ? 'Drafting...' : '✨ Auto-Draft Cover Letter'}
        </button>
      </div>
    </div>
  );
}
