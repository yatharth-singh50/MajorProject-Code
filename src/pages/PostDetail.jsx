import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Avatar from "../components/common/Avatar";
import VerdictStamp from "../components/post/VerdictStamp";
import AnalysisPanel from "../components/post/AnalysisPanel";
import ActionBar from "../components/post/ActionBar";
import ComposeBox from "../components/post/ComposeBox";
import PostCard from "../components/post/PostCard";
import { PostSkeleton } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { getPost, toggleLike, toggleRepost, onPostUpdated } from "../services/api";
import { usePostList } from "../hooks/usePostList";
import { getReplies } from "../services/api";
import { fullDate, timeAgo, cx } from "../utils/format";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const { posts: replies, prependPost, handleLike: likeReply, handleRepost: repostReply } = usePostList(
    () => getReplies(id),
    [id]
  );

  useEffect(() => {
    setPost(null);
    getPost(id).then(setPost);
  }, [id]);

  useEffect(() => {
    return onPostUpdated((updated) => {
      if (updated.id === id) setPost(updated);
    });
  }, [id]);

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

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-5 border-b border-border bg-bg/85 px-3 py-2.5 backdrop-blur">
        <button onClick={() => navigate(-1)} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-hover" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-serif text-lg font-semibold text-text">Post</h1>
      </header>

      {!post ? (
        <PostSkeleton />
      ) : (
        <>
          <div className="border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar user={post.author} size="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-text">{post.author.displayName}</p>
                <p className="truncate text-[13px] text-text-faint">@{post.author.username}</p>
              </div>
            </div>

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

            <p className="mt-3.5 text-[14px] text-text-faint">{fullDate(post.createdAt)}</p>

            <div className="mt-3.5 flex items-center gap-3 border-y border-border py-3 text-[14px] text-text-dim">
              <span><strong className="text-text">{post.stats.reposts}</strong> Reposts</span>
              <span><strong className="text-text">{post.stats.likes}</strong> Likes</span>
              <span><strong className="text-text">{post.stats.views}</strong> Views</span>
            </div>

            <div className="mt-3">
              <ActionBar post={post} onLike={handleLike} onRepost={handleRepost} onReply={() => {}} />
            </div>

            <div className="mt-3">
              <AnalysisPanel analysis={post.analysis} language={post.language} />
            </div>
          </div>

          <div className="border-b border-border">
            <ComposeBox
              compact
              parentId={post.id}
              placeholder="Post your reply"
              onCreated={(reply) => prependPost(reply)}
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
            replies.map((reply) => (
              <PostCard key={reply.id} post={reply} onLike={likeReply} onRepost={repostReply} />
            ))
          )}
        </>
      )}
    </div>
  );
}
