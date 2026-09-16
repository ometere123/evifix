# EviFix live evidence

Fill this file only with real, reproducible Studionet evidence. Do not invent values.

## Network

- network: GenLayer Studionet
- chain ID: 61999
- chain hex: 0xF22F
- RPC: https://studio.genlayer.com/api
- explorer: https://explorer-studio.genlayer.com

## Deployment

- repository commit: `b21d67719ec790c3745bdbc906c0eb328e881127`
- gate address: `0x2531242431cB4a630008cDe8e708549397DBdb20`
- protected target address: `0x9b0C5BF4b296f05376293F85e580891b8e8A6AD8`
- target v1 SHA-256: `b5d98c116b6fa72716a596225c99628d6bc54e37de97b56bc6d22f2dc1a3daed`
- escrow address: `0x8FC0b0e055049E7339228B06a1c943659C82dFA8`
- gate SHA-256: `994153a61e45aacf1a8d9af1ba0d03654b2d4730be7eb3da714880416f949a57`
- escrow SHA-256: `129903a1bfc48c23d857c9f1881913f34559c937fca881c3bf7d1563d2879711`
- deployer: `0x0d5540e0aD4B92Aa0ad4e5F1b8cD645ee1E363E7` (`praest-deployer`)
- deployment status: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- invariant profile hash: `PENDING`
- baseline generation: `PENDING`
- deployment transaction(s):
  - gate: `0x5ab8b3c8208728b7c0915b008d79e6bdf5408b660e72153bca573215498cd8e5`
  - target (corrected constructor): `0xf827c2be10615965ef8bd87b284b4068748ade36ce94aa842da20922dc6ed319`
  - escrow: `0x9d1753c6c52ca1bd66b8f6af943b50606875ae6ebbf115eb8541b990d186f905`
- profile anchor transaction: `PENDING`
- escrow deployment transaction: `0x9d1753c6c52ca1bd66b8f6af943b50606875ae6ebbf115eb8541b990d186f905`

## Frontend hosting

- production URL: https://evifix.vercel.app
- deployment: `dpl_CmUfRnrnhF6GAZNniEyspkQonu2N`
- status: `READY`
- production build contains the three addresses above.

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

## Escrow lifecycle

- escrow id: `PENDING`
- sponsor: `PENDING`
- beneficiary: `PENDING`
- funded amount: `PENDING`
- funding transaction: `PENDING`
- release/refund transaction: `PENDING`
- final escrow accounting: `PENDING`

## Fail-closed demonstration

Record at least one real attempt showing that EviFix does not mint a receipt when the observed semantic delta is forbidden/undeclared or when evidence leaves an invariant inconclusive.

- capsule id: `PENDING`
- fixture/candidate: `PENDING`
- observed failure: `PENDING`
- final status: `PENDING`
- transaction: `PENDING`

## Current boundary

The contracts and frontend are deployed and publicly readable on Studionet 61999. Target enrollment, patch capsules,
semantic review, activation, escrow funding, release, refund and fail-closed live demonstration remain `PENDING` until
observed in finalized transactions.

## Verification commands

```bash
python -m compileall -q contracts tests scripts
genvm-lint lint contracts/evifix_gate.py
genvm-lint lint contracts/evifix_target_v1.py
pytest tests/direct -q
cd frontend && npm install --no-audit --no-fund && npm run build
```
