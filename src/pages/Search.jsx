import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import Avatar from "../components/common/Avatar";
import VerifiedBadge from "../components/common/VerifiedBadge";
import PostCard from "../components/post/PostCard";
import { PostSkeleton } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { searchAll, getTrending, toggleLike, toggleRepost } from "../services/api";
import { compactNumber } from "../utils/format";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [input, setInput] = useState(query);
  const [results, setResults] = useState(null);
  const [trending, setTrending] = useState([]);
  const navigate = useNavigate();

  useEffect(() => setInput(query), [query]);

  useEffect(() => {
    if (!query) {
      getTrending().then(setTrending);
      setResults(null);
      return;
    }
    setResults(null);
    searchAll(query).then(setResults);
  }, [query]);

  const submit = (e) => {
    e.preventDefault();
    if (input.trim()) setParams({ q: input.trim() });
  };

  const patch = async (id, kind) => {
    const fn = kind === "like" ? toggleLike : toggleRepost;
    const updated = await fn(id);
    setResults((r) => ({ ...r, posts: r.posts.map((p) => (p.id === id ? updated : p)) }));
  };

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-bg/85 px-4 py-2.5 backdrop-blur">
        <form onSubmit={submit} className="relative">
          <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search posts, people, languages"
            className="focus-ring w-full rounded-full border border-border bg-bg-inset py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-faint"
          />
        </form>
      </header>

      {!query ? (
        <div className="p-4">
          <h2 className="mb-3 font-serif text-lg text-text">Trending</h2>
          <ul className="space-y-1">
            {trending.map((t) => (
              <li key={t.tag}>
                <button
                  onClick={() => setParams({ q: t.tag })}
                  className="focus-ring flex w-full flex-col rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover"
                >
                  <span className="text-[11px] text-text-faint">{t.language} · Trending</span>
                  <span className="text-[15px] font-semibold text-text">#{t.tag}</span>
                  <span className="text-[12px] text-text-faint">{compactNumber(t.posts)} posts</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : results === null ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : results.posts.length === 0 && results.users.length === 0 ? (
        <EmptyState title={`No results for "${query}"`} description="Try a different search term or check the spelling." />
      ) : (
        <div>
          {results.users.length > 0 && (
            <div className="border-b border-border">
              {results.users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/profile/${u.username}`)}
                  className="focus-ring flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover/60"
                >
                  <Avatar user={u} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate font-semibold text-text">
                      {u.displayName}
                      <VerifiedBadge user={u} size={14} />
                    </p>
                    <p className="truncate text-[13px] text-text-faint">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {results.posts.map((p) => (
            <PostCard key={p.id} post={p} onLike={(id) => patch(id, "like")} onRepost={(id) => patch(id, "repost")} />
          ))}
        </div>
      )}
    </div>
  );
}
