import { Check, TriangleAlert, CircleHelp, Loader2 } from "lucide-react";
import { cx } from "../../utils/format";

const CONFIG = {
  real: {
    label: "Verified real",
    Icon: Check,
    color: "text-real",
    border: "border-real/45",
    bg: "bg-real-soft",
    rot: "-rotate-2",
  },
  fake: {
    label: "Disputed",
    Icon: TriangleAlert,
    color: "text-fake",
    border: "border-fake/45",
    bg: "bg-fake-soft",
    rot: "rotate-2",
  },
  uncertain: {
    label: "Needs context",
    Icon: CircleHelp,
    color: "text-uncertain",
    border: "border-uncertain/45",
    bg: "bg-uncertain-soft",
    rot: "-rotate-1",
  },
};

export default function VerdictStamp({ verdict, status = "analyzed", size = "sm", className = "" }) {
  if (status === "processing") {
    return (
      <span
        className={cx(
          "inline-flex items-center gap-1.5 rounded-full border border-dashed border-border-strong px-2.5 py-1 font-serif italic text-text-faint",
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
        "inline-flex items-center gap-1.5 rounded-full border-2 border-dashed px-2.5 py-1 font-serif italic leading-none",
        cfg.border,
        cfg.bg,
        cfg.color,
        cfg.rot,
        size === "lg" ? "text-sm px-3.5 py-1.5" : "text-[11px]",
        className
      )}
    >
      <Icon size={size === "lg" ? 15 : 12} strokeWidth={2.4} />
      {cfg.label}
    </span>
  );
}
