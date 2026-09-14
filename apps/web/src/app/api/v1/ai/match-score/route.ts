import { NextResponse } from 'next/server';
import { calculateSkillMatch } from '@devforge/domain';
import { aiSkillMatchRequestSchema } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json();
    const parsed = aiSkillMatchRequestSchema.parse(body);

    const match = calculateSkillMatch(parsed.requiredSkills, parsed.candidateSkills);
    return success(match, requestId);
  } catch (error) {
    return failure(
      { code: 'VALIDATION_FAILED', message: error instanceof Error ? error.message : 'Invalid request.', status: 400 },
      requestId,
    );
  }
}
