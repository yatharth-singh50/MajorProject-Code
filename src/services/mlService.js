// ---------------------------------------------------------------------------
// This module simulates the model pipeline described in the project brief:
//   1. Language identification
//   2. Small language model triage (cheap first pass)
//   3. Transformer classifier (full verification)
//
// SWAP POINT: replace `runPipeline()` with a call to your real backend, e.g.
//
//   export async function runPipeline(content) {
//     const res = await fetch(`${API_BASE}/analyze`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text: content }),
//     });
//     return res.json(); // must match the shape below
//   }
//
// Expected return shape (this is the contract the UI depends on):
// {
//   verdict: 'real' | 'fake' | 'uncertain',
//   confidence: number,        // 0..1
//   model: string,              // model name/version shown in UI
//   explanation: string,
//   matchedClaims: [{ title, source, stance }],
//   pipeline: [{ stage, label, detail }]   // shown in the live analysis panel
// }
// ---------------------------------------------------------------------------

import { LANGUAGES } from "./mockData";

const FAKE_SIGNALS = [
  "breaking",
  "share before it's deleted",
  "govt hiding",
  "forward to everyone",
  "not on the news",
  "बंद",
  "अफवाह",
  "वायरல்",
  "விடுமுறை",
];

const detectLanguage = (text) => {
  const scripts = [
    { code: "hi", re: /[\u0900-\u097F]/ },
    { code: "bn", re: /[\u0980-\u09FF]/ },
    { code: "ta", re: /[\u0B80-\u0BFF]/ },
    { code: "gu", re: /[\u0A80-\u0AFF]/ },
    { code: "ml", re: /[\u0D00-\u0D7F]/ },
  ];
  const hit = scripts.find((s) => s.re.test(text));
  const code = hit ? hit.code : "en";
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function heuristicScore(text) {
  const lower = text.toLowerCase();
  let score = 0.5;
  FAKE_SIGNALS.forEach((sig) => {
    if (lower.includes(sig.toLowerCase())) score += 0.14;
  });
  if (/[!?]{2,}/.test(text)) score += 0.08;
  if (text.length < 40) score -= 0.05;
  // gentle deterministic jitter so repeated identical text doesn't always
  // land on exactly the same number
  const jitter = (text.length % 7) / 100;
  return clamp(score + jitter, 0.05, 0.97);
}

export async function runPipeline(content, { onStage } = {}) {
  const language = detectLanguage(content);
  const stages = [
    { stage: "lang_id", label: "Language identified", delay: 350 },
    { stage: "small_lm", label: "Small LM triage", delay: 550 },
    { stage: "transformer", label: "Transformer classification", delay: 750 },
  ];

  for (const s of stages) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, s.delay));
    onStage?.(s.stage);
  }

  const rawScore = heuristicScore(content);
  let verdict = "uncertain";
  if (rawScore >= 0.66) verdict = "fake";
  else if (rawScore <= 0.35) verdict = "real";

  const confidence =
    verdict === "uncertain" ? clamp(1 - Math.abs(rawScore - 0.5) * 2, 0.3, 0.6) : clamp(rawScore, 0.55, 0.97);

  const explanations = {
    fake: "Language patterns and structure closely match previously flagged misinformation templates (urgency cues, unverifiable calls to forward). No corroborating source found.",
    real: "No high-risk misinformation markers detected. Claim structure resembles verified reporting patterns in the training set.",
    uncertain: "Statement reads as opinion, personal experience, or a claim without enough specific, checkable detail for a confident verdict.",
  };

  return {
    verdict,
    confidence: Number(confidence.toFixed(2)),
    model: "IndicBERT-FND v0.4",
    language,
    explanation: explanations[verdict],
    matchedClaims: [],
    pipeline: [
      { stage: "lang_id", label: "Language identification", detail: `Detected ${language.name}` },
      { stage: "small_lm", label: "Small LM triage", detail: verdict === "uncertain" ? "Low newsworthiness — flagged low priority" : "Passed to full classifier" },
      { stage: "transformer", label: "Transformer classifier", detail: `${(confidence * 100).toFixed(0)}% confidence` },
    ],
  };
}
