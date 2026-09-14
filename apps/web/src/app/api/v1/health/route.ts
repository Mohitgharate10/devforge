import { healthStatusSchema } from '@devforge/api-contracts';

import { success } from '@/server/shared/http/api-response';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const health = healthStatusSchema.parse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'web',
  });

  return success(health, requestId);
}
