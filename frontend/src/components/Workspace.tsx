import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileCheck2, RefreshCw, ShieldCheck, TimerReset } from "lucide-react";
import { GATE_ADDRESS, NETWORK, TARGET_ADDRESS } from "../lib/client";
import { reads, writes } from "../lib/contracts";
import { shortHash } from "../lib/validation";
import { useWallet } from "../lib/WalletContext";
import type { ProposalSummary, TransactionRecord } from "../types";
import { Lifecycle } from "./Lifecycle";
import { ProposalComposer } from "./ProposalComposer";
import { SetupPanel } from "./SetupPanel";

const TABS = ["overview", "new patch", "evidence & review", "finality", "setup"] as const;
type Tab = typeof TABS[number];

export function Workspace() {
  const wallet = useWallet();
  const [tab, setTab] = useState<Tab>("overview");
  const [version, setVersion] = useState("");
  const [codeHash, setCodeHash] = useState("");
  const [policyFingerprint, setPolicyFingerprint] = useState("");
  const [count, setCount] = useState(0);
  const [activeId, setActiveId] = useState(0);
  const [proposal, setProposal] = useState<ProposalSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  const configured = Boolean(GATE_ADDRESS && TARGET_ADDRESS);
  const canWrite = Boolean(wallet.address && configured);

  const refresh = useCallback(async () => {
    if (!configured) return;
    setLoading(true); setError("");
    try {
      const [proposalCount, active, currentVersion, currentHash, fingerprint] = await Promise.all([
        reads.proposalCount(), reads.activeProposal(), reads.currentVersion(), reads.currentCodeHash(), reads.policyFingerprint(),
      ]);
      setCount(Number(proposalCount));
      setActiveId(Number(active));
      setVersion(currentVersion);
      setCodeHash(currentHash);
      setPolicyFingerprint(fingerprint);
      setProposal(Number(active) > 0 ? await reads.proposalSummary(active) : null);
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
    if (!proposal) return "status";
    if (proposal.status === "VERIFIED") return "status status-pass";
    if (proposal.status === "INCONCLUSIVE" || proposal.status === "EVIDENCE_REPAIR_REQUIRED") return "status status-inconclusive";
    if (proposal.status === "REJECTED" || proposal.status === "EXECUTION_FAILED") return "status status-fail";
    return "status status-pending";
  }, [proposal]);

  async function action(label: string, fn: () => Promise<{hash: string; status: string}>) {
    setError("");
    try { const tx = await fn(); onComplete(tx.hash, label, tx.status); }
    catch (err: any) { setError(String(err?.message ?? err)); }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-65px)] max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="section-kicker">operator workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Evidence-bound release control</h1><p className="mt-2 text-sm text-gray-500">{NETWORK.name} · chain {NETWORK.chainId}</p></div>
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
            <div className="flex items-center justify-between"><div><p className="section-kicker">protected target</p><h2 className="mt-2 text-xl font-semibold text-white">Current release</h2></div><span className="rounded-full border border-gray-800 px-3 py-1 font-mono text-xs text-gray-500">{TARGET_ADDRESS ? shortHash(TARGET_ADDRESS) : "not deployed"}</span></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Metric label="Current version" value={version || "—"} />
              <Metric label="Proposal count" value={String(count)} />
              <Metric label="Current code SHA-256" value={shortHash(codeHash, 12, 10)} mono />
              <Metric label="Policy fingerprint" value={shortHash(policyFingerprint, 12, 10)} mono />
            </div>
          </section>
          <section className="panel p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><p className="section-kicker">active proposal</p><h2 className="mt-2 text-xl font-semibold text-white">#{activeId || "—"}</h2></div><span className={statusClass}>{proposal?.status ?? "NONE"}</span></div>
            {proposal ? <div className="mt-5 space-y-3"><Metric label="Candidate" value={proposal.candidate_version} /><Metric label="Candidate hash" value={shortHash(proposal.candidate_code_hash, 12, 10)} mono /><Metric label="Decision" value={proposal.decision || "not reviewed"} /><Metric label="Review digest" value={shortHash(proposal.review_digest, 12, 10)} mono /></div> : <p className="mt-5 text-sm leading-6 text-gray-500">No active proposal. A rejected, cancelled, expired or verified proposal releases the target slot.</p>}
          </section>
          <section className="panel p-5 sm:p-6 lg:col-span-2"><p className="section-kicker">lifecycle</p><div className="mt-4"><Lifecycle proposal={proposal} /></div></section>
        </div>
      ) : null}

      {tab === "new patch" ? <ProposalComposer disabled={!canWrite || activeId > 0} onComplete={onComplete} /> : null}

      {tab === "evidence & review" ? (
        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="icon-tile"><FileCheck2 className="h-4 w-4" /></span><div><h2 className="panel-title">Evidence and semantic review</h2><p className="panel-copy">Review is permissionless, but only an exact all-PASS semantic vector can queue installation. Inconclusive review stays active and requires fresh evidence.</p></div></div>
          {proposal ? <div className="mt-6 grid gap-3 sm:grid-cols-2"><Metric label="Status" value={proposal.status} /><Metric label="Decision" value={proposal.decision || "—"} /><Metric label="Last review code" value={proposal.last_review_code || "—"} /><Metric label="Evidence set" value={shortHash(proposal.evidence_set_hash, 12, 10)} mono /></div> : <p className="mt-6 text-sm text-gray-500">No active proposal.</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={!canWrite || !proposal || !["PROPOSED", "REVIEW_RETRY_REQUIRED"].includes(proposal.status)} className="btn-primary" onClick={() => proposal && void action("Review proposal", () => writes.reviewProposal(proposal.proposal_id))}>Run review</button>
            <button disabled={!canWrite || !proposal || !["PROPOSED", "REVIEW_RETRY_REQUIRED", "EVIDENCE_REPAIR_REQUIRED", "INCONCLUSIVE"].includes(proposal.status)} className="btn-secondary" onClick={() => proposal && void action("Cancel proposal", () => writes.cancelProposal(proposal.proposal_id))}>Cancel</button>
            <button disabled={!canWrite || !proposal} className="btn-secondary" onClick={() => proposal && void action("Expire proposal", () => writes.expireProposal(proposal.proposal_id))}>Expire if due</button>
          </div>
          {proposal && ["INCONCLUSIVE", "EVIDENCE_REPAIR_REQUIRED"].includes(proposal.status) ? <RepairBox proposal={proposal} disabled={!canWrite} onComplete={onComplete} /> : null}
        </section>
      ) : null}

      {tab === "finality" ? (
        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="icon-tile"><ShieldCheck className="h-4 w-4" /></span><div><h2 className="panel-title">Finality and installation recovery</h2><p className="panel-copy">Accepted review is not treated as installed code. The upgrade child is emitted on finality and the target re-hashes the exact bytes before replacement.</p></div></div>
          <div className="mt-6"><Lifecycle proposal={proposal} /></div>
          <div className="mt-5 flex flex-wrap gap-2"><button disabled={!canWrite || proposal?.status !== "UPGRADE_QUEUED"} className="btn-primary" onClick={() => proposal && void action("Reconcile install", () => writes.reconcileInstall(proposal.proposal_id))}>Reconcile finalized install</button><button disabled={!canWrite || proposal?.status !== "UPGRADE_QUEUED"} className="btn-secondary" onClick={() => proposal && void action("Mark execution timeout", () => writes.markExecutionTimeout(proposal.proposal_id))}><TimerReset className="h-4 w-4" />Timeout if due</button></div>
        </section>
      ) : null}

      {tab === "setup" ? <SetupPanel disabled={!canWrite} onComplete={onComplete} /> : null}

      <section className="mt-6 panel p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><p className="section-kicker">transaction center</p><h2 className="mt-2 text-lg font-semibold text-white">This session</h2></div><span className="text-xs text-gray-600">success only after accepted/finalized + no rollback</span></div>
        <div className="mt-4 space-y-2">{transactions.length ? transactions.map(tx => <div key={tx.hash} className="grid gap-1 rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><span className="text-sm text-gray-300">{tx.action}</span><span className="font-mono text-xs text-gray-600">{shortHash(tx.hash, 10, 8)}</span><span className="text-xs font-semibold text-success">{tx.status}</span></div>) : <p className="text-sm text-gray-600">No writes submitted in this browser session.</p>}</div>
      </section>
    </main>
  );
}

function Metric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">{label}</p><p className={`mt-2 text-sm text-gray-200 ${mono ? "font-mono text-xs" : "font-medium"}`}>{value}</p></div>;
}

function RepairBox({ proposal, disabled, onComplete }: { proposal: ProposalSummary; disabled: boolean; onComplete: (hash: string, action: string, status: string) => void }) {
  const [form, setForm] = useState({ candidateSourceUrl: "", ciEvidenceUrl: "", ciEvidenceId: "", auditEvidenceUrl: "", auditEvidenceId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true); setError("");
    try { const tx = await writes.repairEvidence({ proposalId: proposal.proposal_id, ...form }); onComplete(tx.hash, "Repair evidence", tx.status); }
    catch (err: any) { setError(String(err?.message ?? err)); }
    finally { setBusy(false); }
  }
  return <div className="mt-6 rounded-2xl border border-warning/20 bg-warning/5 p-4"><p className="text-sm font-semibold text-warning">Fresh evidence required</p><p className="mt-1 text-xs leading-5 text-gray-500">Candidate bytes and candidate hash remain frozen. New evidence IDs are mandatory.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{(Object.keys(form) as Array<keyof typeof form>).map(key => <input key={key} className="input w-full" placeholder={key} value={form[key]} onChange={e => setForm(current => ({ ...current, [key]: e.target.value }))} />)}</div>{error ? <p className="error-box mt-3">{error}</p> : null}<button disabled={disabled || busy || Object.values(form).some(v => !v)} onClick={() => void submit()} className="btn-primary mt-4">{busy ? "Submitting" : "Replace evidence"}</button></div>;
}
