import { Languages } from "lucide-react";
import { cx } from "../../utils/format";

export default function LanguageTag({ language, className = "" }) {
  if (!language) return null;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-text-faint",
        className
      )}
    >
      <Languages size={11} strokeWidth={2} />
      {language.name}
    </span>
  );
}
