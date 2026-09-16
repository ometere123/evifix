export function isImmutableRawGithubUrl(value: string): boolean {
  return /^https:\/\/raw\.githubusercontent\.com\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\/[0-9a-f]{40}\/[A-Za-z0-9._/-]+$/.test(value);
}

export function shortHash(value: string, left = 10, right = 8) {
  if (!value) return "—";
  if (value.length <= left + right + 1) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}
