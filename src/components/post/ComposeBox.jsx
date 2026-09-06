import { useRef, useState } from "react";
import { Image, Smile, MapPin, ChevronDown } from "lucide-react";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import { createPost } from "../../services/api";
import { LANGUAGES } from "../../services/mockData";
import { cx } from "../../utils/format";

const MAX_LEN = 280;

export default function ComposeBox({
  parentId = null,
  placeholder = "What's happening in your language?",
  autoFocus = false,
  onCreated,
  compact = false,
}) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef(null);

  const remaining = MAX_LEN - content.length;
  const canPost = content.trim().length > 0 && remaining >= 0 && !posting;

  const grow = (el) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      const post = await createPost({ content: content.trim(), languageCode: language || null, parentId });
      onCreated?.(post);
      setContent("");
      setLanguage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
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

        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1 text-brand">
            <button className="focus-ring flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-soft" aria-label="Add image (UI only)">
              <Image size={17} strokeWidth={1.8} />
            </button>
            <button className="focus-ring flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-soft" aria-label="Add emoji (UI only)">
              <Smile size={17} strokeWidth={1.8} />
            </button>
            <button className="focus-ring flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-soft" aria-label="Add location (UI only)">
              <MapPin size={17} strokeWidth={1.8} />
            </button>

            <div className="relative">
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
