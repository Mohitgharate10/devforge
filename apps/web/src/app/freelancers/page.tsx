import Link from 'next/link';
import { prisma } from '@devforge/database';
import { TalentDirectoryGrid } from '@/components/TalentDirectoryGrid';

export const dynamic = 'force-dynamic';

export default async function FreelancersDirectoryPage() {
  let freelancers: Array<{
    id: string;
    handle: string;
    title: string;
    bio: string;
    hourlyRate: bigint | null;
    availability: string;
    user: {
      displayName: string;
      avatarUrl: string | null;
      wallets: Array<{ address: string }>;
    };
    skills: Array<{ skillId: string; skill: { name: string } }>;
  }> = [];

  try {
    freelancers = await prisma.freelancerProfile.findMany({
      include: {
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
            wallets: {
              where: { isPrimary: true },
              select: { address: true },
            },
          },
        },
        skills: {
          include: { skill: true },
          orderBy: { displayOrder: 'asc' },
        },
        portfolioProjects: {
          where: { isPublished: true },
          take: 2,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.warn(
      '[FreelancersPage] Database not connected or running yet:',
      (err as Error).message,
    );
    freelancers = [];
  }

  return (
    <main style={{ padding: '4rem 2.5rem', maxWidth: '84rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem' }}>
        <div className="hero-meta-strip">
          <span>02 / DIRECTORY</span>
          <span>•</span>
          <span>VERIFIED SPECIALISTS</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
          }}
        >
          Technical Talent
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.75rem' }}>
          Engineers verified through cryptographic wallet identity and proven deliverables.
        </p>
      </div>

      {freelancers.length === 0 ? (
        <div>
          <div
            style={{
              padding: '1.25rem 1.5rem',
              border: '1px solid rgba(230, 0, 122, 0.25)',
              borderRadius: '8px',
              background: 'rgba(230, 0, 122, 0.05)',
              marginBottom: '2.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--accent-magenta)',
                  fontWeight: 700,
                }}
              >
                ● LOCAL DEMO MODE
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.25rem',
                }}
              >
                Local PostgreSQL is offline. Showing verified sample talent profiles below.
              </p>
            </div>
            <Link
              href="/auth/sign-up"
              className="btn-pill-primary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1.2rem' }}
            >
              Create Your Profile
            </Link>
          </div>

          <TalentDirectoryGrid />
        </div>
      ) : (
        <div className="editorial-grid">
          {freelancers.map((f) => (
            <Link key={f.id} href={`/freelancers/${f.handle}`} className="card-editorial">
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
                    @{f.handle}
                  </span>
                  <span className="skill-tag" style={{ fontSize: '0.65rem' }}>
                    {f.availability}
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
                  {f.user.displayName}
                </h2>

                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1.25rem',
                    lineHeight: 1.5,
                  }}
                >
                  {f.title}
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {f.skills.map((s) => (
                    <span key={s.skillId} className="skill-tag accent">
                      {s.skill.name}
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
                  {f.hourlyRate ? `$${(Number(f.hourlyRate) / 100).toFixed(0)}/hr` : 'Custom Quote'}
                </span>
                <span
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  View Profile →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
