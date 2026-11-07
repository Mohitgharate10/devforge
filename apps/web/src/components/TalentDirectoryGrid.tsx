'use client';

import { useSyncExternalStore, useState, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('ALL');

  const allCards = useMemo(() => {
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
    return cards;
  }, [rawStored]);

  const uniqueSkills = useMemo(() => {
    const set = new Set<string>();
    allCards.forEach((c) => c.skills.forEach((s) => set.add(s)));
    return ['ALL', ...Array.from(set)];
  }, [allCards]);

  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const matchesSearch =
        searchTerm === '' ||
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.handle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSkill = selectedSkill === 'ALL' || card.skills.includes(selectedSkill);

      const matchesAvailability =
        selectedAvailability === 'ALL' || card.availability === selectedAvailability;

      return matchesSearch && matchesSkill && matchesAvailability;
    });
  }, [allCards, searchTerm, selectedSkill, selectedAvailability]);

  return (
    <div>
      {/* Search & Filter Controls */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search specialists by name, title, @handle, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-hairline)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-hairline)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {uniqueSkills.map((skill) => (
                <option key={skill} value={skill}>
                  Skill: {skill}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-hairline)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="ALL">Availability: All</option>
              <option value="AVAILABLE">Available Now</option>
              <option value="PARTIALLY_AVAILABLE">Partially Available</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result Counter & Notice */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div>
          Showing <strong>{filteredCards.length}</strong> verified specialists
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          SEPOLIA TESTNET PROFILES
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1rem',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No specialists match your criteria
          </h3>
          <p
            style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}
          >
            Try clearing your search term or filtering for all skills.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedSkill('ALL');
              setSelectedAvailability('ALL');
            }}
            className="btn-pill-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="editorial-grid">
          {filteredCards.map((p) => (
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-hairline)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {p.rate}
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                >
                  View Profile &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
