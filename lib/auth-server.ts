import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

/**
 * Retrieve the current session on the server side.
 * Accepts optional request headers for API route handlers,
 * or falls back to next/headers for Server Components.
 */
export async function getSession(reqHeaders?: Headers) {
  try {
    const session = await auth.api.getSession({
      headers: reqHeaders || (await headers()),
    });
    return session;
  } catch {
    return null;
  }
}
