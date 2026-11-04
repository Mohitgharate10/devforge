import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  const response = new NextResponse(
    JSON.stringify({ data: { success: true }, meta: { requestId: crypto.randomUUID() } }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'devforge_session=; Path=/; Max-Age=0; SameSite=Lax',
      },
    },
  );
  return response;
}
