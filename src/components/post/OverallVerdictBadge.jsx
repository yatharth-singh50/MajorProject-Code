import { Check, TriangleAlert, CircleHelp, Loader2 } from "lucide-react";
import { cx } from "../../utils/format";

// THE primary verdict badge shown on a post -- driven by the backend's
// weighted overallAssessment (model classification + live evidence
// reconciled, with evidence taking precedence when it's decisive), NOT the
// raw MuRIL-only prediction. MuRIL alone only detects writing-style
// patterns and is trivially fooled by a formally-worded false claim --
// showing its opinion as the main badge regardless of what live evidence
// found was a real, reported UX bug. The model-only verdict is still
// visible, clearly labeled "Model:", inside the expanded "Model
// classification" section (see VerdictStamp.jsx) -- it just isn't the
// headline claim anymore.
const CONFIG = {
  real: { label: "Likely real", Icon: Check, color: "text-real", border: "border-real/40", bg: "bg-real-soft" },
  fake: { label: "Likely fake", Icon: TriangleAlert, color: "text-fake", border: "border-fake/40", bg: "bg-fake-soft" },
  uncertain: {
    label: "Uncertain",
    Icon: CircleHelp,
    color: "text-uncertain",
    border: "border-uncertain/40",
    bg: "bg-uncertain-soft",
  },
};

export default function OverallVerdictBadge({ assessment, status = "analyzed", size = "sm", className = "" }) {
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

  // Shouldn't normally happen once status is "analyzed" -- defensive only.
  if (!assessment) return null;

  const cfg = CONFIG[assessment.label] ?? CONFIG.uncertain;
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
      {cfg.label} · {Math.round(assessment.confidence * 100)}%
    </span>
  );
}