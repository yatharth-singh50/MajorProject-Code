import { useEffect, useRef, useState } from "react";
import { trackView } from "../services/viewTracker";

/**
 * Counts a view when a post has actually been on screen for a moment.
 *
 *   const [ref, views] = useViewTracking(post.id, post.stats.views);
 *   <article ref={ref}> ... {views} ...
 *
 * "On screen" = at least 30% of the card visible for 800ms, so quickly
 * flicking past doesn't count and a card taller than the viewport still can.
 * `views` starts at the number from the server and bumps when ours is counted.
 */
export function useViewTracking(postId, initialViews = 0) {
  const ref = useRef(null);
  const [views, setViews] = useState(initialViews);

  // Pick up newer numbers pushed in from outside (e.g. a refetch).
  useEffect(() => {
    setViews((v) => Math.max(v, initialViews));
  }, [initialViews]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !postId || typeof IntersectionObserver === "undefined") return undefined;

    let dwell = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          dwell = setTimeout(() => {
            trackView(postId).then((count) => count && setViews((v) => Math.max(v, count)));
          }, 800);
        } else if (dwell) {
          clearTimeout(dwell);
          dwell = null;
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (dwell) clearTimeout(dwell);
    };
  }, [postId]);

  return [ref, views];
}