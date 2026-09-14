import { ArrowRight, CheckCircle2, FileCheck2, Flame, GitCommit, ScanSearch, ShieldCheck, TimerReset } from "lucide-react";

const STEPS = [
  [GitCommit, "Anchor the baseline", "Every target starts from an explicit verified baseline generation and invariant profile."],
  [FileCheck2, "Open a patch capsule", "Exact candidate bytes, immutable source, declared intent and declared change domains are frozen together."],
  [ScanSearch, "Derive the semantic delta", "Validators independently determine what actually changed before deciding whether the change is allowed."],
  [TimerReset, "Advance evidence epochs", "Inconclusive review cannot be rerolled against identical evidence. A fresh immutable evidence bundle is required."],
  [ShieldCheck, "Consume a finalized receipt", "Only a receipt bound to the current baseline, candidate, profile, delta and evidence epoch can activate code."],
];

export function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/5 px-4 py-20 sm:px-6 sm:py-28">
        <div className="hero-glow" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <div className="eyebrow"><Flame className="h-3.5 w-3.5" /> GenLayer invariant-bound patching</div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-0.04em] text-white sm:text-6xl">
              Prove a patch stays inside its permitted semantic envelope.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
              EviFix turns upgrades into baseline-bound patch capsules. It compares declared intent with the semantic delta validators actually observe, checks typed evidence against explicit invariants, and issues a finalized receipt only when the patch remains inside the target&apos;s envelope.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onLaunch} className="btn-primary px-5 py-3">Open workspace <ArrowRight className="h-4 w-4" /></button>
              <a href="#model" className="btn-secondary px-5 py-3">Read the model</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-500">
              {["declared vs observed delta", "evidence epochs", "finalized patch receipts"].map(item => (
                <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-400" />{item}</span>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-3xl border border-brand-500/20 bg-gray-950/80 p-5 shadow-ember">
            <div className="mb-5 flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-600">patch capsule #24</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Declared: liveness only</h2>
              </div>
              <span className="status status-fail">BLOCKED</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["liveness", "MUTATED"], ["interface", "UNCHANGED"],
                ["authorization", "RELAXED"], ["value flow", "UNCHANGED"],
                ["upgrade authority", "UNCHANGED"], ["finality", "UNCHANGED"],
              ].map(([label, state]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-3">
                  <span className="text-xs text-gray-400">{label}</span>
                  <strong className={state === "UNCHANGED" ? "text-gray-500 text-xs" : state === "RELAXED" ? "text-danger text-xs" : "text-warning text-xs"}>{state}</strong>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-sm leading-6 text-brand-100">
              Observed authorization change was neither declared nor permitted. No receipt can be issued, even if every external evidence artifact says PASS.
            </div>
          </div>
        </div>
      </section>

      <section id="model" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="section-kicker">semantic continuity</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Each verified patch becomes the next baseline.</h2>
          <p className="mt-4 leading-7 text-gray-500">A patch is not judged in isolation. It must extend the exact current baseline, stay within declared and permitted scope, satisfy every invariant, and survive finality before the continuity chain advances.</p>
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
