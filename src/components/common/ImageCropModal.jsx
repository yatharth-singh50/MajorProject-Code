import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

// Deliberately dependency-free (plain canvas + pointer events) rather than
// pulling in a cropper library -- this is a prototype-scale feature, and
// drag-to-pan + a zoom slider covers the actual ask ("cropping allowed")
// without adding a package for it.

const VIEWPORT = {
  circle: { w: 260, h: 260 },
  rect: { w: 320, h: 120 },
};

const OUTPUT = {
  circle: { w: 480, h: 480 },
  rect: { w: 1200, h: 450 },
};

/**
 * shape: "circle" (profile photo) | "rect" (banner)
 * onConfirm(dataUrl: string) -- a JPEG data: URI at a fixed output size
 */
export default function ImageCropModal({ open, file, shape = "circle", title, onCancel, onConfirm }) {
  const viewport = VIEWPORT[shape];
  const output = OUTPUT[shape];

  const [imgEl, setImgEl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);

  // Load the picked file into an <img> we can read natural dimensions from.
  useEffect(() => {
    if (!file) {
      setImgEl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = imgEl ? Math.max(viewport.w / imgEl.width, viewport.h / imgEl.height) : 1;
  const scale = baseScale * zoom;
  const dispW = imgEl ? imgEl.width * scale : 0;
  const dispH = imgEl ? imgEl.height * scale : 0;

  const clamp = useCallback(
    (pos, dw, dh) => ({
      x: Math.min(0, Math.max(viewport.w - dw, dw <= viewport.w ? (viewport.w - dw) / 2 : pos.x)),
      y: Math.min(0, Math.max(viewport.h - dh, dh <= viewport.h ? (viewport.h - dh) / 2 : pos.y)),
    }),
    [viewport.w, viewport.h]
  );

  // Re-center whenever a new image loads.
  useEffect(() => {
    if (!imgEl) return;
    setZoom(1);
    const s = Math.max(viewport.w / imgEl.width, viewport.h / imgEl.height);
    const w = imgEl.width * s;
    const h = imgEl.height * s;
    setOffset({ x: (viewport.w - w) / 2, y: (viewport.h - h) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgEl]);

  // Re-clamp (never leave a gap at the edge) whenever zoom changes.
  useEffect(() => {
    setOffset((prev) => clamp(prev, dispW, dispH));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, dispW, dispH]);

  const onPointerDown = (e) => {
    dragState.current = { startX: e.clientX, startY: e.clientY, origin: offset };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset(
      clamp(
        { x: dragState.current.origin.x + dx, y: dragState.current.origin.y + dy },
        dispW,
        dispH
      )
    );
  };
  const onPointerUp = () => {
    dragState.current = null;
  };

  const handleConfirm = () => {
    if (!imgEl) return;
    const canvas = document.createElement("canvas");
    canvas.width = output.w;
    canvas.height = output.h;
    const ctx = canvas.getContext("2d");
    const outScale = output.w / viewport.w; // viewport and output share an aspect ratio
    ctx.drawImage(
      imgEl,
      0,
      0,
      imgEl.width,
      imgEl.height,
      offset.x * outScale,
      offset.y * outScale,
      dispW * outScale,
      dispH * outScale
    );
    onConfirm(canvas.toDataURL("image/jpeg", 0.87));
  };

  return (
    <Modal open={open} onClose={onCancel}>
      <h2 className="mb-4 font-serif text-lg text-text">{title}</h2>

      <div className="flex flex-col items-center gap-4">
        <div
          className="relative touch-none select-none overflow-hidden bg-bg-inset"
          style={{
            width: viewport.w,
            height: viewport.h,
            borderRadius: shape === "circle" ? "9999px" : "12px",
            cursor: dragState.current ? "grabbing" : "grab",
            boxShadow: "0 0 0 2px var(--color-border)",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {imgEl && (
            <img
              src={imgEl.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none"
              style={{ width: dispW, height: dispH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
            />
          )}
        </div>

        <div className="flex w-full max-w-xs items-center gap-3">
          <ZoomIn size={15} className="shrink-0 text-text-faint" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-brand"
            aria-label="Zoom"
          />
        </div>
        <p className="text-[12px] text-text-faint">Drag to reposition, use the slider to zoom.</p>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={!imgEl}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
