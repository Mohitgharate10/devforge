'use client';

import JobDetailPage from '../[jobId]/page';

export default function SubstratePalletPage() {
  return <JobDetailPage params={Promise.resolve({ jobId: 'job-substrate-pallet' })} />;
}
