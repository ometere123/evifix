# EviFix live evidence

Fill this file only with real, reproducible Studionet evidence. Do not invent values.

## Network

- network: GenLayer Studionet
- chain ID: 61999
- chain hex: 0xF22F
- RPC: https://studio.genlayer.com/api
- explorer: https://explorer-studio.genlayer.com

## Deployment

- repository commit: `PENDING`
- gate address: `PENDING`
- protected target address: `PENDING`
- target v1 SHA-256: `PENDING`
- invariant profile hash: `PENDING`
- baseline generation: `PENDING`
- deployment transaction(s): `PENDING`
- profile anchor transaction: `PENDING`

## Safe lifecycle

- capsule id: `PENDING`
- candidate commit: `PENDING`
- candidate SHA-256: `PENDING`
- declared intent: `PENDING`
- declared domains: `PENDING`
- evidence manifest URL: `PENDING`
- evidence bundle SHA-256: `PENDING`
- evidence epoch: `PENDING`
- semantic delta hash: `PENDING`
- decision hash: `PENDING`
- receipt hash: `PENDING`
- review transaction: `PENDING`
- activation/finality transaction: `PENDING`
- resulting baseline generation: `PENDING`
- resulting baseline SHA-256: `PENDING`

## Fail-closed demonstration

Record at least one real attempt showing that EviFix does not mint a receipt when the observed semantic delta is forbidden/undeclared or when evidence leaves an invariant inconclusive.

- capsule id: `PENDING`
- fixture/candidate: `PENDING`
- observed failure: `PENDING`
- final status: `PENDING`
- transaction: `PENDING`

## Verification commands

```bash
python -m compileall -q contracts tests scripts
genvm-lint lint contracts/evifix_gate.py
genvm-lint lint contracts/evifix_target_v1.py
pytest tests/direct -q
cd frontend && npm install --no-audit --no-fund && npm run build
```
