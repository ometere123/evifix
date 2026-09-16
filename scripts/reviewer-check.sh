#!/usr/bin/env bash
set -euo pipefail

tracked="$(git ls-files)"
if printf '%s\n' "$tracked" | grep -E '(^|/)(\.env|node_modules|dist|\.pnpm-store|\.npm-cache|\.gltest_cache)(/|$)' >/dev/null; then
  echo "generated files or environment files are tracked" >&2
  exit 1
fi

if printf '%s\n' "$tracked" | grep -E '(private.?key|mnemonic|seed.?phrase|keystore)' -i >/dev/null; then
  echo "wallet secret-looking file is tracked" >&2
  exit 1
fi

if git grep -n -E '61997|Bradbury|studio-dev\.genlayer\.com' -- contracts frontend scripts >/dev/null; then
  echo "non-Studionet network reference found in application sources" >&2
  exit 1
fi

echo "hygiene checks passed"
