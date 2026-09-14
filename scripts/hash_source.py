#!/usr/bin/env python3
import hashlib
import sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit("usage: python scripts/hash_source.py <file>")
path = Path(sys.argv[1])
print(hashlib.sha256(path.read_bytes()).hexdigest())
