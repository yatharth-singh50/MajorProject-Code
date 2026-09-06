import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, BadgeCheck } from "lucide-react";
import Avatar from "../components/common/Avatar";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import PostCard from "../components/post/PostCard";
import { PostSkeleton } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { getUserByUsername, getUserPosts } from "../services/api";
import { usePostList } from "../hooks/usePostList";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { compactNumber, cx } from "../utils/format";

const TABS = ["Posts", "Replies", "Likes"];

function CredibilityRing({ score }) {
  if (score === null || score === undefined) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-strong text-[10px] text-text-faint">
        No data
      </div>
    );
  }
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 70 ? "var(--color-real)" : score >= 40 ? "var(--color-uncertain)" : "var(--color-fake)";
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} strokeWidth="5" fill="none" stroke="var(--color-border)" />
        <circle
          cx="32"
          cy="32"
          r={r}
          strokeWidth="5"
          fill="none"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-bold text-text">{score}%</span>
      </div>
    </div>
  );
}

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: me, saveProfile } = useAuth();
  const { push } = useToast();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("Posts");
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ displayName: "", bio: "", location: "" });

  const isMe = me?.username === username;

  useEffect(() => {
    setProfile(null);
    getUserByUsername(username).then((u) => {
      setProfile(u);
      setForm({ displayName: u.displayName, bio: u.bio, location: u.location || "" });
    });
  }, [username]);

  const { posts, handleLike, handleRepost } = usePostList(
    () => getUserPosts(username, tab.toLowerCase()),
    [username, tab]
  );

  const handleSave = async () => {
    const updated = await saveProfile(form);
    setProfile((p) => ({ ...p, ...updated }));
    setEditOpen(false);
    push("Profile updated");
  };

  if (!profile) {
    return (
      <div>
        <header className="sticky top-0 z-10 flex items-center gap-5 border-b border-border bg-bg/85 px-3 py-2.5 backdrop-blur">
          <button onClick={() => navigate(-1)} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-hover">
            <ArrowLeft size={18} />
          </button>
        </header>
        <PostSkeleton />
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-5 border-b border-border bg-bg/85 px-3 py-2.5 backdrop-blur">
        <button onClick={() => navigate(-1)} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-hover" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="font-serif text-lg font-semibold leading-tight text-text">{profile.displayName}</p>
          <p className="text-[12px] text-text-faint">{compactNumber(posts?.length ?? 0)} posts</p>
        </div>
      </header>

      <div className="h-32 bg-gradient-to-br from-brand-soft to-uncertain-soft sm:h-40" />

      <div className="px-4">
        <div className="-mt-10 flex items-end justify-between">
          <Avatar user={profile} size="xl" className="border-4 border-bg" />
          {isMe ? (
            <Button variant="outline" onClick={() => setEditOpen(true)} className="mb-2">
              Edit profile
            </Button>
          ) : (
            <Button className="mb-2">Follow</Button>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <h2 className="font-serif text-xl font-semibold text-text">{profile.displayName}</h2>
          {profile.platformVerified && <BadgeCheck size={17} className="fill-brand text-bg" strokeWidth={0} />}
        </div>
        <p className="text-[14px] text-text-faint">@{profile.username}</p>

        {profile.bio && <p className="mt-3 whitespace-pre-wrap text-[15px] text-text">{profile.bio}</p>}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-faint">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {profile.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarDays size={14} />
            Joined {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
        </div>

        <div className="mt-3 flex gap-4 text-[13px]">
          <span><strong className="text-text">{compactNumber(profile.followingCount)}</strong> <span className="text-text-faint">Following</span></span>
          <span><strong className="text-text">{compactNumber(profile.followerCount)}</strong> <span className="text-text-faint">Followers</span></span>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-bg-inset p-3">
          <CredibilityRing score={profile.trustScore} />
          <div>
            <p className="text-[13px] font-semibold text-text">Credibility score</p>
            <p className="text-[12px] leading-snug text-text-faint">
              Share of this account's analyzed posts the model verified as real, not disputed.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-1 flex border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "focus-ring relative flex-1 py-3.5 text-[14px] font-medium hover:bg-surface-hover",
              tab === t ? "text-text" : "text-text-faint"
            )}
          >
            {t}
            {tab === t && <span className="absolute inset-x-0 bottom-0 mx-auto h-1 w-14 rounded-full bg-brand" />}
          </button>
        ))}
      </div>

      {posts === null ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <EmptyState title={`No ${tab.toLowerCase()} yet`} description={isMe ? "What you post here will show up for others too." : "Nothing to show yet."} />
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} onLike={handleLike} onRepost={handleRepost} />)
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <h2 className="mb-4 font-serif text-lg text-text">Edit profile</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-faint">Name</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              className="focus-ring w-full rounded-lg border border-border bg-bg-inset px-3 py-2 text-[15px] text-text"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-faint">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="focus-ring w-full resize-none rounded-lg border border-border bg-bg-inset px-3 py-2 text-[15px] text-text"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-faint">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="focus-ring w-full rounded-lg border border-border bg-bg-inset px-3 py-2 text-[15px] text-text"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
