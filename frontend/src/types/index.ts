export type ProposalStatus =
  | "PROPOSED"
  | "EVIDENCE_REPAIR_REQUIRED"
  | "REVIEW_RETRY_REQUIRED"
  | "INCONCLUSIVE"
  | "REJECTED"
  | "UPGRADE_QUEUED"
  | "VERIFIED"
  | "EXPIRED"
  | "CANCELLED"
  | "EXECUTION_FAILED"
  | "UNKNOWN";

export interface ProposalSummary {
  proposal_id: number;
  target: string;
  parent_version: string;
  parent_code_hash: string;
  candidate_version: string;
  candidate_code_hash: string;
  policy_fingerprint: string;
  evidence_set_hash: string;
  review_digest: string;
  status: ProposalStatus;
  decision: string;
  last_review_code: string;
  created_at: number;
  expires_at: number;
  reviewed_at: number;
  execution_deadline: number;
}

export interface TransactionRecord {
  hash: string;
  action: string;
  status: string;
  createdAt: number;
}
