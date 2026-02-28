import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';

/**
 * Create an authenticated Supabase client from the request's Authorization header.
 * The JWT from the header is forwarded so that RLS policies are enforced for the calling user.
 */
export function createSupabaseClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new AuthenticationError('Missing Authorization header');
  }

  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: authHeader } },
    },
  );
}

/**
 * Create an admin Supabase client using the service role key.
 * Use this for operations that need to bypass RLS (e.g., background processing).
 */
export function createAdminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Decode the JWT payload to extract the user ID without a network call.
 * RLS on the Supabase client (which carries the JWT) handles actual authorization.
 */
function getUserIdFromJwt(req: Request): string {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing Authorization header');
  }
  try {
    const payload = JSON.parse(atob(authHeader.split('.')[1]));
    const sub = payload.sub;
    if (typeof sub !== 'string' || !sub) {
      throw new AuthenticationError('Invalid JWT: missing sub claim');
    }
    // Reject obviously expired tokens (exp is seconds since epoch)
    if (typeof payload.exp === 'number' && payload.exp < Date.now() / 1000) {
      throw new AuthenticationError('Token expired');
    }
    return sub;
  } catch (e) {
    if (e instanceof AuthenticationError) throw e;
    throw new AuthenticationError('Invalid JWT');
  }
}

/**
 * Extract the authenticated user from the request.
 * Decodes the JWT locally instead of calling getUser() to avoid a network round-trip.
 * The Supabase client carries the JWT so RLS still enforces authorization on every query.
 */
export function getAuthenticatedUser(req: Request) {
  const supabase = createSupabaseClient(req);
  const userId = getUserIdFromJwt(req);

  return { supabase, user: { id: userId } };
}
