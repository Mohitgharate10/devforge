import { describe, it, expect } from 'vitest';
import {
  calculateSkillMatch,
  generateJobDraftFallback,
  generateProposalDraftFallback,
} from './ai.policy';

describe('ai.policy', () => {
  describe('calculateSkillMatch', () => {
    it('returns 100% when no skills required', () => {
      const res = calculateSkillMatch([], ['Rust', 'Solidity']);
      expect(res.score).toBe(100);
      expect(res.tier).toBe('EXCELLENT');
    });

    it('accurately matches skills case-insensitively', () => {
      const res = calculateSkillMatch(['Rust', 'Solidity', 'Substrate'], ['rust', 'Solidity']);
      expect(res.score).toBe(67);
      expect(res.matchedSkills).toEqual(['Rust', 'Solidity']);
      expect(res.missingSkills).toEqual(['Substrate']);
      expect(res.tier).toBe('GOOD');
    });

    it('categorizes low match properly', () => {
      const res = calculateSkillMatch(['Go', 'Python', 'Kubernetes'], ['Rust']);
      expect(res.score).toBe(0);
      expect(res.tier).toBe('LOW');
    });
  });

  describe('generateJobDraftFallback', () => {
    it('produces structured job spec with milestones', () => {
      const draft = generateJobDraftFallback({
        title: 'Polkadot Parachain Pallet Developer',
        skills: ['Rust', 'Substrate'],
      });
      expect(draft.title).toBe('Polkadot Parachain Pallet Developer');
      expect(draft.description).toContain('Polkadot Parachain Pallet Developer');
      expect(draft.milestones).toHaveLength(3);
      expect(draft.milestones.reduce((acc, m) => acc + m.percentage, 0)).toBe(100);
    });
  });

  describe('generateProposalDraftFallback', () => {
    it('creates personalized proposal draft', () => {
      const draft = generateProposalDraftFallback({
        jobTitle: 'Solana Program Engineer',
        freelancerName: 'Elena Rostova',
        skills: ['Rust', 'Anchor', 'TypeScript'],
      });
      expect(draft.coverLetter).toContain('Solana Program Engineer');
      expect(draft.coverLetter).toContain('Elena Rostova');
      expect(draft.suggestedRate).toBeGreaterThan(0);
    });
  });
});
