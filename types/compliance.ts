export type CompliancePhase = 'off' | 'soft' | 'hard_core' | 'hard_all';

export type Jurisdiction = 'eea_uk' | 'rest_of_world' | 'unknown';

export type ComplianceScope = 'eea_uk';

export type ComplianceMissingField =
  | 'terms_accepted'
  | 'privacy_notice_acknowledged'
  | 'contract_basis_confirmed'
  | 'compliance_completed'
  | 'policy_version_mismatch';

export interface ComplianceStatusResponse {
  phase: CompliancePhase;
  scope: ComplianceScope;
  policyVersion: string;
  countryCode: string | null;
  jurisdiction: Jurisdiction;
  required: boolean;
  completed: boolean;
  missingRequired: ComplianceMissingField[];
  termsAcceptedAt: string | null;
  privacyNoticeAcknowledgedAt: string | null;
  contractBasisConfirmedAt: string | null;
  complianceCompletedAt: string | null;
  analyticsOptIn: boolean;
  marketingOptIn: boolean;
}

export interface ComplianceAcceptRequest {
  termsAccepted: boolean;
  privacyNoticeAcknowledged: boolean;
  analyticsOptIn?: boolean;
  marketingOptIn?: boolean;
}

export interface ComplianceAcceptResponse {
  accepted: true;
  status: ComplianceStatusResponse;
}

export interface ComplianceConsentsRequest {
  analyticsOptIn?: boolean;
  marketingOptIn?: boolean;
}

export interface ComplianceConsentsResponse {
  updated: true;
  status: ComplianceStatusResponse;
}