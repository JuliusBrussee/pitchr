/**
 * @deprecated Use `lib/supabase/server.ts`, `lib/supabase/client.ts`, or `lib/supabase/admin.ts` instead.
 * This singleton will be removed after all services are migrated to accept a SupabaseClient parameter.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl || 'http://placeholder', supabaseAnonKey || 'placeholder');
