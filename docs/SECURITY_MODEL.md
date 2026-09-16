# EviFix security model

## Security goals

EviFix protects semantic continuity across Intelligent Contract code replacement.

## Escrow boundary

The optional `EviFixEscrow` contract makes the finalized semantic outcome financially consequential without moving arithmetic into the model. It accepts exact native GEN funding for one gate/capsule pair, binds the beneficiary to the capsule opener, releases only for finalized `VERIFIED`, and refunds only for a finalized failure or an expired pending capsule. The GenLayer review and network appeal process is the contest boundary; escrow cannot be released against a non-verified gate state.

Its conservation invariant is `total_funded = total_released + total_refunded + total_unsettled`. Each escrow is terminal exactly once, and accounting is updated before transfer emission.

The protocol aims to ensure that an activated patch is the exact candidate that was reviewed, extends the exact currently verified baseline, stays within the target's permitted change envelope, preserves every registered invariant, is backed by independently published evidence, and activates only through a finalized receipt.

## Authorization conditions

A receipt can be issued only when all of the following hold:

- target profile exists and is active;
- capsule profile hash and baseline generation still match the target;
- baseline source bytes hash to the anchored baseline SHA-256;
- candidate source bytes hash to the frozen candidate SHA-256;
- frozen candidate bytes still hash to the same candidate SHA-256;
- evidence manifest is immutable and published by an approved authority;
- every required typed claim is present;
- claim artifacts match their manifest hashes and exact capsule bindings;
- independent-issuer threshold is satisfied;
- an independent-review publisher has a GitHub owner different from the source publisher;
- evidence is fresh and not expired;
- the evidence epoch is not byte-identical to the prior reviewed epoch;
- leader and validators independently reproduce the same evidence result, semantic delta, invariant decisions and authorization hashes;
- no observed known change is forbidden;
- every observed known change was declared;
- every observed known change is permitted;
- every invariant is `PASS`;
- evidence semantics are `PASS`;
- no semantic delta dimension is `INCONCLUSIVE`.

## First-class uncertainty

`INCONCLUSIVE` is not normalized into rejection or approval.

A capsule remains active but cannot be reviewed again against the same evidence. The owner must attach a fresh immutable evidence epoch. If its bytes are identical to the prior evidence bundle, EviFix returns repair-required instead of giving the LLM another chance to produce a favourable answer.

## Prompt injection boundary

Source, invariant text, declared intent and evidence summaries are explicitly labelled untrusted data. Neither semantic stage accepts natural-language instructions from these regions as control instructions. Authorization is derived by deterministic contract logic from schema-constrained semantic outputs.

## Evidence trust

Evidence publishers are not treated as universal truth authorities. They attest only typed claims registered in the target's evidence policy. EviFix independently verifies artifact immutability, hashing, bindings, freshness, issuer namespace and issuer diversity.

An evidence claim returning `PASS` does not itself authorize the patch. It is one input into semantic review and invariant adjudication.

## Finality boundary

Review success creates a receipt and emits patch delivery only on GenLayer finality. The target re-hashes candidate bytes before replacement. Gate-side baseline advancement occurs only after a finalized target attestation is visible through `LATEST_FINAL`.

## Replay resistance

- a target has only one active capsule;
- candidate hashes already activated for a target cannot be reopened;
- immutable evidence manifest URLs cannot be reused for the same target;
- every manifest and claim is bound to capsule id, baseline, candidate and profile;
- receipts are bound to one capsule, target and baseline generation;
- a consumed receipt is no longer valid;
- a receipt that exceeds its activation deadline fails verification.

## Failure model

Repair-required failures cover malformed, stale, mismatched or unavailable deterministic evidence that needs replacement.

Retry-required failures cover transient fetch/LLM failures and schema-invalid model responses. Retrying these does not change evidence or candidate identity.

Semantic uncertainty becomes `INCONCLUSIVE` and requires a new evidence epoch.

Known envelope violations become terminal `REJECTED`.

Activation that never changes the target before the deadline may become `ACTIVATION_FAILED`, but only after final/non-final state proves the baseline did not advance.
