import { useState } from "react";
import { ShieldPlus } from "lucide-react";
import { writes } from "../lib/contracts";

const DEFAULT_PROFILE = JSON.stringify({
  schema: "evifix-invariant-profile-v2",
  rules: [
    { id: "I01", domain: "authorization", text: "Owner withdrawal authority must not expand." },
    { id: "I02", domain: "storage", text: "Persistent storage compatibility must remain intact." },
    { id: "I03", domain: "upgrade_authority", text: "EviFix must remain the only code-upgrade authority." },
    { id: "I04", domain: "finality", text: "Irreversible patch activation must remain finality-bound." },
  ],
  permitted_domains: ["liveness", "interface", "storage"],
  forbidden_domains: ["authorization", "upgrade_authority", "value_flow"],
}, null, 2);

const DEFAULT_EVIDENCE_POLICY = JSON.stringify({
  schema: "evifix-evidence-policy-v2",
  required_claims: ["BUILD_RESULT", "TEST_RESULT", "INDEPENDENT_REVIEW"],
  min_independent_issuers: 2,
  authorities: [
    { id: "build-lab", prefix: "" },
    { id: "review-lab", prefix: "" },
  ],
}, null, 2);

export function SetupPanel({ disabled, onComplete }: { disabled: boolean; onComplete: (hash: string, action: string, status: string) => void }) {
  const [form, setForm] = useState({
    invariantProfileJson: DEFAULT_PROFILE,
    sourcePrefix: "",
    evidencePolicyJson: DEFAULT_EVIDENCE_POLICY,
    baselineVersion: "1.0.0",
    baselineSourceUrl: "",
    baselineCodeHash: "",
    maxEvidenceAgeSeconds: 86400,
    capsuleTtlSeconds: 172800,
    activationTimeoutSeconds: 86400,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form, value: string | number) => setForm(current => ({ ...current, [key]: value }));

  async function submit() {
    setBusy(true); setError("");
    try {
      JSON.parse(form.invariantProfileJson);
      JSON.parse(form.evidencePolicyJson);
      const tx = await writes.enrolTarget(form);
      onComplete(tx.hash, "Anchor invariant profile", tx.status);
    } catch (err: any) { setError(String(err?.message ?? err)); }
    finally { setBusy(false); }
  }

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-start gap-3"><span className="icon-tile"><ShieldPlus className="h-4 w-4" /></span><div><h2 className="panel-title">Anchor the invariant envelope</h2><p className="panel-copy">The protected target finalizes a profile that defines allowed change domains, forbidden domains, explicit invariants, evidence authorities, and the initial verified baseline.</p></div></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="space-y-2"><span className="field-label">Invariant profile JSON</span><textarea className="input min-h-80 w-full font-mono text-xs leading-5" value={form.invariantProfileJson} onChange={e => set("invariantProfileJson", e.target.value)} /></label>
        <label className="space-y-2"><span className="field-label">Evidence policy JSON</span><textarea className="input min-h-80 w-full font-mono text-xs leading-5" value={form.evidencePolicyJson} onChange={e => set("evidencePolicyJson", e.target.value)} /></label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {([
          ["sourcePrefix", "Source repository raw prefix"],
          ["baselineVersion", "Baseline version"],
          ["baselineSourceUrl", "Baseline immutable source URL"],
          ["baselineCodeHash", "Baseline source SHA-256"],
        ] as const).map(([key, label]) => <label key={key} className="space-y-2"><span className="field-label">{label}</span><input className="input w-full" value={String(form[key])} onChange={e => set(key, e.target.value)} /></label>)}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {([
          ["maxEvidenceAgeSeconds", "Evidence max age (s)"], ["capsuleTtlSeconds", "Capsule TTL (s)"], ["activationTimeoutSeconds", "Activation timeout (s)"],
        ] as const).map(([key, label]) => <label key={key} className="space-y-2"><span className="field-label">{label}</span><input type="number" className="input w-full" value={form[key]} onChange={e => set(key, Number(e.target.value))} /></label>)}
      </div>
      {error ? <p className="error-box mt-4">{error}</p> : null}
      <button disabled={disabled || busy} onClick={() => void submit()} className="btn-primary mt-5">{busy ? "Anchoring" : "Anchor profile"}</button>
    </section>
  );
}
