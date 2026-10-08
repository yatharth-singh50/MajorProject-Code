import { recordViews } from "./api";

// Batches "this post was seen" reports. Scrolling past ten posts becomes one
// request rather than ten, and each post is reported at most once per page
// load (the server also de-duplicates per person per half hour).

const seen = new Set(); // posts already reported this session
const waiting = new Map(); // postId -> [resolve, ...]
let timer = null;

async function flush() {
  clearTimeout(timer);
  timer = null;
  const batch = [...waiting.entries()];
  waiting.clear();
  if (batch.length === 0) return;

  try {
    const { counts } = await recordViews(batch.map(([id]) => id));
    batch.forEach(([id, resolvers]) => resolvers.forEach((resolve) => resolve(counts?.[id])));
  } catch {
    // Network blip: allow these to be counted the next time they're seen.
    batch.forEach(([id, resolvers]) => {
      seen.delete(id);
      resolvers.forEach((resolve) => resolve(undefined));
    });
  }
}

/**
 * Report that `postId` was seen. Resolves to the post's new view count, or
 * undefined if it was already reported this session / the request failed.
 * `immediate` skips the batching delay (used when a post is opened).
 */
export function trackView(postId, { immediate = false } = {}) {
  if (!postId || seen.has(postId)) return Promise.resolve(undefined);
  seen.add(postId);

  return new Promise((resolve) => {
    waiting.set(postId, [...(waiting.get(postId) || []), resolve]);
    if (immediate || waiting.size >= 50) flush();
    else if (!timer) timer = setTimeout(flush, 1200);
  });
}