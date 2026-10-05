import { useEffect, useRef, useState } from "react";
import { Image, Smile, MapPin, ChevronDown, X, Clapperboard } from "lucide-react";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import EmojiPicker from "../common/EmojiPicker";
import GifPicker from "../common/GifPicker";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { createPost } from "../../services/api";
import { LANGUAGES } from "../../services/mockData";
import { cx } from "../../utils/format";

const MAX_LEN = 280;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // matches the backend's MAX_IMAGE_SIZE_BYTES

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // a data: URI
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ComposeBox({
  parentId = null,
  placeholder = "What's happening in your language?",
  autoFocus = false,
  onCreated,
  compact = false,
}) {
  const { user } = useAuth();
  const { push } = useToast();
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  // Attached media -- mutually exclusive, mirroring the backend's rejection
  // of posts that try to send both an image and a gif_url at once.
  const [image, setImage] = useState(null); // { dataUrl, mimeType }
  const [gif, setGif] = useState(null); // { url, previewUrl, title }

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const langRef = useRef(null);
  const emojiRef = useRef(null);
  const gifRef = useRef(null);

  const remaining = MAX_LEN - content.length;
  const canPost = content.trim().length > 0 && remaining >= 0 && !posting;

  // Outside-click-to-close for each popover independently.
  useEffect(() => {
    const handler = (e) => {
      if (langOpen && langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (emojiOpen && emojiRef.current && !emojiRef.current.contains(e.target)) setEmojiOpen(false);
      if (gifOpen && gifRef.current && !gifRef.current.contains(e.target)) setGifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langOpen, emojiOpen, gifOpen]);

  const grow = (el) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      push("Only image files can be attached (no documents).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      push("That image is too large (max 5MB).");
      return;
    }

    const dataUrl = await fileToBase64(file);
    setImage({ dataUrl, mimeType: file.type });
    setGif(null); // mutually exclusive with a GIF
  };

  const handleSelectGif = (g) => {
    setGif(g);
    setImage(null); // mutually exclusive with an uploaded image
    setGifOpen(false);
  };

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + emoji);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
      grow(el);
    });
  };

  const handleSubmit = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      const post = await createPost({
        content: content.trim(),
        languageCode: language || null,
        parentId,
        imageBase64: image?.dataUrl || null,
        imageMimeType: image?.mimeType || null,
        gifUrl: gif?.url || null,
      });
      onCreated?.(post);
      setContent("");
      setLanguage("");
      setImage(null);
      setGif(null);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      push(err.message || "Couldn't post that. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const selectedLangName = LANGUAGES.find((l) => l.code === language)?.name;
  const previewSrc = image?.dataUrl || gif?.previewUrl || gif?.url;

  return (
    <div className={cx("flex gap-3", compact ? "px-4 py-3" : "px-4 py-4")}>
      <Avatar user={user} size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <textarea
          ref={textareaRef}
          autoFocus={autoFocus}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            grow(e.target);
          }}
          placeholder={placeholder}
          rows={compact ? 1 : 2}
          className="focus-ring w-full resize-none bg-transparent text-[16px] leading-relaxed text-text placeholder:text-text-faint"
        />

        {previewSrc && (
          <div className="relative mt-2 inline-block">
            <img src={previewSrc} alt="" className="max-h-52 rounded-xl border border-border object-cover" />
            <button
              onClick={() => {
                setImage(null);
                setGif(null);
              }}
              className="focus-ring absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75"
              aria-label="Remove attachment"
            >
              <X size={14} />
            </button>
            {gif && (
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                GIF
              </span>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1 text-brand">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            <button
              onClick={handlePickImage}
              disabled={!!gif}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-soft disabled:opacity-40"
              aria-label="Add image"
              title="Add image"
            >
              <Image size={17} strokeWidth={1.8} />
            </button>

            <div ref={gifRef} className="relative">
              <button
                onClick={() => setGifOpen((s) => !s)}
                disabled={!!image}
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-soft disabled:opacity-40"
                aria-label="Add GIF"
                title="Add GIF"
              >
                <Clapperboard size={17} strokeWidth={1.8} />
              </button>
              {gifOpen && <GifPicker onSelect={handleSelectGif} />}
            </div>

            <div ref={emojiRef} className="relative">
              <button
                onClick={() => setEmojiOpen((s) => !s)}
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-soft"
                aria-label="Add emoji"
                title="Add emoji"
              >
                <Smile size={17} strokeWidth={1.8} />
              </button>
              {emojiOpen && <EmojiPicker onSelect={insertEmoji} />}
            </div>

            <button
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-full opacity-40"
              aria-label="Add location (coming soon)"
              title="Coming soon"
              disabled
            >
              <MapPin size={17} strokeWidth={1.8} />
            </button>

            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen((s) => !s)}
                className="focus-ring flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[12px] font-medium text-text-dim hover:bg-surface-hover"
              >
                {selectedLangName || "Auto-detect"}
                <ChevronDown size={12} />
              </button>
              {langOpen && (
                <div className="absolute left-0 top-full z-10 mt-1.5 w-40 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl shadow-black/20">
                  <button
                    onClick={() => {
                      setLanguage("");
                      setLangOpen(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-[13px] text-text-dim hover:bg-surface-hover"
                  >
                    Auto-detect
                  </button>
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setLangOpen(false);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-[13px] text-text-dim hover:bg-surface-hover"
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {content.length > 0 && (
              <span
                className={cx(
                  "text-xs tabular-nums",
                  remaining < 0 ? "text-fake" : remaining < 20 ? "text-brand" : "text-text-faint"
                )}
              >
                {remaining}
              </span>
            )}
            <Button size={compact ? "sm" : "md"} disabled={!canPost} onClick={handleSubmit}>
              {posting ? "Posting…" : parentId ? "Reply" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
