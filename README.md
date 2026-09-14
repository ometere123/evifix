# EviFix

**Evidence before execution.**

EviFix is a GenLayer-native semantic upgrade gate for Intelligent Contracts. It lets a protected contract accept replacement code only when the exact candidate bytes, immutable provenance, CI evidence, independent audit evidence, validator review, protocol finality, and post-install attestation all agree.

EviFix is designed as a complete product rather than a demo wrapper around a contract. The contract owns the consequential decision. The interface makes every state legible without pretending that an accepted transaction is automatically a successful or finalized upgrade.

## Network lock

EviFix targets one network configuration:

- network: **GenLayer Studionet**
- chain ID: **61999**
- hexadecimal chain ID: **0xF22F**
- RPC: `https://studio.genlayer.com/api`
- explorer: `https://explorer-studio.genlayer.com`

The frontend actively switches the connected wallet to that chain before writes. Transaction polling is throttled to one request every three seconds.

## Why EviFix is stronger

### First-class inconclusive review

Semantic review is tri-state per security dimension: `PASS`, `FAIL`, or `INCONCLUSIVE`. Any failure rejects the candidate. Any uncertainty blocks execution. Only an all-pass vector may authorize installation.

An inconclusive result cannot be repeatedly re-run against the same evidence until a favourable model output appears. The proposal moves to `INCONCLUSIVE` and requires newly identified evidence before another review, while the frozen candidate bytes and hash remain unchanged.

### Exact consequence binding

Every proposal freezes the candidate bytes and SHA-256 digest at creation. Source, CI, and audit envelopes bind to the target, parent hash, candidate hash, candidate version, policy fingerprint, and immutable source commit. Validators independently reproduce the full review result and must agree on every authorization-driving field.

### Independent evidence

Source, CI, and audit authorities are registered separately. The independent audit repository publisher must differ from both the source and CI publishers. Evidence IDs are scoped and replay-resistant.

### Finality before installation

A successful semantic review only queues an upgrade. EviFix emits the target upgrade call on the finality path. The target re-checks authorization, obtains the frozen bytes, hashes them again, persists the installation attestation, replaces code, then emits a finality-bound confirmation to the gate.

### Bounded recovery

Bad or stale evidence moves to a repair state. Transient fetch/model failures move to a retry state. Proposals expire. Queued installations have execution deadlines. Reconciliation and timeout paths inspect finalized and non-final target attestations before releasing an active slot.

## Repository layout

```text
contracts/
  evifix_gate.py                    semantic upgrade gate
  evifix_target_v1.py               protected target integration pattern
  fixtures/
    evifix_target_v2_safe.py        compatible candidate fixture
    evifix_target_v2_unsafe.py      adversarial candidate fixture

tests/direct/
  test_evifix_gate.py               lifecycle and adversarial contract tests
  test_source_guards.py             source-level invariants
  test_network_guard.py             Studionet configuration lock

frontend/
  src/components/                   landing, workspace and lifecycle UI
  src/lib/                          wallet, GenLayer client and contract calls

docs/
  ARCHITECTURE.md
  SECURITY_MODEL.md
  SUBMISSION.md
  LIVE_EVIDENCE.md

evidence/examples/                  canonical CI and audit envelope examples
scripts/                             preflight and hashing helpers
```

## Local verification

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python scripts/preflight.py
```

Frontend:

```bash
cd frontend
npm install
npm run build
npm run dev
```

Copy `frontend/.env.example` to `frontend/.env` only after contracts are deployed and fill in the final EviFix gate and target addresses.

## Deployment handoff

The repository deliberately contains no invented deployment addresses, transaction hashes, or fabricated live evidence. Deployment and production evidence collection should be performed from the final commit on Studionet and then recorded in `docs/LIVE_EVIDENCE.md`.

See [`AGENT_HANDOFF.md`](AGENT_HANDOFF.md) for the exact finishing sequence.
