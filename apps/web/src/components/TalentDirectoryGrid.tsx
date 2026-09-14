'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';

export type SpecialistCard = {
  handle: string;
  name: string;
  title: string;
  rate: string;
  availability: string;
  skills: string[];
  isLocalNew?: boolean;
};

const DEFAULT_SPECIALISTS: SpecialistCard[] = [
  {
    handle: 'satoshi_core',
    name: 'Elena Rostova',
    title: 'EVM & Substrate Security Auditor',
    rate: '$150/hr',
    availability: 'AVAILABLE',
    skills: ['Solidity', 'Rust', 'Smart Contract Auditing', 'Foundry'],
  },
  {
    handle: 'zk_builder',
    name: 'Marcus Vance',
    title: 'Zero Knowledge & DeFi Systems Engineer',
    rate: '$175/hr',
    availability: 'PARTIALLY_AVAILABLE',
    skills: ['Rust', 'Zero-Knowledge', 'DeFi Protocols', 'Viem'],
  },
  {
    handle: 'polka_dev',
    name: 'Kenji Sato',
    title: 'Full Stack Web3 Architect',
    rate: '$130/hr',
    availability: 'AVAILABLE',
    skills: ['TypeScript', 'Next.js', 'Solidity', 'Subgraphs'],
  },
];

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): string {
  try {
    return localStorage.getItem('devforge_demo_specialists') || '[]';
  } catch {
    return '[]';
  }
}

function getServerSnapshot(): string {
  return '[]';
}

export function TalentDirectoryGrid() {
  const rawStored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let cards = DEFAULT_SPECIALISTS;
  try {
    const parsed: SpecialistCard[] = JSON.parse(rawStored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const combined = [...parsed, ...DEFAULT_SPECIALISTS];
      cards = Array.from(new Map(combined.map((c) => [c.handle, c])).values());
    }
  } catch {
    // ignore
  }

  return (
    <div className="editorial-grid">
      {cards.map((p) => (
        <Link key={p.handle} href={`/freelancers/${p.handle}`} className="card-editorial">
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--accent-magenta)',
                }}
              >
                @{p.handle}
              </span>
              <span
                className="skill-tag"
                style={{
                  fontSize: '0.65rem',
                  borderColor: p.isLocalNew ? 'var(--status-live)' : undefined,
                  color: p.isLocalNew ? 'var(--status-live)' : undefined,
                }}
              >
                {p.isLocalNew ? 'NEW PROFILE' : p.availability}
              </span>
            </div>

            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                marginBottom: '0.5rem',
              }}
            >
              {p.name}
            </h2>

            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}
            >
              {p.title}
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.4rem',
                marginBottom: '1.5rem',
              }}
            >
              {p.skills.map((s) => (
                <span key={s} className="skill-tag accent">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border-hairline)',
              paddingTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              {p.rate}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Verified Profile →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
