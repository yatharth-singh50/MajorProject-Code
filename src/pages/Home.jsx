import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import PostCard from "../components/post/PostCard";
import ComposeBox from "../components/post/ComposeBox";
import { PostSkeleton } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { usePostList } from "../hooks/usePostList";
import { getFeed, onPostCreated } from "../services/api";
import { cx } from "../utils/format";

const TABS = ["For you", "Following"];

export default function Home() {
  const [tab, setTab] = useState("For you");
  const { posts, prependPost, handleLike, handleRepost } = usePostList(() => getFeed({ limit: 30 }), []);

  // New top-level posts can come from this page's own composer *or* the
  // global "Post" button in the sidebar/modal — subscribe once so either
  // source lands in the feed instead of wiring prepend through every
  // composer instance individually.
  useEffect(() => {
    return onPostCreated((post) => {
      if (post.parentId === null) prependPost(post);
    });
  }, [prependPost]);

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur">
        <h1 className="px-4 pt-3 font-serif text-xl font-semibold text-text">Home</h1>
        <div className="mt-2 flex">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx(
                "focus-ring relative flex-1 py-3.5 text-[14px] font-medium transition-colors hover:bg-surface-hover",
                tab === t ? "text-text" : "text-text-faint"
              )}
            >
              {t}
              {tab === t && <span className="absolute inset-x-0 bottom-0 mx-auto h-1 w-14 rounded-full bg-brand" />}
            </button>
          ))}
        </div>
      </header>

      <div className="border-b border-border">
        <ComposeBox compact />
      </div>

      {tab === "Following" ? (
        <EmptyState
          icon={Sparkles}
          title="Nothing here yet"
          description="Posts from accounts you follow will show up in this tab. Switch to “For you” to see the full demo feed."
        />
      ) : posts === null ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Be the first to post something." />
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onLike={handleLike} onRepost={handleRepost} />
        ))
      )}
    </div>
  );
}
