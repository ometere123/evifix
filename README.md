# EviFix

EviFix is an invariant-bound semantic patching protocol for GenLayer Intelligent Contracts.

Instead of asking only whether a replacement contract appears safe, EviFix binds every patch to a verified baseline, a declared change intent, a target-specific invariant profile, and a typed evidence epoch. Validators first derive the semantic delta they actually observe. The protocol then compares that observed delta with what the developer declared and what the target profile permits. Only a patch that remains inside the invariant envelope can receive a finalized patch receipt.

## Network lock

EviFix is built for **GenLayer Studionet** only.

- chain ID: **61999**
- chain hex: **0xF22F**
- RPC: `https://studio.genlayer.com/api`
- explorer: `https://explorer-studio.genlayer.com`

Do not deploy this repository to another network without an explicit project decision and corresponding test changes.

## Core model

The protocol has five first-class objects:

1. **InvariantProfile** — immutable target rules, permitted/forbidden semantic domains, evidence policy, and baseline configuration.
2. **PatchCapsule** — exact candidate bytes + SHA-256, immutable candidate source, declared intent, declared domains, and the baseline generation it extends.
3. **Evidence epoch** — a fresh immutable bundle of typed claims. An inconclusive review cannot be rerolled against byte-identical evidence.
4. **Semantic delta** — validator-derived classification of what actually changed in storage, authorization, user rights, upgrade authority, external calls, value flow, evidence, consensus, finality, liveness, and interface.
5. **PatchReceipt** — authorization bound to the target, baseline, candidate, invariant profile, semantic delta, evidence bundle and evidence epoch.

6. **Patch reward escrow** — an optional deterministic GEN escrow binds a sponsor's reward to one capsule. The capsule opener is the beneficiary; release requires finalized `VERIFIED` activation, while rejection, cancellation, expiry or activation failure can refund the sponsor. The escrow never interprets source text or selects a payout.

A successful activation advances the target's verified baseline generation. The next patch must extend that exact baseline.

## Why this is fail-closed

A patch cannot be authorized when:

- candidate bytes differ from the immutable candidate source;
- the baseline source no longer hashes to the anchored baseline;
- the observed semantic delta contains a forbidden domain;
- the observed delta contains an undeclared change;
- the observed delta falls outside permitted domains;
- any invariant is `FAIL`;
- any required semantic conclusion is `INCONCLUSIVE`;
- a required evidence claim is missing, stale, malformed, unbound, unpublished by an approved authority, or not `PASS`;
- the independent-review claim comes from the same GitHub owner as the source publisher;
- a supposedly fresh evidence epoch is byte-identical to the previous one;
- validators do not exactly agree on all authorization-driving outputs;
- the receipt does not match the target's current verified baseline;
- receipt activation has expired;
- the target receives candidate bytes whose SHA-256 differs from the receipt.

## Evidence policy

EviFix does not hard-code a source/CI/audit triangle. A target registers a generic evidence policy with approved immutable publishers, required typed claims, and a minimum independent-issuer threshold.

At minimum, the current protocol requires:

- `BUILD_RESULT`
- `TEST_RESULT`
- `INDEPENDENT_REVIEW`

Additional supported claim types include schema compatibility, interface compatibility, adversarial testing and custom claims. Every claim artifact is independently hash-bound to its manifest entry and to the exact capsule, baseline, candidate and invariant profile.

See `evidence/examples/` for the canonical v2 shape.

## Patch flow

```text
anchor target + invariant profile
        ↓
verified baseline generation N
        ↓
open immutable patch capsule
        ↓
attach evidence epoch
        ↓
validators fetch exact baseline/candidate/evidence
        ↓
derive semantic delta
        ↓
compare observed vs declared vs permitted scope
        ↓
adjudicate every invariant
        ↓
PASS / REJECT / INCONCLUSIVE
        ↓
finalized patch receipt
        ↓
target verifies receipt + re-hashes delivered bytes
        ↓
code replacement
        ↓
finalized activation attestation
        ↓
verified baseline generation N + 1
```

## Escrow flow

```text
open capsule → sponsor funds exact capsule escrow
        ↓
GenLayer reviews source/evidence and may be appealed through consensus
        ↓
VERIFIED activation → beneficiary releases exact escrow
terminal non-verified outcome → sponsor refunds exact escrow
```

The economically consequential contest is the GenLayer review/appeal boundary: validators must agree on the semantic result before a receipt can reach `VERIFIED`. Deterministic escrow code only reads that finalized gate state and performs exact transfers. There is no client-side payout authority.

## Repository

- `contracts/evifix_gate.py` — invariant profile, patch capsule, evidence epoch, two-stage semantic review, receipt issuance and baseline reconciliation.
- `contracts/evifix_target_v1.py` — receipt-consuming protected target and target-side baseline continuity.
- `contracts/evifix_escrow.py` — deterministic GEN custody linked to finalized gate outcomes.
- `contracts/fixtures/` — compatible and adversarial candidate fixtures.
- `tests/direct/` — Direct Mode and source-level regression checks.
- `frontend/` — operator UI for profile anchoring, patch capsules, evidence epochs, review and activation recovery.
- `docs/ARCHITECTURE.md` — state machine and trust boundaries.
- `docs/SECURITY_MODEL.md` — authorization invariants and failure model.
- `docs/LIVE_EVIDENCE.md` — deployment and transaction evidence template. Do not fabricate it.
- `AGENT_HANDOFF.md` — exact live completion instructions for Codex.

## Local verification

```bash
python -m compileall -q contracts tests scripts
genvm-lint lint contracts/evifix_gate.py
genvm-lint lint contracts/evifix_target_v1.py
pytest tests/direct -q
cd frontend
npm ci --no-audit --no-fund
npm run lint
npm run typecheck
npm test
npm run build
```

The repository CI also verifies the Studionet 61999 lock.

## Deployment evidence

This repository intentionally does not contain invented contract addresses or transaction hashes. Deployment of the gate, protected target and optional escrow, real immutable evidence artifacts, the safe lifecycle and the fail-closed demonstration must be performed live on Studionet 61999 and recorded in `docs/LIVE_EVIDENCE.md`.
