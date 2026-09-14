import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import type { ProposalSummary } from "../types";

export function Lifecycle({ proposal }: { proposal: ProposalSummary | null }) {
  const status = proposal?.status ?? "UNKNOWN";
  const steps = [
    ["Proposal frozen", status !== "UNKNOWN"],
    ["Evidence + semantic review", Boolean(proposal?.reviewed_at)],
    ["Approved and queued", ["UPGRADE_QUEUED", "VERIFIED"].includes(status)],
    ["Installation verified", status === "VERIFIED"],
  ] as const;
  return (
    <div className="space-y-2">
      {steps.map(([label, complete], index) => (
        <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
          {complete ? <CheckCircle2 className="h-4 w-4 text-success" /> : index === 1 && status === "INCONCLUSIVE" ? <Clock3 className="h-4 w-4 text-warning" /> : <Circle className="h-4 w-4 text-gray-700" />}
          <span className={complete ? "text-sm text-gray-200" : "text-sm text-gray-500"}>{label}</span>
        </div>
      ))}
    </div>
  );
}
