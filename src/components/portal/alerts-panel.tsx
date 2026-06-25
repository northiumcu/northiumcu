import { ShieldCheck } from "lucide-react";

export function AlertsPanel() {
  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/80 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
          <ShieldCheck className="size-6" />
        </span>
        <p className="mt-4 font-heading text-base font-semibold text-northium-primary">
          All clear
        </p>
        <p className="mt-2 text-sm text-northium-muted">
          No security alerts right now. Important account notifications will appear
          here.
        </p>
      </div>
    </div>
  );
}
