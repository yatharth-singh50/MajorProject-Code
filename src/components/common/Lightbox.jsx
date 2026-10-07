import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Full-screen viewer for a post's images / GIFs / videos.
 * items: [{ kind: "image" | "gif" | "video", src }]
 * Esc closes, ←/→ move between items, clicking the dark backdrop closes.
 */
export default function Lightbox({ items, index, onClose, onIndex }) {
  const item = items[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && index < items.length - 1) onIndex(index + 1);
      else if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // no page scrolling behind the viewer
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, items.length, onClose, onIndex]);

  if (!item) return null;

  const stop = (e) => e.stopPropagation();

  // Rendered in a portal so it isn't clipped by (or stacked under) the feed,
  // but React still bubbles events up the *component* tree -- so every
  // handler here stops propagation, or a click would also open the post
  // underneath the viewer.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={(e) => {
        stop(e);
        onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={(e) => {
          stop(e);
          onClose();
        }}
        className="focus-ring absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {index > 0 && (
        <button
          onClick={(e) => {
            stop(e);
            onIndex(index - 1);
          }}
          className="focus-ring absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Previous"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {index < items.length - 1 && (
        <button
          onClick={(e) => {
            stop(e);
            onIndex(index + 1);
          }}
          className="focus-ring absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Next"
        >
          <ChevronRight size={22} />
        </button>
      )}

      <div onClick={stop} className="flex max-h-full max-w-full items-center justify-center p-4">
        {item.kind === "video" ? (
          <video
            key={item.src}
            src={item.src}
            controls
            autoPlay
            playsInline
            className="max-h-[88vh] max-w-[92vw] rounded-lg bg-black"
          />
        ) : (
          <img src={item.src} alt="" className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain" />
        )}
      </div>

      {items.length > 1 && (
        <span className="absolute bottom-5 rounded-full bg-black/60 px-3 py-1 text-[12px] text-white">
          {index + 1} / {items.length}
        </span>
      )}
    </div>,
    document.body
  );
}
