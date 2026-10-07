import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Heart, Repeat2, MessageCircle, ShieldCheck, CheckCheck } from "lucide-react";
import Avatar from "../components/common/Avatar";
import VerifiedBadge from "../components/common/VerifiedBadge";
import EmptyState from "../components/common/EmptyState";
import { PostSkeleton } from "../components/common/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  onNotification,
} from "../services/api";
import { timeAgo, cx } from "../utils/format";

const ICONS = {
  like: { Icon: Heart, color: "text-fake", fill: true },
  repost: { Icon: Repeat2, color: "text-real", fill: false },
  reply: { Icon: MessageCircle, color: "text-brand", fill: false },
  verdict_ready: { Icon: ShieldCheck, color: "text-brand", fill: false },
};

const VERBS = {
  like: "liked your post",
  repost: "reposted your post",
  reply: "replied to you",
};

// The sidebar's unread badge listens for this so it updates the moment
// something is read here, without sharing state between the two.
const notifyChanged = () => window.dispatchEvent(new Event("sathi:notifications-changed"));

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState(null); // null = loading

  const load = useCallback(() => {
    getNotifications()
      .then(setItems)
      .catch(() => setItems((cur) => cur ?? []));
  }, []);

  useEffect(load, [load]);

  // Someone just liked / reposted / replied -> show it immediately.
  useEffect(() => {
    return onNotification((forUserId) => {
      if (forUserId === user?.id) load();
    });
  }, [user?.id, load]);

  const open = async (n) => {
    if (!n.read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      markNotificationRead(n.id).then(notifyChanged).catch(() => {});
    }
    if (n.postId) navigate(`/post/${n.postId}`);
  };

  const readAll = async () => {
    setItems((list) => list.map((x) => ({ ...x, read: true })));
    await markAllNotificationsRead().catch(() => {});
    notifyChanged();
  };

  const unread = (items || []).filter((n) => !n.read).length;

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/85 px-4 py-3 backdrop-blur">
        <h1 className="font-serif text-xl font-semibold text-text">Notifications</h1>
        {unread > 0 && (
          <button
            onClick={readAll}
            className="focus-ring flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-brand hover:bg-brand-soft"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </header>

      {items === null ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing yet"
          description="When someone likes, reposts, or replies to your posts — or your news post gets fact-checked — it shows up here."
        />
      ) : (
        <ul>
          {items.map((n) => {
            const { Icon, color, fill } = ICONS[n.type] ?? ICONS.verdict_ready;
            return (
              <li key={n.id}>
                <button
                  onClick={() => open(n)}
                  className={cx(
                    "focus-ring flex w-full items-start gap-3 border-b border-border px-4 py-3.5 text-left hover:bg-surface-hover/60",
                    !n.read && "bg-brand-soft/30"
                  )}
                >
                  <span className={cx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-inset", color)}>
                    <Icon size={16} strokeWidth={2} fill={fill ? "currentColor" : "none"} />
                  </span>
                  <div className="min-w-0 flex-1">
                    {n.actor && <Avatar user={n.actor} size="sm" className="mb-1.5" />}
                    <p className="text-[14px] text-text">
                      {n.actor ? (
                        <>
                          <span className="inline-flex items-center gap-1 font-semibold">
                            {n.actor.displayName}
                            <VerifiedBadge user={n.actor} size={13} />
                          </span>{" "}
                          <span className="text-text-dim">{VERBS[n.type] ?? n.message}</span>
                        </>
                      ) : (
                        n.message
                      )}
                    </p>
                    {n.snippet && <p className="mt-0.5 truncate text-[13px] text-text-faint">“{n.snippet}”</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[12px] text-text-faint">{timeAgo(n.createdAt)}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand" aria-label="Unread" />}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
