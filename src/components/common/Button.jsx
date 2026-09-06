import { cx } from "../../utils/format";

const VARIANTS = {
  primary: "bg-brand text-brand-text hover:brightness-110 active:brightness-95",
  outline: "border border-border-strong text-text hover:bg-surface-hover",
  ghost: "text-text-dim hover:bg-surface-hover hover:text-text",
  danger: "bg-fake text-white hover:brightness-110",
};

const SIZES = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
  icon: "h-9 w-9",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  as: Comp = "button",
  disabled = false,
  ...props
}) {
  return (
    <Comp
      disabled={disabled}
      className={cx(
        "focus-ring inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
