import { ArrowRight, CheckCircle2, FileCheck2, Flame, GitCommit, ScanSearch, ShieldCheck, TimerReset } from "lucide-react";

const STEPS = [
  [GitCommit, "Freeze the exact patch", "Candidate bytes, immutable source and evidence references become one release envelope."],
  [FileCheck2, "Verify provenance", "Publisher namespaces, commit URLs, evidence freshness and replay resistance are deterministic gates."],
  [ScanSearch, "Judge semantic safety", "Validators independently classify every safety domain as PASS, FAIL or INCONCLUSIVE."],
  [TimerReset, "Repair uncertainty", "Inconclusive review cannot be retried into a lucky approval. New evidence is required while candidate bytes stay frozen."],
  [ShieldCheck, "Finalize before install", "The target installs only the exact approved bytes after the parent decision reaches finality."],
];

export function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/5 px-4 py-20 sm:px-6 sm:py-28">
        <div className="hero-glow" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <div className="eyebrow"><Flame className="h-3.5 w-3.5" /> GenLayer semantic release control</div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-0.04em] text-white sm:text-6xl">
              Ship code only when the evidence and the semantics agree.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
              EviFix is an evidence-bound upgrade gate for Intelligent Contracts. It freezes exact replacement bytes, verifies independent release evidence, treats uncertainty as a real outcome, and waits for finality before code can change.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onLaunch} className="btn-primary px-5 py-3">Open workspace <ArrowRight className="h-4 w-4" /></button>
              <a href="#model" className="btn-secondary px-5 py-3">Read the model</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-500">
              {["exact-byte install", "tri-state semantic review", "independent audit provenance"].map(item => (
                <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-400" />{item}</span>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-3xl border border-brand-500/20 bg-gray-950/80 p-5 shadow-ember">
            <div className="mb-5 flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-600">release decision</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Candidate 2.4.0</h2>
              </div>
              <span className="status status-inconclusive">INCONCLUSIVE</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["storage layout", "PASS"], ["authorization surface", "PASS"],
                ["user rights", "PASS"], ["value flow", "PASS"],
                ["external calls", "INCONCLUSIVE"], ["finality safety", "PASS"],
              ].map(([label, state]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-3">
                  <span className="text-xs text-gray-400">{label}</span>
                  <strong className={state === "PASS" ? "text-success text-xs" : "text-warning text-xs"}>{state}</strong>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-sm leading-6 text-brand-100">
              No installation path is emitted. The operator must attach stronger evidence; the frozen candidate hash cannot change.
            </div>
          </div>
        </div>
      </section>

      <section id="model" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="section-kicker">release path</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">A safety decision with explicit failure modes.</h2>
          <p className="mt-4 leading-7 text-gray-500">Integrity, evidence quality, semantic judgement and finality are separate gates. One cannot impersonate another.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {STEPS.map(([Icon, title, body], index) => {
            const StepIcon = Icon as typeof Flame;
            return (
              <article key={String(title)} className="panel p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-300"><StepIcon className="h-4 w-4" /></span>
                  <span className="font-mono text-xs text-gray-700">0{index + 1}</span>
                </div>
                <h3 className="text-sm font-semibold text-white">{String(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">{String(body)}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
