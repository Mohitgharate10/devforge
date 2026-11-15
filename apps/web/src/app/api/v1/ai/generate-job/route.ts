import { NextResponse } from 'next/server';
import { generateJobDraftFallback, DomainError } from '@devforge/domain';
import { aiGenerateJobRequestSchema } from '@devforge/api-contracts';
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
    const parsed = aiGenerateJobRequestSchema.parse(body);

    const generated = generateJobDraftFallback({
      title: parsed.title,
      category: parsed.category,
      skills: parsed.skills,
    });

    return success(generated, requestId);
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
