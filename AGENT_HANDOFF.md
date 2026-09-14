# EviFix Codex handoff

Finish EviFix completely from this repository. Do not redesign the product, rename it, move it to another network, or weaken the security invariants.

## Non-negotiable network requirement

All deployments, reads, writes, wallet switching, transaction checks, and evidence collection must use:

- network: **GenLayer Studionet**
- chain ID: **61999**
- hexadecimal chain ID: **0xF22F**
- RPC: `https://studio.genlayer.com/api`
- explorer: `https://explorer-studio.genlayer.com`

Do not substitute another chain configuration.

## Product invariants

Preserve these exact properties:

- `EviFixGate` has no self-upgrade path.
- The protected target has the EviFix gate as its sole GenVM upgrader; the owner is not an upgrader.
- Candidate bytes and candidate SHA-256 are frozen at proposal creation.
- Evidence repair cannot replace candidate bytes/hash.
- Audit publisher ownership is independent of both source and CI publishers.
- Evidence IDs are replay-resistant.
- Semantic values are `PASS`, `FAIL`, or `INCONCLUSIVE`.
- Any `FAIL` rejects; any remaining `INCONCLUSIVE` blocks; only all `PASS` values approve.
- An inconclusive review cannot simply be rerun with the same evidence. New evidence IDs are required.
- Validator reproduction must match every authorization-driving field exactly.
- The upgrade child call is finality-bound.
- The target re-hashes the frozen bytes before code replacement.
- Installation confirmation is finality-bound and reconcilable.
- Frontend success requires accepted/finalized consensus with no rollback; a transaction hash alone is not success.
- RPC polling remains throttled below the service rate limit.

## Finish sequence

1. Read `README.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY_MODEL.md`, `docs/SUBMISSION.md`, and both primary contracts in full.
2. Create a clean Python environment, install `requirements.txt`, run the full preflight, and fix every real failure without weakening tests.
3. In `frontend/`, install dependencies and run `npm run build`. Fix TypeScript/build errors without changing the product semantics.
4. Deploy `contracts/evifix_gate.py` to Studionet.
5. Deploy `contracts/evifix_target_v1.py` with the deployed gate address and sensible demonstration values.
6. From the final immutable GitHub commit, compute the exact target source SHA-256 and construct the immutable raw source URL.
7. Register the target policy through `register_with_evifix`. Use genuinely distinct source, CI, and audit authorities/repositories and wait for the registration consequence to finalize.
8. Put the real gate and target addresses in the frontend environment, run a production build, and deploy the frontend.
9. Produce real CI and independent-audit evidence envelopes from immutable commits. Do not invent PASS evidence. Their fields must match `evifix-evidence-v1` exactly.
10. Run a complete safe-candidate demonstration: create proposal, review it, track consensus and finality, observe the finality-bound target upgrade, and verify the finalized confirmation.
11. Exercise at least one fail-closed path, preferably an `INCONCLUSIVE` semantic review or the unsafe fixture, and record the result without attempting to force approval.
12. Fill `docs/LIVE_EVIDENCE.md` with real addresses, hashes, proposal state, transaction hashes, and source-parity evidence from this final deployment.
13. Re-run all contract tests and the frontend production build after documentation/environment changes.
14. Commit and push only a clean repository. Never commit private keys, seed phrases, funded-wallet secrets, or `.env` files.

## Completion standard

Do not return only a plan or checklist. The handoff is complete only when the code/tests/build are green, the contracts and frontend are deployed on the specified network, the safe lifecycle is evidenced end-to-end, and `docs/LIVE_EVIDENCE.md` contains real final values.
