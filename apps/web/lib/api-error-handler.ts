import { NextResponse } from 'next/server';

import { AuthError } from '~/lib/require-auth';

export function handleApiError(error: unknown, context: string): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  console.error(`Unexpected error in ${context}:`, error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 },
  );
}
