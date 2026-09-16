# EviFix architecture

## Product primitive

EviFix is a semantic continuity protocol. The security question is not merely "is this replacement safe?" It is:

> Does this exact candidate extend the exact verified baseline while staying inside the target's declared and permitted semantic change envelope and preserving every registered invariant?

That question is represented directly in contract state.

## State objects

### Patch reward escrow

`EviFixEscrow` is a separate custody contract so financial state cannot weaken the gate's semantic state machine. A sponsor funds one gate/capsule pair with an exact native GEN value. The beneficiary is deterministically bound to the capsule opener. The escrow stores the gate, capsule, sponsor, beneficiary, amount, immutable activation deadline and terminal accounting. Release is allowed only when the gate reports `VERIFIED` and the claim window has opened. A finalized rejection, cancellation, expiry or activation failure refunds the sponsor; a still-pending capsule cannot be refunded until its activation deadline has expired. All accounting is updated before transfer emission.

### InvariantProfile

A target self-anchors one profile through a finality-bound call from the protected target. The profile stores:

- owner and target;
- profile hash;
- JSON invariant rules;
- permitted and forbidden semantic domains;
- source repository prefix;
- generic evidence policy;
- verified baseline version, immutable source URL and SHA-256;
- evidence age, capsule TTL and activation timeout;
- baseline generation.

The gate does not expose a profile mutation path. The target therefore cannot quietly relax rules after opening a capsule.

### PatchCapsule

A capsule freezes:

- baseline generation/version/source/hash;
- candidate version/source/exact bytes/hash;
- developer-declared intent;
- declared semantic domains;
- profile hash;
- evidence epoch state;
- review hashes;
- receipt state;
- lifecycle deadlines.

Only one active capsule is allowed per target.

### Evidence epoch

Evidence is not embedded as fixed CI/audit roles. A profile registers approved evidence publishers and required claim types. A capsule attaches one immutable evidence manifest per epoch.

The manifest contains typed claim descriptors. Each descriptor points to an immutable artifact whose SHA-256 is checked before the artifact is parsed. Artifacts are bound to the exact capsule, target, baseline, candidate and profile.

An inconclusive or repair-required capsule may advance to a new evidence epoch. The candidate and baseline remain frozen. If the new manifest resolves to byte-identical evidence, review returns `EVIDENCE_EPOCH_UNCHANGED` rather than allowing another semantic roll.

### Semantic delta

The first Intelligent Consensus stage classifies each domain as:

- `UNCHANGED`
- `ADDED`
- `REMOVED`
- `RELAXED`
- `TIGHTENED`
- `MUTATED`
- `INCONCLUSIVE`

Domains are storage, authorization, user rights, upgrade authority, external calls, value flow, evidence, consensus, finality, liveness and interface.

The gate then performs deterministic scope enforcement:

1. any known changed domain in `forbidden_domains` => reject;
2. any known changed domain not declared => reject;
3. any known changed domain not permitted => reject;
4. any semantically inconclusive domain => overall inconclusive unless an independent terminal violation already exists.

### Invariant adjudication

The second Intelligent Consensus stage evaluates every target-specific invariant rule and evidence semantics as `PASS`, `FAIL` or `INCONCLUSIVE`.

The contract derives the overall outcome. The model is not trusted to choose the final authorization state.

### PatchReceipt

A receipt is minted only after an all-pass decision. Its hash binds:

- capsule id and target;
- baseline hash;
- candidate hash;
- invariant profile hash;
- semantic delta hash;
- evidence bundle hash and epoch;
- decision hash.

Receipt state is `ISSUED` or `CONSUMED`.

## Target handshake

Candidate bytes are delivered only with the finalized patch receipt, and the target verifies the bound receipt before installation.

On approval, the gate emits a finality-bound `apply_evifix_patch(...)` call carrying:

- capsule id;
- receipt hash;
- baseline hash;
- candidate hash;
- exact candidate bytes.

The target:

1. requires the gate as sender;
2. requires its local baseline to equal the receipt baseline;
3. hashes the delivered candidate bytes;
4. verifies the receipt through `verify_patch_receipt`;
5. advances its local baseline attestation and generation;
6. replaces code;
7. emits a finalized `record_activation(...)` attestation.

The gate advances its verified baseline only after checking the target's `LATEST_FINAL` state.

## Recovery

`reconcile_activation` repairs the case where target activation finalized but the callback did not update the gate.

`mark_activation_timeout` can release an expired receipt only if final and non-final target attestations agree that the baseline did not advance. Any divergence keeps the capsule locked.

Escrow recovery is similarly bounded: a funded escrow can settle once only. A verified capsule has a beneficiary-only release path; a non-verified terminal capsule has a sponsor-only refund path. No frontend or arbitrary caller can choose the financial outcome.

## Upgrade authority

The protected target appends only the EviFix gate to GenVM upgraders. The owner is deliberately not a code upgrader. The EviFix gate itself has no self-upgrade entry point and never appends itself or another address to its own upgrader set.
