import { useNavigate } from "react-router-dom";
import { Heart, Repeat2, MessageCircle, ShieldCheck, TriangleAlert, UserPlus } from "lucide-react";
import Avatar from "../components/common/Avatar";
import { cx } from "../utils/format";

const ICONS = {
  like: { Icon: Heart, color: "text-fake" },
  repost: { Icon: Repeat2, color: "text-real" },
  reply: { Icon: MessageCircle, color: "text-brand" },
  verified: { Icon: ShieldCheck, color: "text-real" },
  disputed: { Icon: TriangleAlert, color: "text-fake" },
  follow: { Icon: UserPlus, color: "text-brand" },
};

const NOTIFICATIONS = [
  {
    id: "n1",
    type: "disputed",
    text: "Your post was analyzed and flagged as disputed",
    detail: "“Testing the live pipeline — posting this right before…”",
    time: "2m",
    link: "/post/p6",
  },
  {
    id: "n2",
    type: "like",
    actor: { displayName: "Meera Krishnan", avatarColor: "#E89E3D" },
    text: "liked your reply",
    time: "18m",
    link: "/post/p1",
  },
  {
    id: "n3",
    type: "follow",
    actor: { displayName: "Koushik Das", avatarColor: "#6E8F5C" },
    text: "followed you",
    time: "1h",
    link: "/profile/kolkata_koushik",
  },
  {
    id: "n4",
    type: "reply",
    actor: { displayName: "Priya Nair", avatarColor: "#8C7BC7" },
    text: "replied to your post",
    detail: "“Does the triage model handle code-mixed Hindi-English text okay…”",
    time: "3h",
    link: "/post/p4",
  },
  {
    id: "n5",
    type: "verified",
    text: "A post you liked was verified as real by the classifier",
    detail: "“BREAKING: Govt has NOT announced a new ₹2000 note recall…”",
    time: "5h",
    link: "/post/p1",
  },
  {
    id: "n6",
    type: "repost",
    actor: { displayName: "Arjun Bhatt", avatarColor: "#4FA7C4" },
    text: "reposted your post",
    time: "1d",
    link: "/post/p6",
  },
];

export default function Notifications() {
  const navigate = useNavigate();

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-bg/85 px-4 py-3 backdrop-blur">
        <h1 className="font-serif text-xl font-semibold text-text">Notifications</h1>
      </header>

      <ul>
        {NOTIFICATIONS.map((n) => {
          const { Icon, color } = ICONS[n.type];
          return (
            <li key={n.id}>
              <button
                onClick={() => navigate(n.link)}
                className="focus-ring flex w-full items-start gap-3 border-b border-border px-4 py-3.5 text-left hover:bg-surface-hover/60"
              >
                <span className={cx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-inset", color)}>
                  <Icon size={16} strokeWidth={2} fill={n.type === "like" ? "currentColor" : "none"} />
                </span>
                <div className="min-w-0 flex-1">
                  {n.actor && <Avatar user={n.actor} size="sm" className="mb-1.5" />}
                  <p className="text-[14px] text-text">
                    {n.actor && <span className="font-semibold">{n.actor.displayName}</span>}{" "}
                    <span className={n.actor ? "text-text-dim" : ""}>{n.text}</span>
                  </p>
                  {n.detail && <p className="mt-0.5 truncate text-[13px] text-text-faint">{n.detail}</p>}
                </div>
                <span className="shrink-0 text-[12px] text-text-faint">{n.time}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
