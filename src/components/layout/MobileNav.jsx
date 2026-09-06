import { NavLink } from "react-router-dom";
import { Home, Search, Bell, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cx } from "../../utils/format";

const NAV = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/search", label: "Explore", Icon: Search },
  { to: "/notifications", label: "Alerts", Icon: Bell },
];

export default function MobileNav() {
  const { user } = useAuth();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-border bg-surface/95 backdrop-blur sm:hidden">
      {NAV.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => cx("flex h-full flex-1 items-center justify-center", isActive ? "text-text" : "text-text-faint")}
          aria-label={label}
        >
          <Icon size={23} strokeWidth={1.8} />
        </NavLink>
      ))}
      <NavLink
        to={`/profile/${user?.username || ""}`}
        className={({ isActive }) => cx("flex h-full flex-1 items-center justify-center", isActive ? "text-text" : "text-text-faint")}
        aria-label="Profile"
      >
        <User size={23} strokeWidth={1.8} />
      </NavLink>
    </nav>
  );
}
