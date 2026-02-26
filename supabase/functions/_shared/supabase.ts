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
 * Extract and verify the authenticated user from the request.
 * Returns the Supabase client (scoped to the user) and the user object.
 */
export async function getAuthenticatedUser(req: Request) {
  const supabase = createSupabaseClient(req);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError();
  }

  return { supabase, user };
}
