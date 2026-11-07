export type AiFeatureType = 'JOB_DRAFT' | 'PROPOSAL_ASSIST' | 'PROFILE_IMPROVE' | 'SKILL_MATCH';

export interface SkillMatchAnalysis {
  score: number; // 0 to 100
  matchedSkills: string[];
  missingSkills: string[];
  tier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'LOW';
  explanation: string;
}

/**
 * Calculates deterministic match score between required job skills and candidate skills.
 */
export function calculateSkillMatch(
  requiredSkills: string[],
  candidateSkills: string[],
): SkillMatchAnalysis {
  if (requiredSkills.length === 0) {
    return {
      score: 100,
      matchedSkills: [],
      missingSkills: [],
      tier: 'EXCELLENT',
      explanation: 'No specific prerequisite skills were required for this position.',
    };
  }

  const normalizedRequired = requiredSkills.map((s) => s.trim().toLowerCase());
  const normalizedCandidate = candidateSkills.map((s) => s.trim().toLowerCase());

  const matched: string[] = [];
  const missing: string[] = [];

  for (let i = 0; i < requiredSkills.length; i++) {
    const req = normalizedRequired[i]!;
    const originalReq = requiredSkills[i]!;
    if (
      normalizedCandidate.some((cand) => cand === req || cand.includes(req) || req.includes(cand))
    ) {
      matched.push(originalReq);
    } else {
      missing.push(originalReq);
    }
  }

  const score = Math.round((matched.length / requiredSkills.length) * 100);

  let tier: SkillMatchAnalysis['tier'] = 'LOW';
  if (score >= 85) tier = 'EXCELLENT';
  else if (score >= 65) tier = 'GOOD';
  else if (score >= 40) tier = 'FAIR';

  const explanation =
    score === 100
      ? `Candidate matches all ${requiredSkills.length} required skill competencies.`
      : matched.length > 0
        ? `Candidate demonstrates proficiency in ${matched.join(', ')}. Additional experience with ${missing.join(', ')} is recommended.`
        : `Candidate profile has not yet highlighted the primary requirements (${requiredSkills.join(', ')}).`;

  return {
    score,
    matchedSkills: matched,
    missingSkills: missing,
    tier,
    explanation,
  };
}

/**
 * Generates an intelligent fallback job specification given rough parameters.
 */
export function generateJobDraftFallback(input: {
  title: string;
  category?: string;
  skills?: string[];
}): {
  title: string;
  description: string;
  suggestedBudgetMin: number;
  suggestedBudgetMax: number;
  milestones: { title: string; percentage: number; description: string }[];
} {
  const title = input.title.trim();
  const category = input.category ?? 'Web3 Development';
  const skills =
    input.skills && input.skills.length > 0 ? input.skills : ['Rust', 'Substrate', 'TypeScript'];

  return {
    title,
    description: `## Project Overview
We are looking for an experienced ${category} specialist to build and deliver ${title}.

## Deliverables & Scope
- Design architecture & state transitions adhering to production best practices.
- Implement core logic with complete unit and integration test coverage.
- Perform audit readiness verification and write clear technical documentation.

## Required Stack
- ${skills.join(', ')}

## Timeline & Working Agreement
Milestone-driven escrow payout upon verifiable acceptance criteria.`,
    suggestedBudgetMin: 3500,
    suggestedBudgetMax: 8000,
    milestones: [
      {
        title: 'Architecture Spec & Test Harness',
        percentage: 30,
        description:
          'Detailed system blueprint, technical interface definitions, and passing test scaffold.',
      },
      {
        title: 'Core Implementation & Smart Contracts / Logic',
        percentage: 50,
        description: 'End-to-end functionality, state verification, and integration validation.',
      },
      {
        title: 'Auditing, Documentation & Final Deployment',
        percentage: 20,
        description:
          'Final security checklists, deployment verification, and handoff documentation.',
      },
    ],
  };
}

/**
 * Generates an intelligent proposal draft given job context.
 */
export function generateProposalDraftFallback(input: {
  jobTitle: string;
  freelancerName: string;
  skills: string[];
}): {
  coverLetter: string;
  suggestedRate: number;
} {
  return {
    coverLetter: `Hello,\n\nI reviewed your listing for "${input.jobTitle}" and I am confident I can deliver high quality results on schedule. With deep expertise across ${input.skills.slice(0, 3).join(', ')}, I specialize in robust decentralized architectures, thorough automated testing, and transparent communication.\n\nMy proposed approach involves:\n1. Detailed specification review and alignment on acceptance criteria.\n2. Rapid iterative milestone delivery with progress demos in our DevForge project room.\n3. Complete documentation and test reports prior to escrow release.\n\nLooking forward to discussing the specifics.\n\nBest regards,\n${input.freelancerName}`,
    suggestedRate: 95,
  };
}
