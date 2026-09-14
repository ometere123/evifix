import { GATE_ADDRESS, TARGET_ADDRESS, getWriteClient, readClient, waitForAcceptedOrFinalized } from "./client";
import type { ProposalSummary } from "../types";

function gate(): `0x${string}` {
  if (!GATE_ADDRESS) throw new Error("VITE_EVIFIX_GATE_ADDRESS is not configured");
  return GATE_ADDRESS;
}

function target(): `0x${string}` {
  if (!TARGET_ADDRESS) throw new Error("VITE_EVIFIX_TARGET_ADDRESS is not configured");
  return TARGET_ADDRESS;
}

async function readWithTimeout<T>(label: string, fn: () => Promise<T>, timeoutMs = 45_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readGate<T>(functionName: string, args: unknown[] = []) {
  return readWithTimeout(functionName, async () => {
    const value = await readClient.readContract({
      address: gate(),
      functionName,
      args: args as any[],
    });
    return value as unknown as T;
  });
}

async function write(address: `0x${string}`, functionName: string, args: unknown[]) {
  const client = getWriteClient();
  const hash = await client.writeContract({
    address,
    functionName,
    args: args as any[],
    value: 0n,
  }) as `0x${string}`;
  const receipt = await waitForAcceptedOrFinalized(hash);
  return { hash, status: receipt.status };
}

export const reads = {
  proposalCount: () => readGate<bigint>("get_proposal_count"),
  activeProposal: (targetAddress = target()) => readGate<bigint>("get_active_proposal", [targetAddress]),
  currentVersion: (targetAddress = target()) => readGate<string>("get_current_version", [targetAddress]),
  currentCodeHash: (targetAddress = target()) => readGate<string>("get_current_code_hash", [targetAddress]),
  policyFingerprint: (targetAddress = target()) => readGate<string>("get_policy_fingerprint", [targetAddress]),
  proposalSummary: async (proposalId: number | bigint): Promise<ProposalSummary> => {
    const raw = await readGate<string>("get_proposal_summary", [BigInt(proposalId)]);
    return JSON.parse(raw) as ProposalSummary;
  },
};

export const writes = {
  createProposal: (input: {
    targetAddress?: string;
    candidateVersion: string;
    candidateSourceUrl: string;
    candidateCode: string;
    ciEvidenceUrl: string;
    ciEvidenceId: string;
    auditEvidenceUrl: string;
    auditEvidenceId: string;
  }) => write(gate(), "create_proposal", [
    input.targetAddress ?? target(),
    input.candidateVersion,
    input.candidateSourceUrl,
    new TextEncoder().encode(input.candidateCode),
    input.ciEvidenceUrl,
    input.ciEvidenceId,
    input.auditEvidenceUrl,
    input.auditEvidenceId,
  ]),
  reviewProposal: (proposalId: number | bigint) => write(gate(), "review_proposal", [BigInt(proposalId)]),
  cancelProposal: (proposalId: number | bigint) => write(gate(), "cancel_proposal", [BigInt(proposalId)]),
  expireProposal: (proposalId: number | bigint) => write(gate(), "expire_proposal", [BigInt(proposalId)]),
  reconcileInstall: (proposalId: number | bigint) => write(gate(), "reconcile_install", [BigInt(proposalId)]),
  markExecutionTimeout: (proposalId: number | bigint) => write(gate(), "mark_execution_timeout", [BigInt(proposalId)]),
  repairEvidence: (input: {
    proposalId: number | bigint;
    candidateSourceUrl: string;
    ciEvidenceUrl: string;
    ciEvidenceId: string;
    auditEvidenceUrl: string;
    auditEvidenceId: string;
  }) => write(gate(), "repair_evidence", [
    BigInt(input.proposalId),
    input.candidateSourceUrl,
    input.ciEvidenceUrl,
    input.ciEvidenceId,
    input.auditEvidenceUrl,
    input.auditEvidenceId,
  ]),
  registerTarget: (input: {
    constitution: string;
    sourceAuthority: string;
    ciAuthority: string;
    auditAuthority: string;
    sourcePrefix: string;
    ciPrefix: string;
    auditPrefix: string;
    currentVersion: string;
    currentSourceUrl: string;
    currentCodeHash: string;
    maxEvidenceAgeSeconds: number;
    proposalTtlSeconds: number;
    executionTimeoutSeconds: number;
  }) => write(target(), "register_with_evifix", [
    input.constitution,
    input.sourceAuthority,
    input.ciAuthority,
    input.auditAuthority,
    input.sourcePrefix,
    input.ciPrefix,
    input.auditPrefix,
    input.currentVersion,
    input.currentSourceUrl,
    input.currentCodeHash,
    input.maxEvidenceAgeSeconds,
    input.proposalTtlSeconds,
    input.executionTimeoutSeconds,
  ]),
};
