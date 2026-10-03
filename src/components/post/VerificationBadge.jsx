import { ShieldCheck, ShieldX, ShieldAlert, ShieldQuestion, ShieldOff } from "lucide-react";
import { cx } from "../../utils/format";

// A SEPARATE signal from VerdictStamp -- this is the result of actually
// retrieving live evidence (DuckDuckGo) and having a model judge the claim
// against it, not the MuRIL text classifier's prediction. The two can
// disagree; never collapse them into one badge.
const CONFIG = {
  supported: {
    label: "Evidence: Supported",
    Icon: ShieldCheck,
    color: "text-real",
    bg: "bg-real-soft",
    border: "border-real/40",
  },
  contradicted: {
    label: "Evidence: Contradicted",
    Icon: ShieldX,
    color: "text-fake",
    bg: "bg-fake-soft",
    border: "border-fake/40",
  },
  mixed: {
    label: "Evidence: Mixed",
    Icon: ShieldAlert,
    color: "text-uncertain",
    bg: "bg-uncertain-soft",
    border: "border-uncertain/40",
  },
  insufficient: {
    label: "Evidence: Insufficient",
    Icon: ShieldQuestion,
    color: "text-text-dim",
    bg: "bg-bg-inset",
    border: "border-border",
  },
  unavailable: {
    label: "Evidence: Not checked",
    Icon: ShieldOff,
    color: "text-text-faint",
    bg: "bg-bg-inset",
    border: "border-border",
  },
};

export default function VerificationBadge({ status = "unavailable", size = "sm", className = "" }) {
  const cfg = CONFIG[status] ?? CONFIG.unavailable;
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
