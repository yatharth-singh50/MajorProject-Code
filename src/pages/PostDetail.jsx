import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Newspaper } from "lucide-react";
import Avatar from "../components/common/Avatar";
import VerifiedBadge from "../components/common/VerifiedBadge";
import AnalysisPanel from "../components/post/AnalysisPanel";
import ActionBar from "../components/post/ActionBar";
import ComposeBox from "../components/post/ComposeBox";
import MediaGrid from "../components/post/MediaGrid";
import PostCard from "../components/post/PostCard";
import { PostSkeleton } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import {
  getPost,
  getThread,
  toggleLike,
  toggleRepost,
  deletePost,
  onPostUpdated,
  onPostDeleted,
  onPostCreated,
} from "../services/api";
import { usePostList } from "../hooks/usePostList";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fullDate, cx } from "../utils/format";

const MAX_INDENT_LEVELS = 3; // deeper replies keep the same indent so they don't squeeze off-screen

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { push } = useToast();
  const [post, setPost] = useState(null);
  const [ancestors, setAncestors] = useState([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // The comment an inline reply composer is currently open under (null = none).
  const [replyingTo, setReplyingTo] = useState(null);

  // Every reply beneath this post, at any depth, oldest first. The fetcher
  // also captures the ancestors (the posts above this one) from the same call.
  const {
    posts: replies,
    refresh,
    handleLike: likeReply,
    handleRepost: repostReply,
    handleDelete: deleteReply,
  } = usePostList(async () => {
    const thread = await getThread(id);
    setAncestors(thread.ancestors);
    return thread.replies;
  }, [id]);

  useEffect(() => {
    setPost(null);
    setReplyingTo(null);
    getPost(id).then(setPost);
  }, [id]);

  const replyIdsRef = useRef(new Set());
  replyIdsRef.current = new Set((replies || []).map((r) => r.id));

  useEffect(() => {
    return onPostUpdated((updated) => {
      if (updated.id === id) setPost(updated);
      setAncestors((list) => list.map((a) => (a.id === updated.id ? updated : a)));
    });
  }, [id]);

  // If this post (or anything above it) gets deleted, leave rather than
  // showing a stale/broken page.
  useEffect(() => {
    return onPostDeleted((ids) => {
      if (ids.includes(id)) navigate("/", { replace: true });
    });
  }, [id, navigate]);

  // A reply landed anywhere in this conversation (this tab or another user)
  // -> pull the thread again so it shows up in place.
  useEffect(() => {
    return onPostCreated((p) => {
      if (p.parentId && (p.parentId === id || replyIdsRef.current.has(p.parentId))) refresh();
    });
  }, [id, refresh]);

  const handleLike = useCallback(async () => {
    setPost((p) => ({
      ...p,
      likedByMe: !p.likedByMe,
      stats: { ...p.stats, likes: p.stats.likes + (p.likedByMe ? -1 : 1) },
    }));
    const updated = await toggleLike(id);
    setPost((p) => ({ ...p, ...updated }));
  }, [id]);

  const handleRepost = useCallback(async () => {
    setPost((p) => ({
      ...p,
      repostedByMe: !p.repostedByMe,
      stats: { ...p.stats, reposts: p.stats.reposts + (p.repostedByMe ? -1 : 1) },
    }));
    const updated = await toggleRepost(id);
    setPost((p) => ({ ...p, ...updated }));
  }, [id]);

  // Posts above this one aren't in the reply list, so act on them directly.
  const actOnAncestor = (fn) => async (postId) => {
    await fn(postId);
    refresh();
  };

  const handleDeletePost = async () => {
    if (deleting) return;
    const others = me?.id !== post.authorId;
    if (!window.confirm(others ? "Delete this user's post as an admin? This can't be undone." : "Delete this post? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deletePost(id);
      push("Post deleted");
      navigate("/", { replace: true });
    } catch (err) {
      push(err.message || "Couldn't delete the post");
      setDeleting(false);
    }
  };

  const canDelete = post && (me?.id === post.authorId || me?.isAdmin);

  // parentId -> children, plus a lookup so a nested reply can say who it's answering.
  const { byParent, byId } = useMemo(() => {
    const byParent = {};
    const byId = {};
    for (const p of [...ancestors, ...(post ? [post] : []), ...(replies || [])]) byId[p.id] = p;
    for (const r of replies || []) (byParent[r.parentId] ||= []).push(r);
    return { byParent, byId };
  }, [ancestors, post, replies]);

  const renderReplies = (parentId, depth) =>
    (byParent[parentId] || []).map((reply) => {
      const indent = Math.min(depth, MAX_INDENT_LEVELS);
      const parentAuthor = byId[reply.parentId]?.author;
      return (
        <div key={reply.id}>
          <div
            className={cx(indent > 0 && "border-l-2 border-border")}
            style={{ marginLeft: indent * 14 }}
          >
            {depth > 0 && parentAuthor && (
              <p className="px-4 pt-2 text-[12px] text-text-faint">
                Replying to <span className="text-brand">@{parentAuthor.username}</span>
              </p>
            )}
            <PostCard
              post={reply}
              onLike={likeReply}
              onRepost={repostReply}
              onDelete={deleteReply}
              onReply={(p) => setReplyingTo((cur) => (cur?.id === p.id ? null : p))}
            />
            {replyingTo?.id === reply.id && (
              <div className="border-b border-border bg-bg-inset/50">
                <ComposeBox
                  compact
                  autoFocus
                  parentId={reply.id}
                  placeholder={`Reply to @${reply.author.username}`}
                  onCreated={() => {
                    setReplyingTo(null);
                    refresh();
                  }}
                />
              </div>
            )}
          </div>
          {renderReplies(reply.id, depth + 1)}
        </div>
      );
    });

  const isThreadView = ancestors.length > 0;
  const officialSource =
    post && post.analysis.status === "skipped" && post.isNews && ["news", "government"].includes(post.author.verificationTier);

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-5 border-b border-border bg-bg/85 px-3 py-2.5 backdrop-blur">
        <button onClick={() => navigate(-1)} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-hover" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <h1 className="flex-1 font-serif text-lg font-semibold text-text">{isThreadView ? "Thread" : "Post"}</h1>
        {canDelete && (
          <button
            onClick={handleDeletePost}
            disabled={deleting}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-text-faint hover:bg-fake-soft hover:text-fake"
            aria-label="Delete post"
            title={me?.id === post.authorId ? "Delete post" : "Delete post (admin)"}
          >
            <Trash2 size={17} strokeWidth={1.8} />
          </button>
        )}
      </header>

      {/* The conversation above this post, root first. */}
      {ancestors.map((a) => (
        <div key={a.id} className="relative">
          <span className="pointer-events-none absolute bottom-0 left-[2.1rem] top-14 w-0.5 bg-border" aria-hidden />
          <PostCard
            post={a}
            onLike={actOnAncestor(toggleLike)}
            onRepost={actOnAncestor(toggleRepost)}
            onDelete={actOnAncestor(deletePost)}
          />
        </div>
      ))}

      {!post ? (
        <PostSkeleton />
      ) : (
        <>
          <div className="border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar user={post.author} size="md" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-semibold text-text">
                  {post.author.displayName}
                  <VerifiedBadge user={post.author} />
                </p>
                <p className="truncate text-[13px] text-text-faint">@{post.author.username}</p>
              </div>
            </div>

            {isThreadView && (
              <p className="mt-2 text-[12px] text-text-faint">
                Replying to <span className="text-brand">@{byId[post.parentId]?.author?.username}</span>
              </p>
            )}

            <p className="mt-3.5 whitespace-pre-wrap break-words font-serif text-[21px] leading-snug text-text">
              {showTranslation && post.translation ? post.translation : post.content}
            </p>
            {post.translation && (
              <button
                onClick={() => setShowTranslation((s) => !s)}
                className="focus-ring mt-1.5 text-[13px] text-brand hover:underline"
              >
                {showTranslation ? "Show original" : "See translation"}
              </button>
            )}

            <MediaGrid attachments={post.attachments} className="mt-3.5" />

            <p className="mt-3.5 text-[14px] text-text-faint">{fullDate(post.createdAt)}</p>

            <div className="mt-3.5 flex items-center gap-3 border-y border-border py-3 text-[14px] text-text-dim">
              <span><strong className="text-text">{post.stats.comments}</strong> Replies</span>
              <span><strong className="text-text">{post.stats.reposts}</strong> Reposts</span>
              <span><strong className="text-text">{post.stats.likes}</strong> Likes</span>
              <span><strong className="text-text">{post.stats.views}</strong> Views</span>
            </div>

            <div className="mt-3">
              <ActionBar post={post} onLike={handleLike} onRepost={handleRepost} onReply={() => {}} />
            </div>

            {post.analysis.status !== "skipped" && (
              <div className="mt-3">
                <AnalysisPanel analysis={post.analysis} language={post.language} />
              </div>
            )}
            {officialSource && (
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-text-faint">
                <Newspaper size={12} />
                Official {post.author.verificationTier === "government" ? "government" : "news"} source — not run
                through the fact-checker
              </p>
            )}
          </div>

          <div className="border-b border-border">
            <ComposeBox
              compact
              parentId={post.id}
              placeholder="Post your reply"
              onCreated={() => refresh()}
            />
          </div>

          {replies === null ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : replies.length === 0 ? (
            <EmptyState title="No replies yet" description="Replies will appear here once people join the conversation." />
          ) : (
            renderReplies(post.id, 0)
          )}
        </>
      )}
    </div>
  );
}
