import { cx } from "../../utils/format";

// The Sāthi mark (public/Sathi_Logo.png, 406x487). `size` is the rendered
// height in px; the width follows the image's own aspect ratio.
export default function Logo({ size = 28, className = "" }) {
  return (
    <img
      src="/Sathi_Logo.png"
      alt="Sāthi"
      height={size}
      style={{ height: size, width: "auto" }}
      className={cx("shrink-0 select-none object-contain", className)}
      draggable={false}
    />
  );
}
