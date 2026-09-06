import { Cpu, ExternalLink } from "lucide-react";
import VerdictStamp from "./VerdictStamp";
import { cx } from "../../utils/format";

const STAGE_LABELS = {
  lang_id: "Language ID",
  small_lm: "Small LM triage",
  transformer: "Transformer classifier",
};

const BAR_COLOR = {
  real: "bg-real",
  fake: "bg-fake",
  uncertain: "bg-uncertain",
};

export default function AnalysisPanel({ analysis, language, className = "" }) {
  const { status, verdict, confidence, model, explanation, matchedClaims, pipeline } = analysis;

  return (
    <div className={cx("rounded-xl border border-border bg-bg-inset p-4", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <VerdictStamp verdict={verdict} status={status} size="lg" />
        <span className="inline-flex items-center gap-1.5 text-[11px] text-text-faint">
          <Cpu size={12} />
          {model}
        </span>
      </div>

      {status === "processing" ? (
        <ul className="space-y-2">
          {["lang_id", "small_lm", "transformer"].map((stage, i) => (
            <li key={stage} className="flex items-center gap-2 text-xs text-text-dim">
              <span
                className={cx(
                  "h-1.5 w-1.5 rounded-full",
                  i === 0 ? "bg-brand animate-pulse-soft" : "bg-border-strong"
                )}
              />
              {STAGE_LABELS[stage]}…
            </li>
          ))}
        </ul>
      ) : (
        <>
          {typeof confidence === "number" && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-text-faint">
                <span>Model confidence</span>
                <span>{Math.round(confidence * 100)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={cx("h-full rounded-full transition-all duration-700", BAR_COLOR[verdict])}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-[13px] leading-relaxed text-text-dim">{explanation}</p>

          {pipeline?.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
              {pipeline.map((step) => (
                <li key={step.stage} className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-text-faint">{step.label}</span>
                  <span className="text-right text-text-dim">{step.detail}</span>
                </li>
              ))}
            </ul>
          )}

          {matchedClaims?.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
              {matchedClaims.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-text-dim">
                    <ExternalLink size={11} className="shrink-0 text-text-faint" />
                    {c.title}
                  </span>
                  <span
                    className={cx(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      c.stance === "supports" ? "bg-real-soft text-real" : "bg-fake-soft text-fake"
                    )}
                  >
                    {c.stance === "supports" ? "Supports" : "Contradicts"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
