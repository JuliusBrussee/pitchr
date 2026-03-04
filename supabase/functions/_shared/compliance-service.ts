import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';
import { errorResponse } from './response.ts';

export type CompliancePhase = 'off' | 'soft' | 'hard_core' | 'hard_all';
export type Jurisdiction = 'eea_uk' | 'rest_of_world' | 'unknown';
export type ComplianceScope = 'eea_uk';

export interface ComplianceConfig {
  scope: ComplianceScope;
  phase: CompliancePhase;
  policyVersion: string;
}

export interface ComplianceStatus {
  phase: CompliancePhase;
  scope: ComplianceScope;
  policyVersion: string;
  countryCode: string | null;
  jurisdiction: Jurisdiction;
  required: boolean;
  completed: boolean;
  missingRequired: string[];
  termsAcceptedAt: string | null;
  privacyNoticeAcknowledgedAt: string | null;
  contractBasisConfirmedAt: string | null;
  complianceCompletedAt: string | null;
  analyticsOptIn: boolean;
  marketingOptIn: boolean;
}

export interface ComplianceAcceptInput {
  termsAccepted: boolean;
  privacyNoticeAcknowledged: boolean;
  analyticsOptIn: boolean;
  marketingOptIn: boolean;
}

interface ComplianceProfileRow {
  user_id: string;
  jurisdiction: Jurisdiction;
  policy_version: string;
  terms_accepted_at: string | null;
  privacy_notice_acknowledged_at: string | null;
  contract_basis_confirmed_at: string | null;
  analytics_opt_in: boolean;
  marketing_opt_in: boolean;
  compliance_completed_at: string | null;
  ip_country: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SCOPE: ComplianceScope = 'eea_uk';
const DEFAULT_PHASE: CompliancePhase = 'soft';
const DEFAULT_POLICY_VERSION = '2026-03-04';

const EEA_UK_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
  'GB', 'UK',
]);

const HARD_CORE_ENDPOINTS = new Set(['pitch-run', 'deck-upload', 'qna-session']);

function parsePhase(value: string | undefined): CompliancePhase {
  if (value === 'off' || value === 'soft' || value === 'hard_core' || value === 'hard_all') {
    return value;
  }
  return DEFAULT_PHASE;
}

function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (normalized.length !== 2) return null;
  return normalized;
}

function resolveJurisdictionFromCountry(countryCode: string | null): Jurisdiction {
  if (!countryCode) return 'unknown';
  return EEA_UK_COUNTRY_CODES.has(countryCode) ? 'eea_uk' : 'rest_of_world';
}

function isScopeEnabled(scope: ComplianceScope, jurisdiction: Jurisdiction): boolean {
  if (scope === 'eea_uk') return jurisdiction === 'eea_uk';
  return false;
}

function shouldBlockEndpoint(phase: CompliancePhase, endpointName: string): boolean {
  if (phase === 'off' || phase === 'soft') return false;
  if (phase === 'hard_core') return HARD_CORE_ENDPOINTS.has(endpointName);
  return phase === 'hard_all';
}

function listMissingRequired(profile: ComplianceProfileRow | null, policyVersion: string): string[] {
  if (!profile) {
    return [
      'terms_accepted',
      'privacy_notice_acknowledged',
      'contract_basis_confirmed',
      'compliance_completed',
      'policy_version_mismatch',
    ];
  }

  const missing: string[] = [];
  if (!profile.terms_accepted_at) missing.push('terms_accepted');
  if (!profile.privacy_notice_acknowledged_at) missing.push('privacy_notice_acknowledged');
  if (!profile.contract_basis_confirmed_at) missing.push('contract_basis_confirmed');
  if (!profile.compliance_completed_at) missing.push('compliance_completed');
  if (profile.policy_version !== policyVersion) missing.push('policy_version_mismatch');
  return missing;
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: string; message?: string };
  return value.code === '42P01' || value.message?.includes('does not exist') === true;
}

export function getComplianceConfig(): ComplianceConfig {
  const scope = Deno.env.get('GDPR_SCOPE') === 'eea_uk' ? 'eea_uk' : DEFAULT_SCOPE;
  const phase = parsePhase(Deno.env.get('GDPR_COMPLIANCE_PHASE'));
  const policyVersion = Deno.env.get('GDPR_POLICY_VERSION')?.trim() || DEFAULT_POLICY_VERSION;

  return {
    scope,
    phase,
    policyVersion,
  };
}

export async function getComplianceProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ComplianceProfileRow | null> {
  const { data, error } = await supabase
    .from('user_compliance_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return null;
    }
    throw new Error(`Failed to load compliance profile: ${error.message}`);
  }

  return data as ComplianceProfileRow | null;
}

function resolveCountryFromRequest(req: Request, profile: ComplianceProfileRow | null): string | null {
  const fromHeader = normalizeCountryCode(req.headers.get('x-vercel-ip-country'))
    ?? normalizeCountryCode(req.headers.get('cf-ipcountry'));

  if (fromHeader) return fromHeader;

  const fromProfile = normalizeCountryCode(profile?.ip_country ?? null);
  if (fromProfile) return fromProfile;

  return null;
}

function resolveJurisdiction(countryCode: string | null, profile: ComplianceProfileRow | null): Jurisdiction {
  const fromCountry = resolveJurisdictionFromCountry(countryCode);
  if (fromCountry !== 'unknown') return fromCountry;

  if (profile?.jurisdiction === 'eea_uk' || profile?.jurisdiction === 'rest_of_world' || profile?.jurisdiction === 'unknown') {
    return profile.jurisdiction;
  }

  return 'unknown';
}

export async function buildComplianceStatus(
  supabase: SupabaseClient,
  req: Request,
  userId: string,
): Promise<ComplianceStatus> {
  const config = getComplianceConfig();
  const profile = await getComplianceProfile(supabase, userId);
  const countryCode = resolveCountryFromRequest(req, profile);
  const jurisdiction = resolveJurisdiction(countryCode, profile);

  const required = config.phase !== 'off' && isScopeEnabled(config.scope, jurisdiction);
  const missingRequired = required ? listMissingRequired(profile, config.policyVersion) : [];
  const completed = required ? missingRequired.length === 0 : true;

  return {
    phase: config.phase,
    scope: config.scope,
    policyVersion: config.policyVersion,
    countryCode,
    jurisdiction,
    required,
    completed,
    missingRequired,
    termsAcceptedAt: profile?.terms_accepted_at ?? null,
    privacyNoticeAcknowledgedAt: profile?.privacy_notice_acknowledged_at ?? null,
    contractBasisConfirmedAt: profile?.contract_basis_confirmed_at ?? null,
    complianceCompletedAt: profile?.compliance_completed_at ?? null,
    analyticsOptIn: profile?.analytics_opt_in ?? false,
    marketingOptIn: profile?.marketing_opt_in ?? false,
  };
}

export async function insertComplianceEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  policyVersion: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('user_compliance_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      policy_version: policyVersion,
      payload,
    });

  if (error && !isMissingRelationError(error)) {
    throw new Error(`Failed to insert compliance event: ${error.message}`);
  }
}

export async function acceptCompliance(
  supabase: SupabaseClient,
  req: Request,
  userId: string,
  input: ComplianceAcceptInput,
): Promise<ComplianceStatus> {
  if (!input.termsAccepted) {
    throw new Error('termsAccepted must be true.');
  }
  if (!input.privacyNoticeAcknowledged) {
    throw new Error('privacyNoticeAcknowledged must be true.');
  }

  const config = getComplianceConfig();
  const existingProfile = await getComplianceProfile(supabase, userId);
  const countryCode = resolveCountryFromRequest(req, existingProfile);
  const jurisdiction = resolveJurisdiction(countryCode, existingProfile);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('user_compliance_profiles')
    .upsert(
      {
        user_id: userId,
        jurisdiction,
        policy_version: config.policyVersion,
        terms_accepted_at: now,
        privacy_notice_acknowledged_at: now,
        contract_basis_confirmed_at: now,
        analytics_opt_in: input.analyticsOptIn,
        marketing_opt_in: input.marketingOptIn,
        compliance_completed_at: now,
        ip_country: countryCode,
      },
      { onConflict: 'user_id' },
    );

  if (error && !isMissingRelationError(error)) {
    throw new Error(`Failed to persist compliance acceptance: ${error.message}`);
  }

  await insertComplianceEvent(supabase, userId, 'accepted', config.policyVersion, {
    jurisdiction,
    countryCode,
    analyticsOptIn: input.analyticsOptIn,
    marketingOptIn: input.marketingOptIn,
  });

  return buildComplianceStatus(supabase, req, userId);
}

export async function updateComplianceConsents(
  supabase: SupabaseClient,
  req: Request,
  userId: string,
  updates: { analyticsOptIn?: boolean; marketingOptIn?: boolean },
): Promise<ComplianceStatus> {
  const hasAnalytics = typeof updates.analyticsOptIn === 'boolean';
  const hasMarketing = typeof updates.marketingOptIn === 'boolean';

  if (!hasAnalytics && !hasMarketing) {
    throw new Error('At least one consent flag must be provided.');
  }

  const config = getComplianceConfig();
  const existingProfile = await getComplianceProfile(supabase, userId);
  const countryCode = resolveCountryFromRequest(req, existingProfile);
  const jurisdiction = resolveJurisdiction(countryCode, existingProfile);

  const nextAnalytics = hasAnalytics ? Boolean(updates.analyticsOptIn) : (existingProfile?.analytics_opt_in ?? false);
  const nextMarketing = hasMarketing ? Boolean(updates.marketingOptIn) : (existingProfile?.marketing_opt_in ?? false);

  const { error } = await supabase
    .from('user_compliance_profiles')
    .upsert(
      {
        user_id: userId,
        jurisdiction,
        policy_version: existingProfile?.policy_version ?? config.policyVersion,
        terms_accepted_at: existingProfile?.terms_accepted_at ?? null,
        privacy_notice_acknowledged_at: existingProfile?.privacy_notice_acknowledged_at ?? null,
        contract_basis_confirmed_at: existingProfile?.contract_basis_confirmed_at ?? null,
        analytics_opt_in: nextAnalytics,
        marketing_opt_in: nextMarketing,
        compliance_completed_at: existingProfile?.compliance_completed_at ?? null,
        ip_country: countryCode,
      },
      { onConflict: 'user_id' },
    );

  if (error && !isMissingRelationError(error)) {
    throw new Error(`Failed to update consent settings: ${error.message}`);
  }

  await insertComplianceEvent(supabase, userId, 'consents_updated', config.policyVersion, {
    analyticsOptIn: nextAnalytics,
    marketingOptIn: nextMarketing,
  });

  return buildComplianceStatus(supabase, req, userId);
}

export async function assertComplianceForEndpoint(
  supabase: SupabaseClient,
  req: Request,
  userId: string,
  endpointName: string,
): Promise<Response | null> {
  const config = getComplianceConfig();
  if (!shouldBlockEndpoint(config.phase, endpointName)) {
    return null;
  }

  const probe = await supabase
    .from('user_compliance_profiles')
    .select('user_id')
    .limit(1);
  if (probe.error && isMissingRelationError(probe.error)) {
    console.warn('[compliance] skipping endpoint enforcement because compliance tables are missing');
    return null;
  }

  let status: ComplianceStatus;
  try {
    status = await buildComplianceStatus(supabase, req, userId);
  } catch (error) {
    // Fail open if compliance tables have not been migrated yet.
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.warn('[compliance] skipping endpoint enforcement because compliance tables are missing');
      return null;
    }
    throw error;
  }

  if (!status.required || status.completed) {
    return null;
  }

  return errorResponse(
    'GDPR compliance check required',
    403,
    {
      code: 'GDPR_COMPLIANCE_REQUIRED',
      redirectTo: '/compliance/check',
    },
  );
}
