import type { ApiErrorCode, ApiFailure, ApiSuccess } from '@devforge/api-contracts';
import { NextResponse } from 'next/server';

type ApiError = {
  code: ApiErrorCode;
  message: string;
  status: number;
  details?: unknown[];
};

export function success<T>(data: T, requestId: string, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data, meta: { requestId } }, { status });
}

export function failure(error: ApiError, requestId: string): NextResponse<ApiFailure> {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? [],
      },
      meta: { requestId },
    },
    { status: error.status },
  );
}
