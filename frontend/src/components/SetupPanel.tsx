import { useState } from "react";
import { ShieldPlus } from "lucide-react";
import { writes } from "../lib/contracts";

const DEFAULT_CONSTITUTION = `EviFix Security Constitution v1
1. Preserve persistent storage compatibility.
2. Do not introduce an alternate administrative upgrade path.
3. Preserve existing user rights and value-movement restrictions.
4. Keep EviFix as the sole code-upgrade authority.
5. Bind releases to exact bytes, immutable source, fresh CI evidence and independent audit evidence.
6. Treat semantic uncertainty as inconclusive rather than approval.
7. Execute irreversible upgrade consequences only after GenLayer finality.
8. Preserve expiry, retry, repair, reconciliation and timeout paths.`;

export function SetupPanel({ disabled, onComplete }: { disabled: boolean; onComplete: (hash: string, action: string, status: string) => void }) {
  const [form, setForm] = useState({
    constitution: DEFAULT_CONSTITUTION,
    sourceAuthority: "",
    ciAuthority: "",
    auditAuthority: "",
    sourcePrefix: "",
    ciPrefix: "",
    auditPrefix: "",
    currentVersion: "1.0.0",
    currentSourceUrl: "",
    currentCodeHash: "",
    maxEvidenceAgeSeconds: 86400,
    proposalTtlSeconds: 172800,
    executionTimeoutSeconds: 86400,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form, value: string | number) => setForm(current => ({ ...current, [key]: value }));
  async function submit() {
    setBusy(true); setError("");
    try {
      const tx = await writes.registerTarget(form);
      onComplete(tx.hash, "Register target policy", tx.status);
    } catch (err: any) { setError(String(err?.message ?? err)); }
    finally { setBusy(false); }
  }

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-start gap-3"><span className="icon-tile"><ShieldPlus className="h-4 w-4" /></span><div><h2 className="panel-title">Register immutable target policy</h2><p className="panel-copy">This action is called on the protected target, which emits registration to the gate only on finality.</p></div></div>
      <label className="mt-6 block space-y-2"><span className="field-label">Security constitution</span><textarea className="input min-h-48 w-full text-sm leading-6" value={form.constitution} onChange={e => set("constitution", e.target.value)} /></label>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {([
          ["sourceAuthority", "Source authority"], ["sourcePrefix", "Source repository raw prefix"],
          ["ciAuthority", "CI authority"], ["ciPrefix", "CI repository raw prefix"],
          ["auditAuthority", "Independent audit authority"], ["auditPrefix", "Independent audit raw prefix"],
          ["currentVersion", "Current version"], ["currentSourceUrl", "Current immutable source URL"],
          ["currentCodeHash", "Current source SHA-256"],
        ] as const).map(([key, label]) => <label key={key} className="space-y-2"><span className="field-label">{label}</span><input className="input w-full" value={String(form[key])} onChange={e => set(key, e.target.value)} /></label>)}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {([
          ["maxEvidenceAgeSeconds", "Evidence max age (s)"], ["proposalTtlSeconds", "Proposal TTL (s)"], ["executionTimeoutSeconds", "Execution timeout (s)"],
        ] as const).map(([key, label]) => <label key={key} className="space-y-2"><span className="field-label">{label}</span><input type="number" className="input w-full" value={form[key]} onChange={e => set(key, Number(e.target.value))} /></label>)}
      </div>
      {error ? <p className="error-box mt-4">{error}</p> : null}
      <button disabled={disabled || busy} onClick={() => void submit()} className="btn-primary mt-5">{busy ? "Registering" : "Register policy"}</button>
    </section>
  );
}
