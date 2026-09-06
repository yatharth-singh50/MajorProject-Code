import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, ChevronDown, Languages } from "lucide-react";
import Avatar from "../common/Avatar";
import VerdictStamp from "./VerdictStamp";
import AnalysisPanel from "./AnalysisPanel";
import ActionBar from "./ActionBar";
import { timeAgo, cx } from "../../utils/format";

export default function PostCard({ post, onLike, onRepost, interactive = true, defaultExpanded = false }) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();

  if (!post) return null;
  const { author, content, translation, language, createdAt, analysis } = post;

  const openPost = () => interactive && navigate(`/post/${post.id}`);
  const openProfile = (e) => {
    e.stopPropagation();
    navigate(`/profile/${author.username}`);
  };

  return (
    <article
      onClick={openPost}
      className={cx(
        "border-b border-border px-4 py-3.5 transition-colors",
        interactive && "cursor-pointer hover:bg-surface-hover/60"
      )}
    >
      <div className="flex gap-3">
        <button onClick={openProfile} className="focus-ring shrink-0 rounded-full">
          <Avatar user={author} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <button onClick={openProfile} className="focus-ring truncate font-semibold text-text hover:underline">
              {author.displayName}
            </button>
            {author.platformVerified && (
              <BadgeCheck size={15} className="shrink-0 fill-brand text-bg" strokeWidth={0} />
            )}
            <span className="truncate text-text-faint">@{author.username}</span>
            <span className="text-text-faint">·</span>
            <span className="shrink-0 text-text-faint">{timeAgo(createdAt)}</span>
          </div>

          <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-normal text-text">
            {showTranslation && translation ? translation : content}
          </p>

          {translation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTranslation((s) => !s);
              }}
              className="focus-ring mt-1 flex items-center gap-1 text-[13px] text-brand hover:underline"
            >
              <Languages size={12} />
              {showTranslation ? "Show original" : "See translation"}
            </button>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <VerdictStamp verdict={analysis.verdict} status={analysis.status} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((s) => !s);
              }}
              className="focus-ring flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-text-faint hover:bg-surface-hover hover:text-text-dim"
            >
              {expanded ? "Hide details" : "Verification details"}
              <ChevronDown size={12} className={cx("transition-transform", expanded && "rotate-180")} />
            </button>
          </div>

          {expanded && (
            <div onClick={(e) => e.stopPropagation()} className="mt-2.5">
              <AnalysisPanel analysis={analysis} language={language} />
            </div>
          )}

          <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
            <ActionBar post={post} onLike={() => onLike?.(post.id)} onRepost={() => onRepost?.(post.id)} onReply={openPost} />
          </div>
        </div>
      </div>
    </article>
  );
}
