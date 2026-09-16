import { ESCROW_ADDRESS, GATE_ADDRESS, TARGET_ADDRESS, assertStudionetBeforeWrite, getWriteClient, readClient, waitForAcceptedOrFinalized } from "./client";
import type { CapsuleSummary, Escrow } from "../types";

function gate(): `0x${string}` {
  if (!GATE_ADDRESS) throw new Error("VITE_EVIFIX_GATE_ADDRESS is not configured");
  return GATE_ADDRESS;
}

function target(): `0x${string}` {
  if (!TARGET_ADDRESS) throw new Error("VITE_EVIFIX_TARGET_ADDRESS is not configured");
  return TARGET_ADDRESS;
}

function escrow(): `0x${string}` {
  if (!ESCROW_ADDRESS) throw new Error("VITE_EVIFIX_ESCROW_ADDRESS is not configured");
  return ESCROW_ADDRESS;
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

async function write(address: `0x${string}`, functionName: string, args: unknown[], value = 0n) {
  await assertStudionetBeforeWrite();
  const client = getWriteClient();
  const hash = await client.writeContract({
    address,
    functionName,
    args: args as any[],
    value,
  }) as `0x${string}`;
  const receipt = await waitForAcceptedOrFinalized(hash);
  return { hash, status: receipt.status };
}

export const reads = {
  capsuleCount: () => readGate<bigint>("get_capsule_count"),
  activeCapsule: (targetAddress = target()) => readGate<bigint>("get_active_capsule", [targetAddress]),
  baselineVersion: (targetAddress = target()) => readGate<string>("get_baseline_version", [targetAddress]),
  baselineHash: (targetAddress = target()) => readGate<string>("get_baseline_hash", [targetAddress]),
  profileHash: (targetAddress = target()) => readGate<string>("get_profile_hash", [targetAddress]),
  generation: (targetAddress = target()) => readGate<bigint>("get_generation", [targetAddress]),
  capsuleSummary: async (capsuleId: number | bigint): Promise<CapsuleSummary> => {
    const raw = await readGate<string>("get_capsule_summary", [BigInt(capsuleId)]);
    return JSON.parse(raw) as CapsuleSummary;
  },
  escrowForCapsule: (capsuleId: number | bigint) => readWithTimeout("get_escrow_for_capsule", async () => {
    return await readClient.readContract({ address: escrow(), functionName: "get_escrow_for_capsule", args: [gate(), BigInt(capsuleId)] }) as unknown as bigint;
  }),
  escrow: (escrowId: number | bigint): Promise<Escrow> => readWithTimeout("get_escrow", async () => {
    return await readClient.readContract({ address: escrow(), functionName: "get_escrow", args: [BigInt(escrowId)] }) as unknown as Escrow;
  }),
};

export const writes = {
  openPatchCapsule: (input: {
    targetAddress?: string;
    candidateVersion: string;
    candidateSourceUrl: string;
    candidateCode: string;
    declaredIntent: string;
    declaredDomains: string[];
  }) => write(gate(), "open_patch_capsule", [
    input.targetAddress ?? target(),
    input.candidateVersion,
    input.candidateSourceUrl,
    new TextEncoder().encode(input.candidateCode),
    input.declaredIntent,
    JSON.stringify(input.declaredDomains),
  ]),
  submitEvidenceEpoch: (capsuleId: number | bigint, manifestUrl: string) =>
    write(gate(), "submit_evidence_epoch", [BigInt(capsuleId), manifestUrl]),
  reviewCapsule: (capsuleId: number | bigint) => write(gate(), "review_capsule", [BigInt(capsuleId)]),
  cancelCapsule: (capsuleId: number | bigint) => write(gate(), "cancel_capsule", [BigInt(capsuleId)]),
  expireCapsule: (capsuleId: number | bigint) => write(gate(), "expire_capsule", [BigInt(capsuleId)]),
  reconcileActivation: (capsuleId: number | bigint) => write(gate(), "reconcile_activation", [BigInt(capsuleId)]),
  markActivationTimeout: (capsuleId: number | bigint) => write(gate(), "mark_activation_timeout", [BigInt(capsuleId)]),
  enrolTarget: (input: {
    invariantProfileJson: string;
    sourcePrefix: string;
    evidencePolicyJson: string;
    baselineVersion: string;
    baselineSourceUrl: string;
    baselineCodeHash: string;
    maxEvidenceAgeSeconds: number;
    capsuleTtlSeconds: number;
    activationTimeoutSeconds: number;
  }) => write(target(), "enrol_with_evifix", [
    input.invariantProfileJson,
    input.sourcePrefix,
    input.evidencePolicyJson,
    input.baselineVersion,
    input.baselineSourceUrl,
    input.baselineCodeHash,
    input.maxEvidenceAgeSeconds,
    input.capsuleTtlSeconds,
    input.activationTimeoutSeconds,
  ]),
  fundPatch: (capsuleId: number | bigint, beneficiary: string, claimAfter: number | bigint, amount: bigint) =>
    write(escrow(), "fund_patch", [gate(), BigInt(capsuleId), beneficiary, BigInt(claimAfter)], amount),
  releasePatch: (escrowId: number | bigint) => write(escrow(), "release_patch", [BigInt(escrowId)]),
  refundPatch: (escrowId: number | bigint) => write(escrow(), "refund_patch", [BigInt(escrowId)]),
};
