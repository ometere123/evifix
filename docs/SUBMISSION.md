# EviFix submission handoff

## Product statement

EviFix is an evidence-bound semantic upgrade gate for GenLayer Intelligent Contracts. It prevents a replacement contract from becoming live code unless exact candidate bytes, immutable provenance, CI evidence, independent audit evidence, tri-state validator review, finality, and post-install attestation all agree.

## GenLayer-native fit

EviFix needs GenLayer for three core reasons:

- semantic source-to-source safety review is not reducible to ordinary deterministic checks;
- leader and validators independently retrieve evidence and reproduce the consequential review result;
- installation is intentionally tied to GenLayer finality rather than an early transaction status.

The GenLayer component is therefore on the critical execution path, not a decorative AI call.

## Reviewer path

1. Inspect `contracts/evifix_gate.py` and `contracts/evifix_target_v1.py`.
2. Inspect `tests/direct/` for lifecycle, evidence, anti-grinding, and adversarial cases.
3. Read `docs/ARCHITECTURE.md` and `docs/SECURITY_MODEL.md`.
4. Confirm the frontend network lock displays Studionet chain ID 61999 and reads no fabricated deployment state.
5. After deployment, use `docs/LIVE_EVIDENCE.md` for addresses, finalized transactions, hashes, and the completed upgrade lifecycle.

## Engineering gates

A review-ready commit should have:

- GenVM lint/type/schema checks passing;
- Direct Mode tests passing;
- adversarial fixture checks passing;
- frontend TypeScript/build passing;
- final source hashes recorded;
- deployed source parity checked;
- target registration finalized;
- at least one complete safe-candidate lifecycle demonstrated;
- live evidence recorded from the final commit.
