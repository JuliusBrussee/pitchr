import { createClient } from "@supabase/supabase-js";

type AdminSupabaseClient = ReturnType<
  typeof createClient<any, "public", "public">
>;

let adminClient: AdminSupabaseClient | null = null;

export function createAdminClient(): AdminSupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client.",
    );
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as AdminSupabaseClient;

  return adminClient;
}
