import { useState } from "react";
import { Maximize2, Play } from "lucide-react";
import Lightbox from "../common/Lightbox";
import { mediaUrl } from "../../services/api";
import { cx } from "../../utils/format";

// A post's attachments (up to 4 images / GIFs / videos). Images and GIFs open
// in the lightbox when clicked; videos play right in the post with native
// controls, with an expand button for a bigger view. Every click here stops
// propagating so interacting with media never navigates to the post page.
export default function MediaGrid({ attachments, className = "" }) {
  const [open, setOpen] = useState(null); // index shown in the lightbox, or null

  if (!attachments?.length) return null;

  const items = attachments.map((a) => ({ kind: a.kind, src: mediaUrl(a) }));
  const count = items.length;

  // 1 -> one wide tile; 2 -> side by side; 3 -> one tall + two stacked; 4 -> 2x2.
  const layout =
    count === 1
      ? ""
      : count === 2
        ? "grid grid-cols-2 gap-0.5 h-64"
        : "grid grid-cols-2 grid-rows-2 gap-0.5 h-72";

  const tileClass = (i) =>
    cx("relative overflow-hidden bg-black", count === 3 && i === 0 && "row-span-2", count > 1 && "h-full w-full");

  return (
    <>
      <div
        className={cx("overflow-hidden rounded-xl border border-border", layout, className)}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, i) => (
          <div key={i} className={tileClass(i)}>
            {item.kind === "video" ? (
              <>
                <video
                  src={item.src}
                  controls
                  preload="metadata"
                  playsInline
                  className={cx("w-full bg-black", count === 1 ? "max-h-[28rem]" : "h-full object-cover")}
                />
                <button
                  onClick={() => setOpen(i)}
                  className="focus-ring absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="View larger"
                  title="View larger"
                >
                  <Maximize2 size={13} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setOpen(i)}
                className={cx("focus-ring block w-full cursor-zoom-in", count > 1 && "h-full")}
                aria-label="View image larger"
              >
                <img
                  src={item.src}
                  alt=""
                  loading="lazy"
                  className={cx("w-full", count === 1 ? "max-h-[28rem] object-cover" : "h-full object-cover")}
                />
                {item.kind === "gif" && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    GIF
                  </span>
                )}
              </button>
            )}
            {item.kind === "video" && count > 1 && (
              <span className="pointer-events-none absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                <Play size={9} fill="currentColor" /> Video
              </span>
            )}
          </div>
        ))}
      </div>

      {open !== null && <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </>
  );
}
