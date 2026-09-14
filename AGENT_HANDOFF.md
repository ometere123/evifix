# EviFix live completion handoff

Finish EviFix completely from this repository. Do not return only a plan, checklist, mock deployment, or fabricated evidence.

## Read first

Read these files in full before changing anything:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_MODEL.md`
- `docs/SUBMISSION.md`
- `docs/LIVE_EVIDENCE.md`
- `contracts/evifix_gate.py`
- `contracts/evifix_target_v1.py`
- `tests/direct/test_evifix_gate.py`

The v2 architecture is authoritative. Do not reintroduce the old proposal/governor/fixed source-CI-audit shape.

## Non-negotiable network

Use only:

- network: **GenLayer Studionet**
- chain ID: **61999**
- hex chain ID: **0xF22F**
- RPC: `https://studio.genlayer.com/api`
- explorer: `https://explorer-studio.genlayer.com`

Do not use chain 61997. Do not use Studionet Dev. Do not use Bradbury.

## Product invariants

Do not weaken these properties while fixing deployment or SDK compatibility:

1. exact candidate bytes are frozen and SHA-256 bound;
2. baseline source and candidate source must use immutable 40-character lowercase commit URLs;
3. every patch extends the exact current verified baseline generation;
4. developer intent and declared change domains are frozen in the capsule;
5. validators derive the observed semantic delta independently;
6. forbidden, undeclared or unpermitted known changes cannot receive a receipt;
7. `INCONCLUSIVE` is a first-class outcome and never authorizes;
8. an inconclusive capsule requires a fresh evidence epoch;
9. byte-identical evidence cannot be used to reroll an inconclusive review;
10. evidence uses typed claims and a generic authority policy, not hard-coded CI/audit roles;
11. every claim is hash-bound and capsule/baseline/candidate/profile bound;
12. independent-review evidence must include a publisher independent from the source publisher;
13. all authorization-driving nondeterministic results must exactly agree across leader/validators;
14. receipt issuance and patch delivery are finality-bound;
15. the target re-hashes candidate bytes before code replacement;
16. the target consumes a baseline-bound receipt instead of pulling candidate code from the gate;
17. baseline advancement is recorded only after finalized target attestation;
18. the target owner is not a GenVM code upgrader;
19. the EviFix gate has no self-upgrade entry point.

## Work sequence

1. Install the repository requirements and frontend dependencies.
2. Run:
   - `python -m compileall -q contracts tests scripts`
   - `genvm-lint lint contracts/evifix_gate.py`
   - `genvm-lint lint contracts/evifix_target_v1.py`
   - `pytest tests/direct -q`
   - `cd frontend && npm run build`
3. Fix any real SDK/Direct Mode compatibility issue without weakening the invariants above.
4. Deploy `contracts/evifix_gate.py` to Studionet 61999 using the funded deployer wallet available to you.
5. Deploy `contracts/evifix_target_v1.py` with the real gate address.
6. Commit the final source before preparing immutable source/evidence URLs. Compute SHA-256 from the exact bytes served by the immutable raw GitHub commit URL.
7. Create the final invariant profile and evidence policy. Use genuinely distinct evidence publishers so the independent-review publisher has a different GitHub owner from the source publisher.
8. Call `enrol_with_evifix(...)` on the target and wait for the profile anchor to finalize.
9. Set the real frontend environment values:
   - `VITE_EVIFIX_GATE_ADDRESS`
   - `VITE_EVIFIX_TARGET_ADDRESS`
10. Deploy the frontend.
11. Produce real evidence artifacts using the schemas in `evidence/examples/`. Never invent PASS evidence. Publish artifacts at immutable commit URLs and calculate their exact SHA-256 values.
12. Demonstrate a full safe lifecycle:
   - open patch capsule;
   - attach evidence epoch;
   - run review;
   - confirm `RECEIPT_ISSUED`;
   - allow finality-bound target activation;
   - confirm `VERIFIED` and baseline generation advance.
13. Demonstrate at least one fail-closed lifecycle using the adversarial fixture or a controlled inconclusive case. Show that no receipt is minted.
14. Fill `docs/LIVE_EVIDENCE.md` with the real commit, addresses, profile hash, capsule id, candidate hash, evidence bundle hash, semantic delta hash, decision hash, receipt hash, transaction hashes and final baseline generation.
15. Rerun all contract tests, GenVM lint and frontend build.
16. Push the clean finished repository. Do not commit private keys, seed phrases, wallet exports, `.env` secrets or fabricated transaction data.

## Frontend transaction handling

Keep the existing Studionet client protections:

- switch/add chain `0xF22F` before writes;
- poll every 3 seconds at most, which is 20 polls/minute and below the known 30 request/minute ceiling;
- report write success only after `ACCEPTED` or `FINALIZED` and after checking that the receipt contains no rollback.

## Evidence schema

The v2 evidence model uses:

- one immutable evidence-bundle manifest per epoch;
- typed claims such as `BUILD_RESULT`, `TEST_RESULT`, `INDEPENDENT_REVIEW`, `SCHEMA_COMPATIBILITY`, `INTERFACE_COMPATIBILITY`, `ADVERSARIAL_TEST`, or `CUSTOM`;
- separate immutable claim artifacts;
- SHA-256 hash binding between manifest and artifacts;
- exact capsule, target, baseline, candidate and profile bindings;
- fresh timestamps and explicit expiry.

Do not collapse this back into two fixed CI/audit JSON files.
