import { describe, expect, it } from 'vitest';
import {
  isComplianceCompleted,
  isJurisdictionInScope,
  listMissingComplianceFields,
  parseCompliancePhase,
  resolveJurisdictionFromCountry,
  shouldBlockEndpoint,
} from '@/lib/compliance/rules';

describe('compliance rules', () => {
  it('maps EEA countries to eea_uk jurisdiction', () => {
    expect(resolveJurisdictionFromCountry('NL')).toBe('eea_uk');
    expect(resolveJurisdictionFromCountry('GB')).toBe('eea_uk');
    expect(resolveJurisdictionFromCountry('US')).toBe('rest_of_world');
    expect(resolveJurisdictionFromCountry(null)).toBe('unknown');
  });

  it('identifies missing required compliance fields', () => {
    const missing = listMissingComplianceFields(null, '2026-03-04');
    expect(missing).toContain('terms_accepted');
    expect(missing).toContain('privacy_notice_acknowledged');
    expect(missing).toContain('policy_version_mismatch');
  });

  it('treats completed profile as compliant for current policy version', () => {
    const now = new Date().toISOString();
    const profile = {
      policy_version: '2026-03-04',
      terms_accepted_at: now,
      privacy_notice_acknowledged_at: now,
      contract_basis_confirmed_at: now,
      compliance_completed_at: now,
    };

    expect(isComplianceCompleted(profile, '2026-03-04')).toBe(true);
    expect(isComplianceCompleted(profile, '2026-04-01')).toBe(false);
  });

  it('evaluates endpoint blocking by phase', () => {
    expect(parseCompliancePhase('off')).toBe('off');
    expect(parseCompliancePhase('hard_all')).toBe('hard_all');
    expect(parseCompliancePhase('unknown')).toBe('soft');

    expect(shouldBlockEndpoint('soft', 'pitch-run')).toBe(false);
    expect(shouldBlockEndpoint('hard_core', 'pitch-run')).toBe(true);
    expect(shouldBlockEndpoint('hard_core', 'miro-fix-board')).toBe(false);
    expect(shouldBlockEndpoint('hard_all', 'miro-fix-board')).toBe(true);
  });

  it('scope check only requires EEA/UK', () => {
    expect(isJurisdictionInScope('eea_uk', 'eea_uk')).toBe(true);
    expect(isJurisdictionInScope('eea_uk', 'rest_of_world')).toBe(false);
  });
});