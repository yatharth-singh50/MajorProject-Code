import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Cpu, ArrowRight } from "lucide-react";
import { getTrending } from "../../services/api";
import { compactNumber } from "../../utils/format";

export default function RightRail() {
  const [trending, setTrending] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getTrending().then(setTrending);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[330px] shrink-0 flex-col gap-4 overflow-y-auto px-4 py-3 lg:flex">
      <form onSubmit={submitSearch} className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts, people, languages"
          className="focus-ring w-full rounded-full border border-border bg-bg-inset py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-faint"
        />
      </form>

      <div className="rounded-2xl border border-border bg-bg-inset p-4">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-text">
          <Cpu size={15} className="text-brand" />
          Detection pipeline
        </div>
        <ol className="space-y-2.5">
          {[
            ["Language ID", "Routes text to the right script/dialect model"],
            ["Small LM triage", "Cheap first pass — skips non-claims fast"],
            ["Transformer classifier", "Full verification for likely news claims"],
          ].map(([title, desc], i) => (
            <li key={title} className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <div>
                <p className="text-[13px] font-medium text-text">{title}</p>
                <p className="text-[12px] leading-snug text-text-faint">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 border-t border-border pt-3 text-[11px] text-text-faint">
          Demo pipeline — swap in your trained models via <code className="rounded bg-surface px-1 py-0.5">src/services/mlService.js</code>
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-bg-inset p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[15px] font-bold text-text">Trending</span>
        </div>
        <ul>
          {trending.map((t) => (
            <li key={t.tag}>
              <button
                onClick={() => navigate(`/search?q=${encodeURIComponent(t.tag)}`)}
                className="focus-ring -mx-2 flex w-[calc(100%+1rem)] flex-col rounded-lg px-2 py-2 text-left hover:bg-surface-hover"
              >
                <span className="text-[11px] text-text-faint">{t.language} · Trending</span>
                <span className="text-[14px] font-semibold text-text">#{t.tag}</span>
                <span className="text-[12px] text-text-faint">{compactNumber(t.posts)} posts</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => navigate("/search")}
          className="focus-ring mt-1 flex items-center gap-1 text-[13px] text-brand hover:underline"
        >
          Show more <ArrowRight size={13} />
        </button>
      </div>

      <p className="px-2 pb-6 text-[12px] text-text-faint">Sāthi prototype · frontend demo build</p>
    </aside>
  );
}
