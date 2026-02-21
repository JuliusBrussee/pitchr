import { supabase } from '@/lib/supabase';

/* ─── Types ─── */

export interface SettingsRecord {
  id: string;
  feedback_intensity: 'gentle' | 'balanced' | 'aggressive';
  realtime_coaching: boolean;
  post_session_report: boolean;
  focus_areas: string[];
  auto_record: boolean;
  timer_seconds: number;
  theme: 'system' | 'light' | 'dark';
  compact_mode: boolean;
  updated_at: string;
}

export type SettingsUpdate = Partial<Omit<SettingsRecord, 'id' | 'updated_at'>>;

/* ─── Database Operations ─── */

export async function getSettings(): Promise<SettingsRecord> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single();

  if (error) throw new Error(`Failed to get settings: ${error.message}`);
  return data;
}

export async function updateSettings(updates: SettingsUpdate): Promise<SettingsRecord> {
  const current = await getSettings();

  const { data, error } = await supabase
    .from('settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', current.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update settings: ${error.message}`);
  return data;
}
