import { useMemo, useState } from "react";
import { FileCode2, Send } from "lucide-react";
import { writes } from "../lib/contracts";
import { isImmutableRawGithubUrl } from "../lib/validation";

const DOMAIN_HINT = "liveness, interface";

export function ProposalComposer({ disabled, onComplete }: { disabled: boolean; onComplete: (hash: string, action: string, status: string) => void }) {
  const [form, setForm] = useState({
    candidateVersion: "",
    candidateSourceUrl: "",
    candidateCode: "",
    declaredIntent: "",
    declaredDomains: DOMAIN_HINT,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const domains = useMemo(() => form.declaredDomains.split(",").map(item => item.trim()).filter(Boolean), [form.declaredDomains]);
  const validSource = isImmutableRawGithubUrl(form.candidateSourceUrl);
  const canSubmit = !disabled && !busy && validSource && Boolean(form.candidateVersion && form.candidateCode && form.declaredIntent && domains.length);

  async function submit() {
    setBusy(true); setError("");
    try {
      const tx = await writes.openPatchCapsule({
        candidateVersion: form.candidateVersion,
        candidateSourceUrl: form.candidateSourceUrl,
        candidateCode: form.candidateCode,
        declaredIntent: form.declaredIntent,
        declaredDomains: domains,
      });
      onComplete(tx.hash, "Open patch capsule", tx.status);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="icon-tile"><FileCode2 className="h-4 w-4" /></span>
        <div><h2 className="panel-title">Open an immutable patch capsule</h2><p className="panel-copy">Freeze exact candidate bytes, declare what the patch intends to change, and bind it to the current verified baseline generation.</p></div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><span className="field-label">Candidate version</span><input className="input w-full" value={form.candidateVersion} placeholder="2.0.0" onChange={e => setForm(current => ({ ...current, candidateVersion: e.target.value }))} /></label>
        <label className="space-y-2"><span className="field-label">Immutable candidate source URL</span><input className="input w-full" value={form.candidateSourceUrl} placeholder="https://raw.githubusercontent.com/owner/repo/<40-char-commit>/contracts/target.py" onChange={e => setForm(current => ({ ...current, candidateSourceUrl: e.target.value }))} /></label>
      </div>
      <label className="mt-4 block space-y-2"><span className="field-label">Declared patch intent</span><textarea className="input min-h-28 w-full text-sm leading-6" value={form.declaredIntent} placeholder="Describe exactly what behavior is intended to change and what must remain unchanged." onChange={e => setForm(current => ({ ...current, declaredIntent: e.target.value }))} /></label>
      <label className="mt-4 block space-y-2"><span className="field-label">Declared semantic domains</span><input className="input w-full" value={form.declaredDomains} onChange={e => setForm(current => ({ ...current, declaredDomains: e.target.value }))} /><p className="text-xs text-gray-600">Comma-separated. The invariant profile decides which domains are permitted.</p></label>
      <label className="mt-4 block space-y-2"><span className="field-label">Exact candidate source</span><textarea className="input min-h-64 w-full font-mono text-xs leading-6" value={form.candidateCode} onChange={e => setForm(current => ({ ...current, candidateCode: e.target.value }))} /></label>
      {!validSource && form.candidateSourceUrl ? <p className="mt-3 text-xs text-warning">The candidate source URL must contain a 40-character lowercase commit SHA.</p> : null}
      {error ? <p className="error-box mt-4">{error}</p> : null}
      <button disabled={!canSubmit} onClick={() => void submit()} className="btn-primary mt-5"><Send className="h-4 w-4" />{busy ? "Opening" : "Open capsule"}</button>
    </section>
  );
}
