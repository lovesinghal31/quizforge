import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

/**
 * Retrieve the current session on the server side.
 * Returns the session and user if authenticated, or null otherwise.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}
