// ---------------------------------------------------------------------------
// Frontend service layer.
//
// Every function here returns a Promise, shaped the way a real REST/GraphQL
// call would respond. Right now they read/write an in-memory + localStorage
// mock store. To wire up a real backend, replace the *body* of each function
// with a `fetch(...)` call — keep the function names and return shapes the
// same and nothing above this file (components, hooks, pages) needs to
// change. See README.md for the intended REST endpoints per function.
// ---------------------------------------------------------------------------

import { seedUsers, seedPosts, trending, CURRENT_USER_ID } from "./mockData";
import { runPipeline } from "./mlService";

const STORAGE_KEY = "sathi_mock_db_v1";
const NETWORK_DELAY = 380;

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return { users: seedUsers, posts: seedPosts };
}

let db = loadDb();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // storage full / unavailable — fine for a demo, state just won't persist
  }
}

const delay = (ms = NETWORK_DELAY) => new Promise((r) => setTimeout(r, ms + Math.random() * 180));
const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

// ---- Realtime-ish pub/sub ---------------------------------------------------
// A real backend would push these over a websocket/SSE connection; for the
// mock layer we use a plain in-memory event bus so any mounted list (feed,
// profile, thread) stays in sync no matter which component created/changed
// a post. Swap this for a socket subscription later without touching call
// sites — they just call onPostCreated/onPostUpdated.

const createdListeners = new Set();
const updatedListeners = new Set();

export function onPostCreated(cb) {
  createdListeners.add(cb);
  return () => createdListeners.delete(cb);
}
export function onPostUpdated(cb) {
  updatedListeners.add(cb);
  return () => updatedListeners.delete(cb);
}

function hydratePost(post) {
  const author = db.users.find((u) => u.id === post.authorId);
  const replyCount = db.posts.filter((p) => p.parentId === post.id).length;
  return {
    ...post,
    author,
    stats: { ...post.stats, comments: replyCount },
  };
}

function trustScoreFor(userId) {
  const posts = db.posts.filter((p) => p.authorId === userId && p.analysis?.status === "analyzed");
  if (posts.length === 0) return null;
  const real = posts.filter((p) => p.analysis.verdict === "real").length;
  const fake = posts.filter((p) => p.analysis.verdict === "fake").length;
  const scored = real + fake;
  if (scored === 0) return null;
  return Math.round((real / scored) * 100);
}

// ---- Auth / current user ---------------------------------------------------

export async function getCurrentUser() {
  await delay(120);
  const u = db.users.find((u) => u.id === CURRENT_USER_ID);
  return { ...u, trustScore: trustScoreFor(u.id) };
}

// ---- Feed -------------------------------------------------------------------

export async function getFeed({ limit = 20 } = {}) {
  await delay();
  return db.posts
    .filter((p) => p.parentId === null)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map(hydratePost);
}

export async function getPost(id) {
  await delay(220);
  const post = db.posts.find((p) => p.id === id);
  if (!post) throw new Error("Post not found");
  return hydratePost(post);
}

export async function getReplies(postId) {
  await delay(260);
  return db.posts
    .filter((p) => p.parentId === postId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(hydratePost);
}

// ---- Creating content ---------------------------------------------------

export async function createPost({ content, languageCode = null, parentId = null }) {
  await delay(300);
  const id = uid(parentId ? "c" : "p");
  const post = {
    id,
    authorId: CURRENT_USER_ID,
    parentId,
    language: languageCode ? { code: languageCode, name: languageCode } : { code: "auto", name: "Detecting…" },
    content,
    media: null,
    createdAt: new Date().toISOString(),
    stats: { likes: 0, reposts: 0, comments: 0, views: 1 },
    likedByMe: false,
    repostedByMe: false,
    analysis: { status: "processing", verdict: null, confidence: null, model: "IndicBERT-FND v0.4", explanation: "", matchedClaims: [], pipeline: [] },
  };
  db.posts.unshift(post);
  persist();

  const hydrated = hydratePost(post);
  createdListeners.forEach((cb) => cb(hydrated));

  // fire-and-forget the async "model pipeline"; components stay in sync via
  // the onPostUpdated bus (see usePostList) rather than polling.
  runPipeline(content).then((result) => {
    const target = db.posts.find((p) => p.id === id);
    if (!target) return;
    target.analysis = { status: "analyzed", ...result };
    target.language = result.language;
    persist();
    const updated = hydratePost(target);
    updatedListeners.forEach((cb) => cb(updated));
  });

  return hydrated;
}

// ---- Engagement ---------------------------------------------------------

export async function toggleLike(postId) {
  await delay(150);
  const post = db.posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  post.likedByMe = !post.likedByMe;
  post.stats.likes += post.likedByMe ? 1 : -1;
  persist();
  const updated = hydratePost(post);
  updatedListeners.forEach((cb) => cb(updated));
  return updated;
}

export async function toggleRepost(postId) {
  await delay(150);
  const post = db.posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  post.repostedByMe = !post.repostedByMe;
  post.stats.reposts += post.repostedByMe ? 1 : -1;
  persist();
  const updated = hydratePost(post);
  updatedListeners.forEach((cb) => cb(updated));
  return updated;
}

// ---- Users / profile ------------------------------------------------------

export async function getUserByUsername(username) {
  await delay(220);
  const user = db.users.find((u) => u.username === username);
  if (!user) throw new Error("User not found");
  return { ...user, trustScore: trustScoreFor(user.id) };
}

export async function getUserPosts(username, tab = "posts") {
  await delay();
  const user = db.users.find((u) => u.username === username);
  if (!user) return [];
  if (tab === "posts") {
    return db.posts.filter((p) => p.authorId === user.id && p.parentId === null).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(hydratePost);
  }
  if (tab === "replies") {
    return db.posts.filter((p) => p.authorId === user.id && p.parentId !== null).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(hydratePost);
  }
  if (tab === "likes") {
    return db.posts.filter((p) => p.likedByMe && user.id === CURRENT_USER_ID).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(hydratePost);
  }
  return [];
}

export async function updateUser(username, patch) {
  await delay(300);
  const user = db.users.find((u) => u.username === username);
  if (!user) throw new Error("User not found");
  Object.assign(user, patch);
  persist();
  return { ...user, trustScore: trustScoreFor(user.id) };
}

// ---- Discovery --------------------------------------------------------------

export async function getTrending() {
  await delay(200);
  return trending;
}

export async function searchAll(query) {
  await delay(260);
  const q = query.trim().toLowerCase();
  if (!q) return { posts: [], users: [] };
  const posts = db.posts
    .filter((p) => p.parentId === null && (p.content.toLowerCase().includes(q) || p.translation?.toLowerCase().includes(q)))
    .map(hydratePost);
  const users = db.users.filter(
    (u) => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
  );
  return { posts, users };
}

export async function resetMockData() {
  localStorage.removeItem(STORAGE_KEY);
  db = { users: seedUsers, posts: seedPosts };
  return true;
}
