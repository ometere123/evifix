#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIENT = ROOT / "frontend" / "src" / "lib" / "client.ts"


def run(label: str, command: list[str], cwd: Path = ROOT) -> dict[str, object]:
    print(f"\n== {label} ==")
    completed = subprocess.run(command, cwd=cwd, text=True)
    return {"label": label, "command": command, "returncode": completed.returncode}


def verify_network_lock() -> None:
    text = CLIENT.read_text()
    required = (
        'chainId: 61999',
        'chainHex: "0xF22F"',
        'rpc: "https://studio.genlayer.com/api"',
        'explorer: "https://explorer-studio.genlayer.com"',
        'createClient({ chain: studionet })',
    )
    missing = [value for value in required if value not in text]
    if missing:
        raise SystemExit("Studionet network lock is incomplete: " + ", ".join(missing))


def main() -> int:
    verify_network_lock()
    results = [
        run("python syntax", [sys.executable, "-m", "compileall", "-q", "contracts", "tests", "scripts"]),
        run("direct tests", [sys.executable, "-m", "pytest", "tests/direct", "-q"]),
    ]
    frontend = ROOT / "frontend"
    if (frontend / "node_modules").exists():
        results.append(run("frontend build", ["npm", "run", "build"], frontend))
    else:
        print("\n== frontend build ==\nnode_modules missing; run npm install in frontend, then npm run build")
    failed = [item for item in results if item["returncode"] != 0]
    artifact_dir = ROOT / "artifacts"
    artifact_dir.mkdir(exist_ok=True)
    (artifact_dir / "preflight.json").write_text(json.dumps({"results": results}, indent=2) + "\n")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
