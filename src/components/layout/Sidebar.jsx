import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, Bell, User, Settings, Feather, MoreHorizontal, ShieldCheck, LogOut } from "lucide-react";
import Avatar from "../common/Avatar";
import VerifiedBadge from "../common/VerifiedBadge";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import { getUnreadNotificationCount, onNotification } from "../../services/api";
import { cx } from "../../utils/format";

const NAV = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/search", label: "Explore", Icon: Search },
  { to: "/notifications", label: "Notifications", Icon: Bell },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export default function Sidebar({ onCompose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [unread, setUnread] = useState(0);

  // Unread-notification badge: loaded once, refreshed the instant the server
  // pushes a new notification for this user, and whenever the Notifications
  // page marks something read.
  useEffect(() => {
    if (!user) return undefined;
    const refresh = () => getUnreadNotificationCount().then(setUnread).catch(() => {});
    refresh();
    window.addEventListener("sathi:notifications-changed", refresh);
    const off = onNotification((forUserId) => forUserId === user.id && refresh());
    return () => {
      window.removeEventListener("sathi:notifications-changed", refresh);
      off();
    };
  }, [user]);

  // Close on outside click / Escape -- standard popover behavior.
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/signin", { replace: true });
  };

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
              <span className="relative shrink-0">
                <Icon size={24} strokeWidth={1.8} />
                {to === "/notifications" && unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-brand-text">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
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
        <div ref={menuRef} className="relative">
          {menuOpen && (
            <div className="absolute bottom-full left-0 z-20 mb-2 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1.5 shadow-xl shadow-black/20">
              <div className="px-3 py-2">
                <p className="truncate text-[14px] font-semibold text-text">{user.displayName}</p>
                <p className="truncate text-[13px] text-text-faint">@{user.username}</p>
              </div>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/profile/${user.username}`);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] text-text-dim hover:bg-surface-hover"
              >
                <User size={16} />
                Go to profile
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] text-text-dim hover:bg-surface-hover"
              >
                <Settings size={16} />
                Settings
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] text-fake hover:bg-fake-soft"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}

          <button
            onClick={() => setMenuOpen((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="focus-ring flex w-full items-center gap-2.5 rounded-full p-1.5 hover:bg-surface-hover"
          >
            <Avatar user={user} size="md" />
            <div className="hidden min-w-0 flex-1 text-left xl:block">
              <p className="flex items-center gap-1 truncate text-[14px] font-semibold text-text">
                <span className="truncate">{user.displayName}</span>
                <VerifiedBadge user={user} size={14} />
              </p>
              <p className="truncate text-[13px] text-text-faint">@{user.username}</p>
            </div>
            <MoreHorizontal size={18} className="hidden text-text-faint xl:block" />
          </button>
        </div>
      )}
    </aside>
  );
}
