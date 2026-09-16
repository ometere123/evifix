import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileCheck2, RefreshCw, ShieldCheck, TimerReset } from "lucide-react";
import { GATE_ADDRESS, NETWORK, TARGET_ADDRESS } from "../lib/client";
import { reads, writes } from "../lib/contracts";
import { shortHash } from "../lib/validation";
import { useWallet } from "../lib/WalletContext";
import type { CapsuleSummary, TransactionRecord } from "../types";
import { Lifecycle } from "./Lifecycle";
import { ProposalComposer } from "./ProposalComposer";
import { SetupPanel } from "./SetupPanel";

const TABS = ["overview", "new patch", "evidence & review", "activation", "setup"] as const;
type Tab = typeof TABS[number];

export function Workspace() {
  const wallet = useWallet();
  const [tab, setTab] = useState<Tab>("overview");
  const [version, setVersion] = useState("");
  const [baselineHash, setBaselineHash] = useState("");
  const [profileHash, setProfileHash] = useState("");
  const [generation, setGeneration] = useState(0);
  const [count, setCount] = useState(0);
  const [activeId, setActiveId] = useState(0);
  const [capsule, setCapsule] = useState<CapsuleSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  const configured = Boolean(GATE_ADDRESS && TARGET_ADDRESS);
  const canWrite = Boolean(wallet.address && configured);

  const refresh = useCallback(async () => {
    if (!configured) return;
    setLoading(true); setError("");
    try {
      const [capsuleCount, active, currentVersion, currentHash, fingerprint, currentGeneration] = await Promise.all([
        reads.capsuleCount(), reads.activeCapsule(), reads.baselineVersion(), reads.baselineHash(), reads.profileHash(), reads.generation(),
      ]);
      setCount(Number(capsuleCount));
      setActiveId(Number(active));
      setVersion(currentVersion);
      setBaselineHash(currentHash);
      setProfileHash(fingerprint);
      setGeneration(Number(currentGeneration));
      setCapsule(Number(active) > 0 ? await reads.capsuleSummary(active) : null);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally { setLoading(false); }
  }, [configured]);

  useEffect(() => { void refresh(); }, [refresh]);

  const onComplete = useCallback((hash: string, action: string, status: string) => {
    setTransactions(current => [{ hash, action, status, createdAt: Date.now() }, ...current].slice(0, 10));
    void refresh();
  }, [refresh]);

  const statusClass = useMemo(() => {
    if (!capsule) return "status";
    if (capsule.status === "VERIFIED") return "status status-pass";
    if (capsule.status === "INCONCLUSIVE" || capsule.status === "EVIDENCE_REPAIR_REQUIRED") return "status status-inconclusive";
    if (capsule.status === "REJECTED" || capsule.status === "ACTIVATION_FAILED") return "status status-fail";
    return "status status-pending";
  }, [capsule]);

  async function action(label: string, fn: () => Promise<{hash: string; status: string}>) {
    setError("");
    try { const tx = await fn(); onComplete(tx.hash, label, tx.status); }
    catch (err: any) { setError(String(err?.message ?? err)); }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-65px)] max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="section-kicker">operator workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Invariant-bound patch control</h1><p className="mt-2 text-sm text-gray-500">{NETWORK.name} · chain {NETWORK.chainId}</p></div>
        <button onClick={() => void refresh()} disabled={!configured || loading} className="btn-secondary"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh state</button>
      </div>

      {!configured ? <div className="mb-6 flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>Deployment addresses are intentionally not faked. After deployment, set VITE_EVIFIX_GATE_ADDRESS and VITE_EVIFIX_TARGET_ADDRESS.</p></div> : null}
      {error ? <p className="error-box mb-6">{error}</p> : null}

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-800 bg-gray-950 p-1">
        {TABS.map(item => <button key={item} onClick={() => setTab(item)} className={`tab-btn ${tab === item ? "tab-btn-active" : ""}`}>{item}</button>)}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <section className="panel p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><p className="section-kicker">verified baseline</p><h2 className="mt-2 text-xl font-semibold text-white">Generation {generation}</h2></div><span className="rounded-full border border-gray-800 px-3 py-1 font-mono text-xs text-gray-500">{TARGET_ADDRESS ? shortHash(TARGET_ADDRESS) : "not deployed"}</span></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Metric label="Baseline version" value={version || "—"} />
              <Metric label="Capsule count" value={String(count)} />
              <Metric label="Baseline SHA-256" value={shortHash(baselineHash, 12, 10)} mono />
              <Metric label="Invariant profile" value={shortHash(profileHash, 12, 10)} mono />
            </div>
          </section>
          <section className="panel p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><p className="section-kicker">active patch capsule</p><h2 className="mt-2 text-xl font-semibold text-white">#{activeId || "—"}</h2></div><span className={statusClass}>{capsule?.status ?? "NONE"}</span></div>
            {capsule ? <div className="mt-5 space-y-3"><Metric label="Candidate" value={capsule.candidate_version} /><Metric label="Candidate hash" value={shortHash(capsule.candidate_code_hash, 12, 10)} mono /><Metric label="Evidence epoch" value={String(capsule.evidence_epoch)} /><Metric label="Decision" value={capsule.decision || "not reviewed"} /><Metric label="Delta hash" value={shortHash(capsule.delta_hash, 12, 10)} mono /><Metric label="Receipt" value={shortHash(capsule.receipt_hash, 12, 10)} mono /></div> : <p className="mt-5 text-sm leading-6 text-gray-500">No active capsule. Terminal outcomes release the target slot for a new patch.</p>}
          </section>
          <section className="panel p-5 sm:p-6 lg:col-span-2"><p className="section-kicker">semantic continuity</p><div className="mt-4"><Lifecycle capsule={capsule} /></div></section>
        </div>
      ) : null}

      {tab === "new patch" ? <ProposalComposer disabled={!canWrite || activeId > 0} onComplete={onComplete} /> : null}

      {tab === "evidence & review" ? (
        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="icon-tile"><FileCheck2 className="h-4 w-4" /></span><div><h2 className="panel-title">Evidence epoch and invariant adjudication</h2><p className="panel-copy">Attach a typed evidence bundle. EviFix derives the observed semantic delta, compares it with declared and permitted scope, then adjudicates every invariant. Uncertainty never mints a receipt.</p></div></div>
          {capsule ? <div className="mt-6 grid gap-3 sm:grid-cols-2"><Metric label="Status" value={capsule.status} /><Metric label="Decision" value={capsule.decision || "—"} /><Metric label="Evidence epoch" value={String(capsule.evidence_epoch)} /><Metric label="Evidence bundle" value={shortHash(capsule.evidence_bundle_hash, 12, 10)} mono /><Metric label="Last review code" value={capsule.last_review_code || "—"} /><Metric label="Decision hash" value={shortHash(capsule.decision_hash, 12, 10)} mono /></div> : <p className="mt-6 text-sm text-gray-500">No active patch capsule.</p>}
          {capsule && ["AWAITING_EVIDENCE", "EVIDENCE_REPAIR_REQUIRED", "INCONCLUSIVE"].includes(capsule.status) ? <EvidenceEpochBox capsule={capsule} disabled={!canWrite} onComplete={onComplete} /> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={!canWrite || !capsule || !["READY", "REVIEW_RETRY_REQUIRED"].includes(capsule.status)} className="btn-primary" onClick={() => capsule && void action("Review patch capsule", () => writes.reviewCapsule(capsule.capsule_id))}>Derive delta + review</button>
            <button disabled={!canWrite || !capsule || !["AWAITING_EVIDENCE", "READY", "REVIEW_RETRY_REQUIRED", "EVIDENCE_REPAIR_REQUIRED", "INCONCLUSIVE"].includes(capsule.status)} className="btn-secondary" onClick={() => capsule && void action("Cancel patch capsule", () => writes.cancelCapsule(capsule.capsule_id))}>Cancel</button>
            <button disabled={!canWrite || !capsule} className="btn-secondary" onClick={() => capsule && void action("Expire patch capsule", () => writes.expireCapsule(capsule.capsule_id))}>Expire if due</button>
          </div>
        </section>
      ) : null}

      {tab === "activation" ? (
        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="icon-tile"><ShieldCheck className="h-4 w-4" /></span><div><h2 className="panel-title">Finalized receipt activation</h2><p className="panel-copy">The target receives exact candidate bytes with a finalized patch receipt, re-hashes them locally, verifies the receipt against the current baseline, replaces code, and advances the verified baseline only after finalized attestation.</p></div></div>
          <div className="mt-6"><Lifecycle capsule={capsule} /></div>
          <div className="mt-5 flex flex-wrap gap-2"><button disabled={!canWrite || capsule?.status !== "RECEIPT_ISSUED"} className="btn-primary" onClick={() => capsule && void action("Reconcile activation", () => writes.reconcileActivation(capsule.capsule_id))}>Reconcile finalized activation</button><button disabled={!canWrite || capsule?.status !== "RECEIPT_ISSUED"} className="btn-secondary" onClick={() => capsule && void action("Mark activation timeout", () => writes.markActivationTimeout(capsule.capsule_id))}><TimerReset className="h-4 w-4" />Timeout if due</button></div>
        </section>
      ) : null}

      {tab === "setup" ? <SetupPanel disabled={!canWrite} onComplete={onComplete} /> : null}

      <section className="mt-6 panel p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><p className="section-kicker">transaction center</p><h2 className="mt-2 text-lg font-semibold text-white">This session</h2></div><span className="text-xs text-gray-600">success only after accepted/finalized + no rollback</span></div>
        <div className="mt-4 space-y-2">{transactions.length ? transactions.map(tx => <div key={tx.hash} className="grid gap-1 rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><span className="text-sm text-gray-300">{tx.action}</span><a className="font-mono text-xs text-brand-300 underline decoration-brand-500/40 underline-offset-4" href={`${NETWORK.explorer}/tx/${tx.hash}`} target="_blank" rel="noreferrer">{shortHash(tx.hash, 10, 8)} · Explorer</a><span className="text-xs font-semibold text-success">{tx.status}</span></div>) : <p className="text-sm text-gray-600">No writes submitted in this browser session.</p>}</div>
      </section>
    </main>
  );
}

function Metric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">{label}</p><p className={`mt-2 text-sm text-gray-200 ${mono ? "font-mono text-xs" : "font-medium"}`}>{value || "—"}</p></div>;
}

function EvidenceEpochBox({ capsule, disabled, onComplete }: { capsule: CapsuleSummary; disabled: boolean; onComplete: (hash: string, action: string, status: string) => void }) {
  const [manifestUrl, setManifestUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true); setError("");
    try { const tx = await writes.submitEvidenceEpoch(capsule.capsule_id, manifestUrl); onComplete(tx.hash, `Submit evidence epoch ${capsule.evidence_epoch + 1}`, tx.status); }
    catch (err: any) { setError(String(err?.message ?? err)); }
    finally { setBusy(false); }
  }
  return <div className="mt-6 rounded-2xl border border-warning/20 bg-warning/5 p-4"><p className="text-sm font-semibold text-warning">Attach a fresh evidence epoch</p><p className="mt-1 text-xs leading-5 text-gray-500">Candidate bytes, baseline, declared intent, and profile remain frozen. A byte-identical evidence bundle cannot be used to reroll an inconclusive semantic decision.</p><input className="input mt-4 w-full" placeholder="Immutable evidence manifest URL" value={manifestUrl} onChange={e => setManifestUrl(e.target.value)} />{error ? <p className="error-box mt-3">{error}</p> : null}<button disabled={disabled || busy || !manifestUrl} onClick={() => void submit()} className="btn-primary mt-4">{busy ? "Submitting" : "Submit evidence epoch"}</button></div>;
}
