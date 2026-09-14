import { NextResponse } from 'next/server';
import { generateProposalDraftFallback } from '@devforge/domain';
import { aiGenerateProposalRequestSchema } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

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
      { code: 'VALIDATION_FAILED', message: error instanceof Error ? error.message : 'Invalid request.', status: 400 },
      requestId,
    );
  }
}
