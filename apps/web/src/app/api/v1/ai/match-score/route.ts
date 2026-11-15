import { NextResponse } from 'next/server';
import { calculateSkillMatch, DomainError } from '@devforge/domain';
import { aiSkillMatchRequestSchema } from '@devforge/api-contracts';
import type { ApiErrorCode } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { enforceRateLimit, AI_RATE_LIMIT } from '@/server/shared/rate-limit';

export async function POST(request: Request): Promise<NextResponse> {
  const rateLimitResponse = enforceRateLimit(request, AI_RATE_LIMIT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    await requireSession(request.headers);
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as ApiErrorCode, message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'UNAUTHENTICATED', message: 'Authentication required.', status: 401 },
      requestId,
    );
  }

  try {
    const body = await request.json();
    const parsed = aiSkillMatchRequestSchema.parse(body);

    const match = calculateSkillMatch(parsed.requiredSkills, parsed.candidateSkills);
    return success(match, requestId);
  } catch (error) {
    return failure(
      {
        code: 'VALIDATION_FAILED',
        message: error instanceof Error ? error.message : 'Invalid request.',
        status: 400,
      },
      requestId,
    );
  }
}
