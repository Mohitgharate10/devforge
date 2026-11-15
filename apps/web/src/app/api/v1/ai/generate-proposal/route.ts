import { NextResponse } from 'next/server';
import { generateProposalDraftFallback, DomainError } from '@devforge/domain';
import { aiGenerateProposalRequestSchema } from '@devforge/api-contracts';
import type { ApiErrorCode } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';

export async function POST(request: Request): Promise<NextResponse> {
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
    const parsed = aiGenerateProposalRequestSchema.parse(body);

    const generated = generateProposalDraftFallback({
      jobTitle: parsed.jobTitle,
      freelancerName: parsed.freelancerName,
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
