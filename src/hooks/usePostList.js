import { useCallback, useEffect, useState } from "react";
import { toggleLike, toggleRepost, onPostUpdated } from "../services/api";

export function usePostList(fetcher, deps = []) {
  const [posts, setPosts] = useState(null); // null = loading
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    setPosts(null);
    fetcher()
      .then(setPosts)
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  // Keep this list in sync with changes made elsewhere (a like tapped from
  // another view, an analysis result completing after a post left the
  // "processing" state, etc.) — no-ops if the id isn't in this list.
  useEffect(() => {
    return onPostUpdated((updated) => {
      setPosts((prev) => (prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev));
    });
  }, []);

  const patchPost = useCallback((id, patch) => {
    setPosts((prev) => (prev ? prev.map((p) => (p.id === id ? { ...p, ...patch } : p)) : prev));
  }, []);

  const prependPost = useCallback((post) => {
    setPosts((prev) => (prev ? [post, ...prev] : prev));
  }, []);

  const handleLike = useCallback(async (id) => {
    // optimistic
    setPosts((prev) =>
      prev
        ? prev.map((p) =>
            p.id === id
              ? { ...p, likedByMe: !p.likedByMe, stats: { ...p.stats, likes: p.stats.likes + (p.likedByMe ? -1 : 1) } }
              : p
          )
        : prev
    );
    try {
      const updated = await toggleLike(id);
      patchPost(id, updated);
    } catch {
      reload();
    }
  }, [patchPost, reload]);

  const handleRepost = useCallback(async (id) => {
    setPosts((prev) =>
      prev
        ? prev.map((p) =>
            p.id === id
              ? { ...p, repostedByMe: !p.repostedByMe, stats: { ...p.stats, reposts: p.stats.reposts + (p.repostedByMe ? -1 : 1) } }
              : p
          )
        : prev
    );
    try {
      const updated = await toggleRepost(id);
      patchPost(id, updated);
    } catch {
      reload();
    }
  }, [patchPost, reload]);

  return { posts, error, reload, patchPost, prependPost, handleLike, handleRepost };
}
