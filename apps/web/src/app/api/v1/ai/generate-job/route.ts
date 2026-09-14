import { NextResponse } from 'next/server';
import { generateJobDraftFallback } from '@devforge/domain';
import { aiGenerateJobRequestSchema } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

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
      { code: 'VALIDATION_FAILED', message: error instanceof Error ? error.message : 'Invalid request.', status: 400 },
      requestId,
    );
  }
}
