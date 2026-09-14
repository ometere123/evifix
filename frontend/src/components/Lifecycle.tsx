import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import type { CapsuleSummary } from "../types";

export function Lifecycle({ capsule }: { capsule: CapsuleSummary | null }) {
  const status = capsule?.status ?? "UNKNOWN";
  const steps = [
    ["Patch capsule frozen", status !== "UNKNOWN"],
    ["Evidence epoch attached", Boolean(capsule?.evidence_epoch)],
    ["Semantic delta + invariants adjudicated", Boolean(capsule?.reviewed_at && capsule?.decision)],
    ["Finalized patch receipt issued", ["RECEIPT_ISSUED", "VERIFIED"].includes(status)],
    ["Candidate becomes verified baseline", status === "VERIFIED"],
  ] as const;
  return (
    <div className="space-y-2">
      {steps.map(([label, complete], index) => (
        <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
          {complete ? <CheckCircle2 className="h-4 w-4 text-success" /> : index >= 2 && status === "INCONCLUSIVE" ? <Clock3 className="h-4 w-4 text-warning" /> : <Circle className="h-4 w-4 text-gray-700" />}
          <span className={complete ? "text-sm text-gray-200" : "text-sm text-gray-500"}>{label}</span>
        </div>
      ))}
    </div>
  );
}
