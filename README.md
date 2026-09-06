# Sāthi — frontend prototype

A frontend-only, Twitter-like UI for a transformer-based fake news detection
project targeting low-resource Indian regional languages. Built with React +
Vite + Tailwind CSS v4. No backend required to run or demo it — everything is
backed by mock data and a simulated model pipeline in the browser.

## Running it

```bash
npm install
npm run dev
```

Open the printed localhost URL. That's it — no environment variables, no
backend, no API keys.

```bash
npm run build     # production build -> dist/
npm run preview   # serve the production build locally
```

## What's here

- **Home feed** with an inline composer, tabs, and infinite-ish scroll of posts
- **Post detail / thread view** with replies (replies are just posts with a
  `parentId`), full analysis panel, and a reply composer
- **Profile pages** with an editable bio, tabs (Posts / Replies / Likes), and a
  "credibility score" ring computed from the account's analyzed posts
- **Settings** — theme (dark by default, light, or system), detection
  preferences (auto-analyze toggle, disputed-content threshold slider),
  default post language, and a "reset demo data" button
- **Notifications** and a **search/explore** page
- **The verification stamp** — the one deliberately distinctive visual: a
  rotated, dashed-border stamp (`Verified real` / `Disputed` / `Needs
  context` / `Analyzing…`) shown on every post, with an expandable panel
  underneath showing confidence, a 3-stage pipeline readout, and matched
  sources
- Posts seeded in English, Hindi, Tamil, and Bengali, with a "see translation"
  toggle where a gloss is available
- Dark mode by default, persisted, with no flash-of-wrong-theme on reload

## Architecture — where things live

```
src/
  services/
    api.js          <- the entire mock backend. Every exported function
                       returns a Promise shaped like a real API response.
    mlService.js     <- the simulated model pipeline (language ID -> small
                       LM triage -> transformer classifier).
    mockData.js      <- seed users/posts/trending. Edit freely for demos.
  context/
    ThemeContext.jsx  AuthContext.jsx  ToastContext.jsx
  hooks/
    usePostList.js    <- shared list state (feed / profile / replies):
                       loading, optimistic like/repost, live patch-on-update
  components/
    layout/           <- Sidebar, RightRail, MobileNav, AppShell
    post/             <- PostCard, ComposeBox, VerdictStamp, AnalysisPanel,
                          ActionBar  (VerdictStamp + AnalysisPanel are the
                          fake-news-detection-specific UI)
    common/           <- Avatar, Button, Modal, Skeleton, EmptyState, etc.
  pages/
    Home.jsx  PostDetail.jsx  Profile.jsx  Settings.jsx  Notifications.jsx  Search.jsx
```

Everything above `src/services/` (hooks, components, pages) talks to the app
*only* through the functions exported from `api.js`. Nothing imports
`mockData.js` directly except `api.js` and `mlService.js`. That's the seam.

## Wiring up your real backend

You should not need to touch any component or page to connect a real
backend. There are two files to change:

### 1. `src/services/mlService.js` — your model pipeline

This is currently a heuristic (keyword/regex) stand-in for the small-LM +
transformer classifier pipeline. Replace the body of `runPipeline()` with a
call to your inference API:

```js
export async function runPipeline(content) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: content }),
  });
  return res.json();
}
```

The function must resolve to this shape (this is the contract the UI reads):

```js
{
  verdict: "real" | "fake" | "uncertain",
  confidence: 0.0-1.0,
  model: "your-model-name-v1",
  language: { code: "hi", name: "Hindi" },
  explanation: "one or two sentences, shown in the analysis panel",
  matchedClaims: [{ title, source, stance: "supports" | "contradicts" }],
  pipeline: [{ stage, label, detail }] // shown while/after analyzing
}
```

If your real pipeline is genuinely multi-stage and slow, you can call
`onStage?.("stage_name")` as each stage completes (see the current
implementation) so the UI's "Analyzing…" state can reflect real progress
instead of a canned animation — that part is optional.

### 2. `src/services/api.js` — the REST/GraphQL layer

Every exported function here is a 1:1 stand-in for a backend endpoint.
Replace the mock-store body of each with a `fetch()` (or your API client of
choice), keeping the function name, arguments, and return shape the same.
Suggested endpoint mapping:

| Function | Suggested endpoint |
|---|---|
| `getCurrentUser()` | `GET /me` |
| `getFeed({ limit })` | `GET /feed?limit=` |
| `getPost(id)` | `GET /posts/:id` |
| `getReplies(postId)` | `GET /posts/:id/replies` |
| `createPost({ content, languageCode, parentId })` | `POST /posts` |
| `toggleLike(postId)` / `toggleRepost(postId)` | `POST /posts/:id/like` etc. |
| `getUserByUsername(username)` | `GET /users/:username` |
| `getUserPosts(username, tab)` | `GET /users/:username/posts?tab=` |
| `updateUser(username, patch)` | `PATCH /users/:username` |
| `getTrending()` | `GET /trending` |
| `searchAll(query)` | `GET /search?q=` |

`api.js` also includes a tiny pub/sub (`onPostCreated` / `onPostUpdated`) that
lets any mounted list (feed, profile, thread) react when a post is created or
its analysis finishes, regardless of which component triggered it. If you add
websocket/SSE push updates from your backend, wire them to call these same
two emit points and the rest of the UI updates itself — no component changes
needed.

### Auth

There's no real auth — `CURRENT_USER_ID` in `mockData.js` is hardcoded and
`getCurrentUser()` always returns that user. Swap `AuthContext.jsx` /
`getCurrentUser()` for your real auth flow (login screen, token storage,
etc.) whenever that's ready; nothing else depends on how auth works
internally.

## Notes for the demo

- **Reset demo data**: Settings → Demo data → "Reset demo data" wipes the
  localStorage-backed mock store back to the seed data (useful between
  presentation run-throughs).
- Posting something goes through the (simulated) full pipeline — expect a
  couple of seconds before the verdict stamp resolves from "Analyzing…" to a
  real verdict, which is intentional: it mirrors what the real pipeline will
  feel like once wired up.
- The seed data intentionally includes one already-in-"Analyzing…"-state post
  and a mix of real/fake/uncertain verdicts across languages, so the feed
  looks representative without you needing to post anything first.
