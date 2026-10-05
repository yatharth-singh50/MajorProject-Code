import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { searchGifs } from "../../services/api";

export default function GifPicker({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);

  // Debounced search -- also fires once immediately on mount with an empty
  // query to show featured/trending GIFs first, matching Twitter's picker.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await searchGifs(query);
        if (cancelled) return;
        setResults(data.results);
        setConfigured(data.configured);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div className="absolute left-0 top-full z-20 mt-1.5 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search size={14} className="shrink-0 text-text-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs"
          className="focus-ring w-full bg-transparent text-[13px] text-text placeholder:text-text-faint"
        />
      </div>

      {!configured ? (
        <p className="px-3 py-6 text-center text-[12px] text-text-faint">
          GIF search isn't set up for this deployment yet.
        </p>
      ) : loading ? (
        <p className="px-3 py-6 text-center text-[12px] text-text-faint">Searching…</p>
      ) : results.length === 0 ? (
        <p className="px-3 py-6 text-center text-[12px] text-text-faint">No GIFs found</p>
      ) : (
        <div className="grid max-h-72 grid-cols-2 gap-1.5 overflow-y-auto p-2">
          {results.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelect(g)}
              className="overflow-hidden rounded-lg border border-transparent hover:border-brand"
            >
              <img src={g.previewUrl} alt={g.title} className="h-24 w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
