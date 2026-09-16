# EviFix submission summary

## One-line description

EviFix is an invariant-bound semantic patching protocol that lets Intelligent Contracts accept only patches whose observed semantic delta matches declared and permitted scope, preserves every registered invariant, and carries a finalized baseline-bound receipt.

## GenLayer fit

EviFix uses Intelligent Consensus for a problem deterministic smart contracts cannot solve alone: determining the semantic behaviour change between two arbitrary program versions and adjudicating target-specific natural-language invariants.

An optional GEN reward escrow makes that adjudication consequential without moving arithmetic into the model: the sponsor funds a capsule, and deterministic code releases the exact amount only after finalized target activation, or refunds it on a terminal non-verified outcome.

The contract does not outsource authorization to an LLM. Deterministic code verifies exact source/evidence bindings, derives scope violations from schema-constrained semantic outputs, and requires independent validator agreement before a receipt can exist.

## Distinguishing mechanisms

- verified baseline generations;
- immutable patch capsules with declared intent;
- declared-vs-observed semantic delta enforcement;
- target-specific invariant profiles;
- generic typed evidence policies rather than fixed CI/audit roles;
- evidence epochs with byte-identical reroll prevention;
- first-class `INCONCLUSIVE` outcomes;
- finalized patch receipts rather than a generic authorization flag;
- target-side exact-byte hashing and receipt verification;
- finality-backed baseline continuity after activation.

## Demo path

1. show target at baseline generation 0;
2. open a capsule declaring a liveness-only change;
3. attach a valid evidence epoch;
4. review a safe fixture where the observed delta stays in scope and show `RECEIPT_ISSUED`;
5. show receipt binding values;
6. activate and show generation advance to 1;
7. open an adversarial capsule or run a fail-closed fixture where upgrade authority/authorization changes unexpectedly;
8. show the observed delta and terminal rejection or an inconclusive case that requires a fresh evidence epoch.

The gate, protected target and deterministic escrow are deployed on Studionet 61999, and the production frontend is
available at https://evifix.vercel.app. See `docs/LIVE_EVIDENCE.md` for the exact addresses, source hashes and finalized
deployment transactions. Lifecycle claims remain limited to states actually observed there.
