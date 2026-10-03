import { Check, TriangleAlert, CircleHelp, Loader2 } from "lucide-react";
import { cx } from "../../utils/format";

// NOTE: these labels intentionally say "Model:" rather than "Verified" --
// this is ONLY the MuRIL text classifier's prediction (a style/pattern
// judgment), not an independently fact-checked result. See
// VerificationBadge.jsx for the separate, actually-verified signal, and
// OverallAssessment (rendered above both in AnalysisPanel) for the combined
// final call.
const CONFIG = {
  real: {
    label: "Model: Likely real",
    Icon: Check,
    color: "text-real",
    border: "border-real/40",
    bg: "bg-real-soft",
  },
  fake: {
    label: "Model: Disputed",
    Icon: TriangleAlert,
    color: "text-fake",
    border: "border-fake/40",
    bg: "bg-fake-soft",
  },
  uncertain: {
    label: "Model: Needs context",
    Icon: CircleHelp,
    color: "text-uncertain",
    border: "border-uncertain/40",
    bg: "bg-uncertain-soft",
  },
};

export default function VerdictStamp({ verdict, status = "analyzed", size = "sm", className = "" }) {
  if (status === "processing") {
    return (
      <span
        className={cx(
          "inline-flex items-center gap-1.5 rounded-full border border-border-strong px-2.5 py-1 text-text-faint",
          size === "lg" ? "text-sm" : "text-[11px]",
          className
        )}
      >
        <Loader2 size={size === "lg" ? 14 : 12} className="animate-spin" />
        Analyzing…
      </span>
    );
  }

  const cfg = CONFIG[verdict] ?? CONFIG.uncertain;
  const { Icon } = cfg;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium leading-none",
        cfg.border,
        cfg.bg,
        cfg.color,
        size === "lg" ? "px-3.5 py-1.5 text-sm" : "text-[11px]",
        className
      )}
    >
      <Icon size={size === "lg" ? 15 : 12} strokeWidth={2.2} />
      {cfg.label}
    </span>
  );
}
