import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, Bell, User, Settings, Feather, MoreHorizontal, ShieldCheck } from "lucide-react";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import { cx } from "../../utils/format";

const NAV = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/search", label: "Explore", Icon: Search },
  { to: "/notifications", label: "Notifications", Icon: Bell },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export default function Sidebar({ onCompose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="sticky top-0 flex h-screen w-[76px] shrink-0 flex-col justify-between border-r border-border px-2 py-3 xl:w-[260px] xl:px-4">
      <div>
        <button
          onClick={() => navigate("/")}
          className="focus-ring mb-2 flex h-12 w-12 items-center justify-center rounded-full text-brand hover:bg-brand-soft xl:w-full xl:justify-start xl:gap-2 xl:px-3"
        >
          <ShieldCheck size={26} strokeWidth={1.8} />
          <span className="hidden font-serif text-xl font-semibold italic text-text xl:inline">Sāthi</span>
        </button>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  "focus-ring flex items-center gap-4 rounded-full px-3 py-3 text-[17px] transition-colors hover:bg-surface-hover xl:px-3",
                  isActive ? "font-semibold text-text" : "text-text-dim"
                )
              }
            >
              <Icon size={24} strokeWidth={1.8} className="shrink-0" />
              <span className="hidden xl:inline">{label}</span>
            </NavLink>
          ))}
          <NavLink
            to={`/profile/${user?.username || ""}`}
            className={({ isActive }) =>
              cx(
                "focus-ring flex items-center gap-4 rounded-full px-3 py-3 text-[17px] transition-colors hover:bg-surface-hover xl:px-3",
                isActive ? "font-semibold text-text" : "text-text-dim"
              )
            }
          >
            <User size={24} strokeWidth={1.8} className="shrink-0" />
            <span className="hidden xl:inline">Profile</span>
          </NavLink>
        </nav>

        <Button onClick={onCompose} className="mt-4 hidden w-full xl:flex" size="lg">
          Post
        </Button>
        <button
          onClick={onCompose}
          className="focus-ring mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-text xl:hidden"
          aria-label="New post"
        >
          <Feather size={20} />
        </button>
      </div>

      {user && (
        <button
          onClick={() => navigate(`/profile/${user.username}`)}
          className="focus-ring flex items-center gap-2.5 rounded-full p-1.5 hover:bg-surface-hover xl:w-full"
        >
          <Avatar user={user} size="md" />
          <div className="hidden min-w-0 flex-1 text-left xl:block">
            <p className="truncate text-[14px] font-semibold text-text">{user.displayName}</p>
            <p className="truncate text-[13px] text-text-faint">@{user.username}</p>
          </div>
          <MoreHorizontal size={18} className="hidden text-text-faint xl:block" />
        </button>
      )}
    </aside>
  );
}
