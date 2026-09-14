# EviFix architecture

## Purpose

EviFix separates byte integrity, evidence provenance, semantic authorization, protocol finality, and installation verification. None of those layers may impersonate another.

```text
protected target
  -> immutable EviFix policy
  -> exact candidate bytes + SHA-256
  -> immutable source commit
  -> CI evidence envelope
  -> independent audit evidence envelope
  -> leader evidence verification + semantic review
  -> validator independent reproduction
  -> exact agreement on bindings and tri-state semantic vector
  -> all PASS only
  -> parent transaction finalizes
  -> target re-checks authorization and candidate bytes
  -> code replacement
  -> finalized installation confirmation
  -> VERIFIED
```

## Contracts

### `EviFixGate`

The gate stores immutable target policies, proposals, evidence replay reservations, installed candidate hashes, lifecycle state, and review digests. It exposes no self-upgrade path.

A policy binds three distinct evidence roles, immutable raw GitHub repository prefixes, the current version/source/hash, and bounded evidence/proposal/execution windows.

### Protected target

The target installs the EviFix gate as its sole GenVM upgrader. The owner is intentionally not added to `root.upgraders`.

Before code replacement the target asks the gate whether the exact proposal/hash is still authorized, fetches the exact frozen candidate bytes from the gate, re-hashes them, and persists the proposal/hash attestation. Installation confirmation is finality-bound.

## Consensus boundary

Only evidence retrieval and irreducibly semantic analysis run inside nondeterminism. No storage mutation or irreversible message is performed inside that block.

Leader and validators independently reproduce:

- target and proposal ID;
- parent and candidate SHA-256 values;
- policy fingerprint;
- evidence-set fingerprint;
- result kind and error code;
- overall decision;
- every tri-state semantic field.

Reasoning prose is not an authorization input.

## Semantic vector

Each field is one of `PASS`, `FAIL`, or `INCONCLUSIVE`:

1. storage layout
2. authorization surface
3. user rights
4. upgrade authority
5. external-call safety
6. value flow
7. evidence integrity
8. consensus semantics
9. finality safety
10. liveness and recovery
11. change scope
12. constitution satisfaction

One `FAIL` rejects the proposal. With no failures, one `INCONCLUSIVE` blocks it. Only twelve `PASS` values produce `APPROVE`.

## Anti-grinding rule

An `INCONCLUSIVE` proposal cannot simply invoke semantic review again. The owner must replace evidence with fresh immutable URLs and new evidence IDs. Candidate bytes, candidate hash, parent binding, target, and policy fingerprint stay frozen.

## Frontend state model

The interface separates:

- submission hash;
- consensus status;
- rollback/execution result;
- proposal lifecycle state;
- final installation state.

A transaction is never shown as successful solely because a hash was returned. Polling runs at a three-second interval and rollback payloads are surfaced to the user.
