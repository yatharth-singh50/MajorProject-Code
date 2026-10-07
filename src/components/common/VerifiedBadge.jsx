import { Check, ShieldCheck } from "lucide-react";
import { cx } from "../../utils/format";

// The tick next to a name. Which colour = what kind of account:
//   gold   -- a verified person (like a blue tick), yellow
//   news   -- a verified news channel, red
//   government -- an official government handle, green
//   company -- an established company, black (white in dark mode)
//   admin  -- a Sāthi admin: gold tick plus the little Sāthi shield
// News and government accounts skip the fact-check pipeline, so their
// posts have no verdict badge -- the tick is what tells you why.
const TIERS = {
  admin: { label: "Sāthi admin · verified", cls: "bg-[#E8B100] text-white" },
  gold: { label: "Verified account", cls: "bg-[#E8B100] text-white" },
  news: { label: "Verified news account", cls: "bg-[#E5484D] text-white" },
  government: { label: "Official government account", cls: "bg-[#2EA043] text-white" },
  company: { label: "Verified company", cls: "bg-text text-bg ring-1 ring-border-strong" },
};

export default function VerifiedBadge({ user, size = 15, className = "" }) {
  // `platformVerified` without a tier is the old boolean flag -- show it as gold.
  const tier = user?.verificationTier || (user?.platformVerified ? "gold" : null);
  const cfg = TIERS[tier];
  if (!cfg) return null;

  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1", className)} title={cfg.label}>
      <span
        className={cx("inline-flex items-center justify-center rounded-full", cfg.cls)}
        style={{ width: size, height: size }}
        aria-label={cfg.label}
      >
        <Check size={Math.round(size * 0.68)} strokeWidth={3.4} />
      </span>
      {tier === "admin" && (
        <ShieldCheck size={size} strokeWidth={2.1} className="text-brand" aria-label="Sāthi" />
      )}
    </span>
  );
}

export const TIER_OPTIONS = [
  { value: "", label: "Not verified" },
  { value: "gold", label: "Verified (yellow)" },
  { value: "news", label: "Verified News Account (red)" },
  { value: "government", label: "Government (green)" },
  { value: "company", label: "Company (black/white)" },
];
