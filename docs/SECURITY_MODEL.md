# EviFix security model

## Security goals

EviFix is built to fail closed when evidence, semantics, consensus, finality, or installation state is uncertain.

### Candidate immutability

The exact candidate bytes are stored when a proposal is created and hashed with SHA-256. Evidence repair may replace evidence locations and IDs but may not replace those bytes.

### Immutable provenance

Source and evidence URLs must use canonical raw GitHub paths with a forty-character lowercase commit SHA. Branch names, path aliases, encoded path tricks, empty path segments, and non-canonical segments are rejected.

### Independent audit

Source, CI, and audit authorities are distinct. The audit repository publisher must be different from both source and CI publishers.

### Evidence replay resistance

Evidence IDs are reserved under target, issuer, and evidence-kind scope. Cancellation or rejection does not make an identifier reusable.

### Tri-state semantics

Uncertainty is represented explicitly rather than being coerced to a boolean. `INCONCLUSIVE` cannot authorize code installation.

### Validator agreement

Validators rerun the same evidence fetch, binding checks, and semantic review. The validator accepts only an exact match across all authorization-driving outputs.

### Finality

An approved review queues the upgrade. The cross-contract installation message is emitted only when the review transaction reaches finality.

### Installation parity

The target requests the frozen candidate from the gate, re-hashes it, and compares that digest with the approved digest immediately before changing its code slot.

### Recovery

Evidence errors are repairable, transient infrastructure failures are retryable, stale proposals expire, and stalled installations have reconciliation and timeout paths. Timeout logic inspects finalized and non-final attestation state before releasing a slot.

## Explicit trust assumptions

EviFix does not claim that a CI publisher or auditor is inherently truthful. The registered policy chooses those authorities. The contract proves that the evidence presented is bound to those configured authorities, to immutable commits, and to the exact candidate under review.

The first target registration must also be paired with an operator check that the registered source hash represents the deployed starting contract. That deployment-parity evidence belongs in the live evidence record.
