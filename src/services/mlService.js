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

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function runPipeline(content) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: content }),
  });
  return res.json();
}
