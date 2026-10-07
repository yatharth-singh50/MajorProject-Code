import { Check, TriangleAlert, CircleHelp, Loader2 } from "lucide-react";
import { cx } from "../../utils/format";

// THE headline badge on a post. Driven by the backend's overallAssessment
// (live evidence decides; the MuRIL text-pattern prediction never does).
// It is deliberately NOT the raw model verdict -- MuRIL only sees writing
// style and is easily fooled by a formally worded false claim.
//
// "uncertain" is shown in plain words instead of a percentage, because a
// number like "35%" means nothing to a reader:
//   - nothing found / never checked  -> "Unverified · may be fake"
//   - evidence conflicts             -> "Disputed"
const STYLE = {
  real: { Icon: Check, color: "text-real", border: "border-real/40", bg: "bg-real-soft" },
  fake: { Icon: TriangleAlert, color: "text-fake", border: "border-fake/40", bg: "bg-fake-soft" },
  uncertain: { Icon: CircleHelp, color: "text-uncertain", border: "border-uncertain/40", bg: "bg-uncertain-soft" },
};

export function overallLabel(assessment, verificationStatus) {
  if (!assessment) return "";
  if (assessment.label === "real") return `Likely real · ${Math.round(assessment.confidence * 100)}%`;
  if (assessment.label === "fake") return `Likely fake · ${Math.round(assessment.confidence * 100)}%`;
  return verificationStatus === "mixed" ? "Disputed" : "Unverified · may be fake";
}

export default function OverallVerdictBadge({
  assessment,
  verificationStatus,
  status = "analyzed",
  size = "sm",
  className = "",
}) {
  if (status === "skipped") return null;

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

  if (!assessment) return null;

  const cfg = STYLE[assessment.label] ?? STYLE.uncertain;
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
      {overallLabel(assessment, verificationStatus)}
    </span>
  );
}
