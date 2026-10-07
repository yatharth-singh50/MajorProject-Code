import { Link } from "react-router-dom";
import { ExternalLink, Search, ShieldCheck, Image as ImageGlyph } from "lucide-react";
import OverallVerdictBadge from "./OverallVerdictBadge";
import VerificationBadge from "./VerificationBadge";
import { cx } from "../../utils/format";

const STAGE_LABELS = {
  lang_id: "Language ID",
  small_lm: "Triage",
  transformer: "Text-pattern model",
  claim_extraction: "Claim extraction",
  evidence_retrieval: "Evidence search",
  verification: "Fact-check",
};

const BANNER = {
  real: "border-real/40 bg-real-soft",
  fake: "border-fake/40 bg-fake-soft",
  uncertain: "border-uncertain/40 bg-uncertain-soft",
};

const LEANED = { real: "real", fake: "fake", uncertain: "unsure" };

// Layout, top to bottom:
//   1. The actual result of the analysis (live evidence decides)
//   2. The evidence itself -- what was checked, and clickable sources
//   3. Small print: how it was checked, including the MuRIL text-pattern
//      model as one muted line. It is a style detector, not a fact-check,
//      so it must never read like the headline.
export default function AnalysisPanel({ analysis, className = "" }) {
  const {
    status,
    verdict,
    confidence,
    model,
    matchedClaims,
    pipeline,
    verificationStatus,
    extractedClaim,
    imageUnderstanding,
    overallAssessment,
  } = analysis;

  if (status === "processing") {
    return (
      <div className={cx("rounded-xl border border-border bg-bg-inset p-4", className)}>
        <OverallVerdictBadge status="processing" size="lg" />
        <ul className="mt-3 space-y-2">
          {["lang_id", "transformer", "claim_extraction", "evidence_retrieval"].map((stage, i) => (
            <li key={stage} className="flex items-center gap-2 text-xs text-text-dim">
              <span
                className={cx("h-1.5 w-1.5 rounded-full", i === 0 ? "bg-brand animate-pulse-soft" : "bg-border-strong")}
              />
              {STAGE_LABELS[stage]}…
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={cx("rounded-xl border border-border bg-bg-inset p-4", className)}>
      {/* 1. RESULT ------------------------------------------------------ */}
      {overallAssessment && (
        <div className={cx("rounded-lg border p-3", BANNER[overallAssessment.label] ?? BANNER.uncertain)}>
          <OverallVerdictBadge
            assessment={overallAssessment}
            verificationStatus={verificationStatus}
            status={status}
            size="lg"
          />
          <p className="mt-2 text-[14px] leading-relaxed text-text">{overallAssessment.reason}</p>
        </div>
      )}

      {/* 2. EVIDENCE ---------------------------------------------------- */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-faint">Evidence checked</span>
          <VerificationBadge status={verificationStatus} />
        </div>

        {extractedClaim?.claim && (
          <p className="mb-2 flex items-start gap-1.5 text-[12px] text-text-dim">
            <Search size={12} className="mt-0.5 shrink-0 text-text-faint" />
            <span>Claim checked: "{extractedClaim.claim}"</span>
          </p>
        )}

        {matchedClaims?.length > 0 ? (
          <ul className="space-y-3">
            {matchedClaims.map((c, i) => {
              // Platform posts link inside the app; websites open in a new tab.
              const internal = c.url?.startsWith("/");
              const label = (
                <>
                  <ExternalLink size={11} className="shrink-0 text-text-faint" />
                  <span className="truncate">{c.title}</span>
                </>
              );
              const linkClass = "flex min-w-0 items-center gap-1.5 text-text-dim hover:text-brand hover:underline";
              return (
                <li key={i} className="text-xs">
                  <div className="flex items-center justify-between gap-3">
                    {!c.url ? (
                      <span className="flex min-w-0 items-center gap-1.5 text-text-dim">{label}</span>
                    ) : internal ? (
                      <Link to={c.url} onClick={(e) => e.stopPropagation()} className={linkClass} title={c.title}>
                        {label}
                      </Link>
                    ) : (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={linkClass}
                        title={c.url}
                      >
                        {label}
                      </a>
                    )}
                    <span
                      className={cx(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        c.stance === "supports" ? "bg-real-soft text-real" : "bg-fake-soft text-fake"
                      )}
                    >
                      {c.stance === "supports" ? "Supports" : "Contradicts"}
                    </span>
                  </div>

                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 pl-[17px] text-[11px] text-text-faint">
                    {c.official ? (
                      <span className="inline-flex items-center gap-1 font-medium text-brand">
                        <ShieldCheck size={11} />
                        {c.source}
                      </span>
                    ) : (
                      <span>{c.source}</span>
                    )}
                    {c.read && !c.official && <span>· read in full</span>}
                  </p>

                  {c.quote && (
                    <p className="ml-[17px] mt-1 border-l-2 border-border pl-2 text-[12px] italic leading-snug text-text-dim">
                      “{c.quote}”
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[12px] text-text-faint">
            {verificationStatus === "unavailable"
              ? "Live fact-checking hasn't run for this post."
              : "No sources clearly confirmed or refuted this claim."}
          </p>
        )}
      </div>

      {/* Text read from an attached image by the vision model */}
      {imageUnderstanding?.ocrText && (
        <div className="mt-4">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-faint">
            <ImageGlyph size={11} />
            Read from image
          </span>
          <p className="line-clamp-6 whitespace-pre-wrap text-[12px] leading-relaxed text-text-dim">
            {imageUnderstanding.ocrText}
          </p>
        </div>
      )}

      {/* 3. SMALL PRINT ------------------------------------------------- */}
      <div className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-text-faint">
        {typeof confidence === "number" && (
          <p>
            Text-pattern model ({model}) leaned <strong className="font-medium">{LEANED[verdict] ?? "unsure"}</strong> (
            {Math.round(confidence * 100)}%). It only reads writing style and can't tell whether a claim is true, so it
            doesn't affect the result above.
          </p>
        )}
        {pipeline?.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {pipeline.map((step, i) => (
              <li key={`${step.stage}-${i}`} className="flex items-start justify-between gap-3">
                <span>{step.label}</span>
                <span className="text-right">{step.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
