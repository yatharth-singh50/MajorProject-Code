import { useEffect, useRef, useState } from "react";
import { Image, Smile, MapPin, ChevronDown, X, Clapperboard, Newspaper, Loader2, Play } from "lucide-react";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import EmojiPicker from "../common/EmojiPicker";
import GifPicker from "../common/GifPicker";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { createPost, uploadMedia } from "../../services/api";
import { LANGUAGES } from "../../services/mockData";
import { cx } from "../../utils/format";

const MAX_LEN = 280;
const MAX_ATTACHMENTS = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // keep in step with the backend limits
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;

// Mirrors the backend's news-keyword detection (services/news_detect.py) so the
// UI can say "will be fact-checked" before you post. The server is the
// authority -- this is only a hint.
const NEWS_KEYWORDS = /(#\s?breaking(\s?news)?\b|#\s?news(alert)?\b|\bbreaking\s+news\b|ब्रेकिंग\s*न्यूज़?|#\s?समाचार)/i;

let attachmentKey = 0;

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
  const [isNews, setIsNews] = useState(false);

  // Up to MAX_ATTACHMENTS of any mix. Each: { key, kind, previewUrl,
  // uploading, mediaId?, gifUrl?, objectUrl? } -- files upload as soon as
  // they're picked, so posting is instant.
  const [attachments, setAttachments] = useState([]);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const langRef = useRef(null);
  const emojiRef = useRef(null);
  const gifRef = useRef(null);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  const remaining = MAX_LEN - content.length;
  const uploading = attachments.some((a) => a.uploading);
  const canPost = content.trim().length > 0 && remaining >= 0 && !posting && !uploading;
  const slotsLeft = MAX_ATTACHMENTS - attachments.length;
  const autoNews = !isNews && !parentId && NEWS_KEYWORDS.test(content);
  const willBeChecked = !parentId && (isNews || autoNews);

  // Release preview blobs when the composer goes away.
  useEffect(
    () => () => attachmentsRef.current.forEach((a) => a.objectUrl && URL.revokeObjectURL(a.objectUrl)),
    []
  );

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

  const removeAttachment = (key) => {
    setAttachments((list) => {
      const gone = list.find((a) => a.key === key);
      if (gone?.objectUrl) URL.revokeObjectURL(gone.objectUrl);
      return list.filter((a) => a.key !== key);
    });
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    if (files.length > slotsLeft) {
      push(`You can attach up to ${MAX_ATTACHMENTS} items per post.`);
    }

    for (const file of files.slice(0, Math.max(slotsLeft, 0))) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        push(`"${file.name}" isn't an image or video — documents can't be attached.`);
        continue;
      }
      if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
        push(`"${file.name}" is too large (max ${isVideo ? 12 : 5}MB).`);
        continue;
      }

      const key = ++attachmentKey;
      const objectUrl = URL.createObjectURL(file);
      setAttachments((list) => [
        ...list,
        { key, kind: isVideo ? "video" : "image", previewUrl: objectUrl, objectUrl, uploading: true },
      ]);

      try {
        const ref = await uploadMedia(file);
        // The server reports the real type (a .gif file comes back as "gif").
        setAttachments((list) =>
          list.map((a) => (a.key === key ? { ...a, uploading: false, mediaId: ref.id, kind: ref.kind } : a))
        );
      } catch (err) {
        push(err.message || `Couldn't upload "${file.name}".`);
        removeAttachment(key);
      }
    }
  };

  const handleSelectGif = (g) => {
    if (slotsLeft <= 0) {
      push(`You can attach up to ${MAX_ATTACHMENTS} items per post.`);
      return;
    }
    setAttachments((list) => [
      ...list,
      { key: ++attachmentKey, kind: "gif", previewUrl: g.previewUrl || g.url, gifUrl: g.url, uploading: false },
    ]);
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
    setContent(content.slice(0, start) + emoji + content.slice(end));
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
        mediaIds: attachments.filter((a) => a.mediaId).map((a) => a.mediaId),
        gifUrls: attachments.filter((a) => a.gifUrl).map((a) => a.gifUrl),
        isNews: !parentId && isNews,
      });
      onCreated?.(post);
      attachments.forEach((a) => a.objectUrl && URL.revokeObjectURL(a.objectUrl));
      setContent("");
      setLanguage("");
      setAttachments([]);
      setIsNews(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      push(err.message || "Couldn't post that. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const selectedLangName = LANGUAGES.find((l) => l.code === language)?.name;

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

        {attachments.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {attachments.map((a) => (
              <div key={a.key} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-black">
                {a.kind === "video" ? (
                  <video src={a.previewUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  <img src={a.previewUrl} alt="" className="h-full w-full object-cover" />
                )}
                {a.uploading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                    <Loader2 size={20} className="animate-spin" />
                  </span>
                )}
                <button
                  onClick={() => removeAttachment(a.key)}
                  className="focus-ring absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white hover:bg-black/80"
                  aria-label="Remove attachment"
                >
                  <X size={13} />
                </button>
                {a.kind === "gif" && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                    GIF
                  </span>
                )}
                {a.kind === "video" && !a.uploading && (
                  <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-black/65 px-1 py-0.5 text-[9px] font-semibold uppercase text-white">
                    <Play size={8} fill="currentColor" /> Video
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {willBeChecked && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-brand">
            <Newspaper size={13} />
            {isNews ? "Tagged as news" : "Looks like news"} — this post will be fact-checked.
          </p>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-1 text-brand">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={slotsLeft <= 0}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-soft disabled:opacity-40"
              aria-label="Add photos or video"
              title={slotsLeft <= 0 ? `Up to ${MAX_ATTACHMENTS} attachments` : "Add photos or video"}
            >
              <Image size={17} strokeWidth={1.8} />
            </button>

            <div ref={gifRef} className="relative">
              <button
                onClick={() => setGifOpen((s) => !s)}
                disabled={slotsLeft <= 0}
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

            {!parentId && (
              <button
                onClick={() => setIsNews((s) => !s)}
                aria-pressed={isNews}
                className={cx(
                  "focus-ring flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                  isNews ? "border-brand bg-brand-soft text-brand" : "border-border text-text-dim hover:bg-surface-hover"
                )}
                title="Tag as news — news posts are fact-checked; everything else is posted as-is"
              >
                <Newspaper size={13} />
                News
              </button>
            )}

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

          <div className="flex shrink-0 items-center gap-3">
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
              {posting ? "Posting…" : uploading ? "Uploading…" : parentId ? "Reply" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
