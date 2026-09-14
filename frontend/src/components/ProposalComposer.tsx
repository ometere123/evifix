import { useMemo, useState } from "react";
import { FileCode2, Send } from "lucide-react";
import { writes } from "../lib/contracts";
import { isImmutableRawGithubUrl } from "../lib/validation";

export function ProposalComposer({ disabled, onComplete }: { disabled: boolean; onComplete: (hash: string, action: string, status: string) => void }) {
  const [form, setForm] = useState({
    candidateVersion: "",
    candidateSourceUrl: "",
    candidateCode: "",
    ciEvidenceUrl: "",
    ciEvidenceId: "",
    auditEvidenceUrl: "",
    auditEvidenceId: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const validUrls = useMemo(() => [form.candidateSourceUrl, form.ciEvidenceUrl, form.auditEvidenceUrl].every(isImmutableRawGithubUrl), [form]);
  const canSubmit = !disabled && !busy && validUrls && Object.values(form).every(Boolean);

  function field(key: keyof typeof form, label: string, placeholder = "") {
    return (
      <label className="space-y-2">
        <span className="field-label">{label}</span>
        <input className="input w-full" value={form[key]} placeholder={placeholder} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} />
      </label>
    );
  }

  async function submit() {
    setBusy(true); setError("");
    try {
      const tx = await writes.createProposal(form);
      onComplete(tx.hash, "Create patch proposal", tx.status);
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
        <div><h2 className="panel-title">Create a frozen patch proposal</h2><p className="panel-copy">The source text entered here becomes the exact candidate bytes stored and hashed by the gate.</p></div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {field("candidateVersion", "Candidate version", "2.0.0")}
        {field("candidateSourceUrl", "Immutable candidate source URL", "https://raw.githubusercontent.com/owner/repo/<40-char-commit>/contracts/target.py")}
        {field("ciEvidenceId", "CI evidence ID", "ci-run-2026-001")}
        {field("ciEvidenceUrl", "Immutable CI evidence URL")}
        {field("auditEvidenceId", "Audit evidence ID", "audit-2026-001")}
        {field("auditEvidenceUrl", "Immutable audit evidence URL")}
      </div>
      <label className="mt-4 block space-y-2">
        <span className="field-label">Exact candidate source</span>
        <textarea className="input min-h-64 w-full font-mono text-xs leading-6" value={form.candidateCode} onChange={event => setForm(current => ({ ...current, candidateCode: event.target.value }))} />
      </label>
      {!validUrls && (form.candidateSourceUrl || form.ciEvidenceUrl || form.auditEvidenceUrl) ? <p className="mt-3 text-xs text-warning">Every evidence/source URL must contain a 40-character lowercase commit SHA.</p> : null}
      {error ? <p className="error-box mt-4">{error}</p> : null}
      <button disabled={!canSubmit} onClick={() => void submit()} className="btn-primary mt-5"><Send className="h-4 w-4" />{busy ? "Submitting" : "Create proposal"}</button>
    </section>
  );
}
