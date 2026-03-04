import type {
  ComplianceMissingField,
  CompliancePhase,
  ComplianceScope,
  Jurisdiction,
} from '@/types/compliance';

export interface ComplianceProfileLike {
  jurisdiction?: Jurisdiction | string | null;
  policy_version?: string | null;
  terms_accepted_at?: string | null;
  privacy_notice_acknowledged_at?: string | null;
  contract_basis_confirmed_at?: string | null;
  compliance_completed_at?: string | null;
  analytics_opt_in?: boolean | null;
  marketing_opt_in?: boolean | null;
  ip_country?: string | null;
}

export const DEFAULT_COMPLIANCE_SCOPE: ComplianceScope = 'eea_uk';
export const DEFAULT_COMPLIANCE_PHASE: CompliancePhase = 'soft';
export const DEFAULT_POLICY_VERSION = '2026-03-04';

export const HARD_CORE_ENDPOINTS = new Set([
  'pitch-run',
  'deck-upload',
  'qna-session',
]);

export const EEA_UK_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
  'GB', 'UK',
]);

export function parseCompliancePhase(value: string | undefined | null): CompliancePhase {
  if (value === 'off' || value === 'soft' || value === 'hard_core' || value === 'hard_all') {
    return value;
  }
  return DEFAULT_COMPLIANCE_PHASE;
}

export function parseComplianceScope(value: string | undefined | null): ComplianceScope {
  if (value === 'eea_uk') return value;
  return DEFAULT_COMPLIANCE_SCOPE;
}

export function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const upper = value.trim().toUpperCase();
  if (upper.length !== 2) return null;
  return upper;
}

export function resolveJurisdictionFromCountry(countryCode: string | null | undefined): Jurisdiction {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) return 'unknown';
  return EEA_UK_COUNTRY_CODES.has(normalized) ? 'eea_uk' : 'rest_of_world';
}

export function isJurisdictionInScope(scope: ComplianceScope, jurisdiction: Jurisdiction): boolean {
  if (scope === 'eea_uk') return jurisdiction === 'eea_uk';
  return false;
}

export function listMissingComplianceFields(
  profile: ComplianceProfileLike | null | undefined,
  requiredPolicyVersion: string,
): ComplianceMissingField[] {
  if (!profile) {
    return [
      'terms_accepted',
      'privacy_notice_acknowledged',
      'contract_basis_confirmed',
      'compliance_completed',
      'policy_version_mismatch',
    ];
  }

  const missing: ComplianceMissingField[] = [];

  if (!profile.terms_accepted_at) missing.push('terms_accepted');
  if (!profile.privacy_notice_acknowledged_at) missing.push('privacy_notice_acknowledged');
  if (!profile.contract_basis_confirmed_at) missing.push('contract_basis_confirmed');
  if (!profile.compliance_completed_at) missing.push('compliance_completed');

  const currentVersion = typeof profile.policy_version === 'string' ? profile.policy_version : null;
  if (currentVersion !== requiredPolicyVersion) {
    missing.push('policy_version_mismatch');
  }

  return missing;
}

export function isComplianceCompleted(
  profile: ComplianceProfileLike | null | undefined,
  requiredPolicyVersion: string,
): boolean {
  return listMissingComplianceFields(profile, requiredPolicyVersion).length === 0;
}

export function shouldBlockEndpoint(
  phase: CompliancePhase,
  endpointName: string,
): boolean {
  if (phase === 'off' || phase === 'soft') return false;
  if (phase === 'hard_core') return HARD_CORE_ENDPOINTS.has(endpointName);
  return phase === 'hard_all';
}