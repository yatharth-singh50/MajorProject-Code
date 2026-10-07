import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Languages, Trash2, Newspaper } from "lucide-react";
import Avatar from "../common/Avatar";
import VerifiedBadge from "../common/VerifiedBadge";
import OverallVerdictBadge from "./OverallVerdictBadge";
import AnalysisPanel from "./AnalysisPanel";
import ActionBar from "./ActionBar";
import MediaGrid from "./MediaGrid";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { timeAgo, cx } from "../../utils/format";

/**
 * onReply(post): optional. When given, the reply button calls it (the thread
 * view uses this to open an inline composer under that exact comment);
 * otherwise it just opens the post.
 */
export default function PostCard({
  post,
  onLike,
  onRepost,
  onDelete,
  onReply,
  interactive = true,
  defaultExpanded = false,
}) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { push } = useToast();

  if (!post) return null;
  const { author, content, translation, language, createdAt, analysis, attachments } = post;

  // You can delete your own posts; site admins can delete anyone's.
  const canDelete = me?.id === post.authorId || me?.isAdmin;

  // Only news posts from ordinary accounts are fact-checked. Replies, plain
  // posts, and posts from verified news/government accounts are "skipped" --
  // nothing honest to put a verdict on, so no badge.
  const isAnalyzable = analysis.status !== "skipped";
  const officialSource =
    !isAnalyzable && post.isNews && ["news", "government"].includes(author.verificationTier);

  const openPost = () => interactive && navigate(`/post/${post.id}`);
  const openProfile = (e) => {
    e.stopPropagation();
    navigate(`/profile/${author.username}`);
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    if (deleting) return;
    const others = me?.id !== post.authorId;
    if (!window.confirm(others ? "Delete this user's post as an admin? This can't be undone." : "Delete this post? This can't be undone.")) return;

    setDeleting(true);
    try {
      await onDelete?.(post.id);
      push("Post deleted");
    } catch (err) {
      push(err.message || "Couldn't delete the post");
      setDeleting(false);
    }
  };

  return (
    <article
      onClick={openPost}
      className={cx(
        "border-b border-border px-4 py-3.5 transition-colors",
        interactive && "cursor-pointer hover:bg-surface-hover/60",
        deleting && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <button onClick={openProfile} className="focus-ring shrink-0 rounded-full">
          <Avatar user={author} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <button onClick={openProfile} className="focus-ring truncate font-semibold text-text hover:underline">
              {author.displayName}
            </button>
            <VerifiedBadge user={author} />
            <span className="truncate text-text-faint">@{author.username}</span>
            <span className="text-text-faint">·</span>
            <span className="shrink-0 text-text-faint">{timeAgo(createdAt)}</span>

            {canDelete && onDelete && (
              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                className="focus-ring ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-faint hover:bg-fake-soft hover:text-fake"
                aria-label="Delete post"
                title={me?.id === post.authorId ? "Delete post" : "Delete post (admin)"}
              >
                <Trash2 size={14} strokeWidth={1.8} />
              </button>
            )}
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

          <MediaGrid attachments={attachments} className="mt-2.5" />

          {isAnalyzable && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <OverallVerdictBadge
                assessment={analysis.overallAssessment}
                verificationStatus={analysis.verificationStatus}
                status={analysis.status}
              />
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
          )}

          {officialSource && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-text-faint">
              <Newspaper size={12} />
              Official {author.verificationTier === "government" ? "government" : "news"} source — not run through
              the fact-checker
            </p>
          )}

          {isAnalyzable && expanded && (
            <div onClick={(e) => e.stopPropagation()} className="mt-2.5">
              <AnalysisPanel analysis={analysis} language={language} />
            </div>
          )}

          <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
            <ActionBar
              post={post}
              onLike={() => onLike?.(post.id)}
              onRepost={() => onRepost?.(post.id)}
              onReply={onReply ? () => onReply(post) : openPost}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
