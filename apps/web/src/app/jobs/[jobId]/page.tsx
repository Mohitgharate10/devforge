import { notFound } from 'next/navigation';
import { prisma } from '@devforge/database';
import { findCanonicalBounty } from '@/lib/canonical-marketplace';
import JobDetailClient, { type JobDetailData } from './JobDetailClient';

export const dynamic = 'force-dynamic';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatMinorUnits(amount: bigint, currency: string): string {
  const formatted = (Number(amount) / 100).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
  return currency === 'USD' ? `$${formatted}` : `${formatted} ${currency}`;
}

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const bounty = findCanonicalBounty(jobId);

  if (bounty) {
    const minBudget = `$${bounty.budgetMin.toLocaleString()}`;
    const maxBudget = `$${bounty.budgetMax.toLocaleString()}`;
    const job: JobDetailData = {
      title: bounty.title,
      category: bounty.category.name,
      client: bounty.client.organizationName,
      budget: minBudget === maxBudget ? minBudget : `${minBudget} – ${maxBudget}`,
      currency: bounty.currency,
      description: bounty.description,
      skills: bounty.skills,
      milestones: bounty.milestones,
    };

    return <JobDetailClient jobId={jobId} job={job} />;
  }

  if (!uuidPattern.test(jobId)) notFound();

  const databaseJob = await prisma.job.findFirst({
    where: { id: jobId, status: 'PUBLISHED' },
    include: {
      category: true,
      clientProfile: true,
      skills: { include: { skill: true } },
    },
  });

  if (!databaseJob) notFound();

  const minBudget = databaseJob.budgetMin
    ? formatMinorUnits(databaseJob.budgetMin, databaseJob.currency)
    : null;
  const maxBudget = databaseJob.budgetMax
    ? formatMinorUnits(databaseJob.budgetMax, databaseJob.currency)
    : null;
  const job: JobDetailData = {
    title: databaseJob.title,
    category: databaseJob.category.name,
    client: databaseJob.clientProfile.organizationName,
    budget:
      minBudget && maxBudget
        ? minBudget === maxBudget
          ? minBudget
          : `${minBudget} – ${maxBudget}`
        : (minBudget ?? maxBudget ?? 'Budget not specified'),
    currency: databaseJob.currency,
    description: databaseJob.description,
    skills: databaseJob.skills.map(({ skill }) => skill.name),
    milestones: [],
  };

  return <JobDetailClient jobId={jobId} job={job} />;
}
