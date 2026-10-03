import { initials, cx } from "../../utils/format";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
};

export default function Avatar({ user, size = "md", className = "" }) {
  if (!user) return <div className={cx(SIZES[size], "rounded-full bg-bg-inset", className)} />;

  if (user.avatarImage) {
    return (
      <img
        src={user.avatarImage}
        alt={user.displayName || user.username}
        className={cx(SIZES[size], "shrink-0 rounded-full object-cover select-none", className)}
      />
    );
  }

  return (
    <div
      className={cx(
        SIZES[size],
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none",
        className
      )}
      style={{ backgroundColor: user.avatarColor || "#8C7BC7" }}
      title={user.displayName}
    >
      {initials(user.displayName || user.username)}
    </div>
  );
}
