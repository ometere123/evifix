export type CapsuleStatus =
  | "AWAITING_EVIDENCE"
  | "READY"
  | "EVIDENCE_REPAIR_REQUIRED"
  | "REVIEW_RETRY_REQUIRED"
  | "INCONCLUSIVE"
  | "REJECTED"
  | "RECEIPT_ISSUED"
  | "VERIFIED"
  | "EXPIRED"
  | "CANCELLED"
  | "ACTIVATION_FAILED"
  | "UNKNOWN";

export interface CapsuleSummary {
  capsule_id: number;
  target: string;
  baseline_generation: number;
  baseline_version: string;
  baseline_code_hash: string;
  candidate_version: string;
  candidate_code_hash: string;
  declared_intent: string;
  declared_domains: string[];
  profile_hash: string;
  evidence_epoch: number;
  evidence_bundle_hash: string;
  delta_hash: string;
  decision_hash: string;
  receipt_hash: string;
  status: CapsuleStatus;
  decision: string;
  last_review_code: string;
  created_at: number;
  expires_at: number;
  reviewed_at: number;
  activation_deadline: number;
}

export interface TransactionRecord {
  hash: string;
  action: string;
  status: string;
  createdAt: number;
}
