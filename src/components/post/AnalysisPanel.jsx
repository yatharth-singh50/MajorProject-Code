import { Cpu, ExternalLink, Search, Scale } from "lucide-react";
import VerdictStamp from "./VerdictStamp";
import VerificationBadge from "./VerificationBadge";
import { cx } from "../../utils/format";

const STAGE_LABELS = {
  lang_id: "Language ID",
  small_lm: "Small LM triage",
  transformer: "Transformer classifier",
  claim_extraction: "Claim extraction",
  evidence_retrieval: "Evidence retrieval",
  verification: "Real-time verification",
};

const BAR_COLOR = {
  real: "bg-real",
  fake: "bg-fake",
  uncertain: "bg-uncertain",
};

const OVERALL_STYLE = {
  real: { text: "text-real", bg: "bg-real-soft", border: "border-real/40", word: "Likely real" },
  fake: { text: "text-fake", bg: "bg-fake-soft", border: "border-fake/40", word: "Likely fake" },
  uncertain: { text: "text-uncertain", bg: "bg-uncertain-soft", border: "border-uncertain/40", word: "Uncertain" },
};

export default function AnalysisPanel({ analysis, language, className = "" }) {
  const {
    status,
    verdict,
    confidence,
    model,
    explanation,
    matchedClaims,
    pipeline,
    verificationStatus,
    extractedClaim,
    overallAssessment,
  } = analysis;

  return (
    <div className={cx("rounded-xl border border-border bg-bg-inset p-4", className)}>
      {/* --- OVERALL ASSESSMENT -----------------------------------------
          A derived, combined call: when live evidence actually contradicts
          or supports the claim, it dominates here regardless of how
          confident the model-only classification was -- that confidence
          number alone is never the final word. See ml_pipeline.py's
          _compute_overall_assessment for the precedence rules. */}
      {status !== "processing" && overallAssessment && (
        <div
          className={cx(
            "mb-4 rounded-lg border p-3",
            OVERALL_STYLE[overallAssessment.label]?.bg,
            OVERALL_STYLE[overallAssessment.label]?.border
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
              <Scale size={12} />
              Overall assessment
            </span>
            <span className={cx("text-[12px] font-semibold", OVERALL_STYLE[overallAssessment.label]?.text)}>
              {OVERALL_STYLE[overallAssessment.label]?.word} · {Math.round(overallAssessment.confidence * 100)}%
            </span>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-text-dim">{overallAssessment.reason}</p>
        </div>
      )}

      {/* --- MODEL CLASSIFICATION ---------------------------------------
          MuRIL's text-pattern prediction only. Never implies the claim
          was independently fact-checked -- see the section below for that. */}
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text-faint">
        Model classification
      </div>
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
              {pipeline.map((step, i) => (
                <li key={`${step.stage}-${i}`} className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-text-faint">{step.label}</span>
                  <span className="text-right text-text-dim">{step.detail}</span>
                </li>
              ))}
            </ul>
          )}

          {/* --- FACTUAL VERIFICATION -------------------------------------
              A SEPARATE signal: live evidence retrieval + a model judging
              the claim against it. Can agree or disagree with the model
              classification above -- the Overall assessment banner at the
              top is where the two get reconciled, not here. */}
          <div className="mt-4 border-t border-border pt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-faint">
                Factual verification
              </span>
              <VerificationBadge status={verificationStatus} />
            </div>

            {extractedClaim?.claim && (
              <p className="mb-2 flex items-start gap-1.5 text-[12px] text-text-dim">
                <Search size={12} className="mt-0.5 shrink-0 text-text-faint" />
                <span>Claim checked: "{extractedClaim.claim}"</span>
              </p>
            )}

            {matchedClaims?.length > 0 ? (
              <ul className="space-y-1.5">
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
            ) : (
              <p className="text-[12px] text-text-faint">
                {verificationStatus === "unavailable"
                  ? "Live fact-checking hasn't run for this post."
                  : "No specific sources were matched to this claim."}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
