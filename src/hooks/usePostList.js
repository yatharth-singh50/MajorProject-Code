import { useCallback, useEffect, useState } from "react";
import { toggleLike, toggleRepost, deletePost, onPostUpdated, onPostDeleted } from "../services/api";

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

  // Re-fetch in place, without blanking the list to a skeleton first -- for
  // "something changed in this conversation" updates (a new reply landed).
  const refresh = useCallback(() => {
    fetcher()
      .then(setPosts)
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Keep this list in sync with changes made elsewhere (a like tapped from
  // another view, an analysis result completing after a post left the
  // "processing" state, etc.) — no-ops if the id isn't in this list.
  useEffect(() => {
    return onPostUpdated((updated) => {
      setPosts((prev) => (prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev));
    });
  }, []);

  // A delete elsewhere (another tab, or this one) cascades to replies on
  // the backend and broadcasts every id removed -- drop all of them from
  // whatever list this hook is showing, parent or child alike.
  useEffect(() => {
    return onPostDeleted((ids) => {
      setPosts((prev) => (prev ? prev.filter((p) => !ids.includes(p.id)) : prev));
    });
  }, []);

  const patchPost = useCallback((id, patch) => {
    setPosts((prev) => (prev ? prev.map((p) => (p.id === id ? { ...p, ...patch } : p)) : prev));
  }, []);

  const prependPost = useCallback((post) => {
    setPosts((prev) => (prev ? [post, ...prev] : prev));
  }, []);

  const removePost = useCallback((id) => {
    setPosts((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
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

  const handleDelete = useCallback(async (id) => {
    // optimistic -- the onPostDeleted broadcast above will also remove it
    // (and any sibling replies) from every other open list, this just
    // avoids waiting on the round trip for the list the click happened in.
    const previous = posts;
    removePost(id);
    try {
      await deletePost(id);
    } catch (e) {
      setPosts(previous);
      throw e;
    }
  }, [posts, removePost]);

  return { posts, error, reload, refresh, patchPost, prependPost, removePost, handleLike, handleRepost, handleDelete };
}
