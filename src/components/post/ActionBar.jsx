import { Heart, MessageCircle, Repeat2, BarChart2 } from "lucide-react";
import { compactNumber } from "../../utils/format";
import { cx } from "../../utils/format";

export default function ActionBar({ post, onLike, onRepost, onReply, compact = false }) {
  const { stats, likedByMe, repostedByMe } = post;

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn?.();
  };

  return (
    <div className={cx("flex max-w-md items-center justify-between text-text-faint", compact ? "-ml-2" : "")}>
      <button
        onClick={stop(onReply)}
        className="focus-ring group flex items-center gap-1.5 rounded-full p-2 transition-colors hover:text-brand"
        aria-label="Reply"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-brand-soft">
          <MessageCircle size={17} strokeWidth={1.8} />
        </span>
        <span className="text-[13px]">{compactNumber(stats.comments)}</span>
      </button>

      <button
        onClick={stop(onRepost)}
        className={cx(
          "focus-ring group flex items-center gap-1.5 rounded-full p-2 transition-colors hover:text-real",
          repostedByMe && "text-real"
        )}
        aria-label="Repost"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-real-soft">
          <Repeat2 size={18} strokeWidth={1.8} />
        </span>
        <span className="text-[13px]">{compactNumber(stats.reposts)}</span>
      </button>

      <button
        onClick={stop(onLike)}
        className={cx(
          "focus-ring group flex items-center gap-1.5 rounded-full p-2 transition-colors hover:text-fake",
          likedByMe && "text-fake"
        )}
        aria-label="Like"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-fake-soft">
          <Heart size={17} strokeWidth={1.8} fill={likedByMe ? "currentColor" : "none"} className={likedByMe ? "animate-pop" : ""} />
        </span>
        <span className="text-[13px]">{compactNumber(stats.likes)}</span>
      </button>

      <span className="flex items-center gap-1.5 p-2 text-[13px]">
        <span className="flex h-8 w-8 items-center justify-center">
          <BarChart2 size={16} strokeWidth={1.8} />
        </span>
        {compactNumber(stats.views)}
      </span>
    </div>
  );
}
