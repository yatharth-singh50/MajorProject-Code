// ---------------------------------------------------------------------------
// Frontend service layer — now talking to the real FastAPI backend
// (MajorProject-Backend) instead of the in-memory/localStorage mock store.
//
// Every exported function keeps the same name/signature/return-shape the
// rest of the app already expects (hooks, pages, components) — only the
// bodies changed, per the original file's own "wiring a real backend" plan.
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE) {
  // Fail loudly in dev rather than silently hitting a relative /undefined URL.
  // eslint-disable-next-line no-console
  console.warn("VITE_API_BASE_URL is not set — set it in .env, e.g. http://localhost:8000");
}

const TOKEN_KEY = "sathi_token";

// ---- Auth token storage ------------------------------------------------
// No login screen exists yet (see AuthContext.jsx), so for now a token is
// expected to be placed here manually, e.g. in the browser console:
//   localStorage.setItem("sathi_token", "<access_token from /auth/login>")
// `login`/`register` below do this automatically once there's a form to
// call them from.

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ---- Media URLs -----------------------------------------------------------
// Uploaded images/videos live at `/media/<id>` on the backend; GIFs from the
// picker are absolute URLs; very old posts carry inline base64.
export function mediaUrl(att) {
  if (!att) return "";
  if (att.dataBase64) return `data:${att.mimeType};base64,${att.dataBase64}`;
  if (/^https?:\/\//i.test(att.url)) return att.url;
  return `${API_BASE}${att.url}`;
}

// ---- Low-level request helper ------------------------------------------

async function request(path, { method = "GET", body, formData, auth = true } = {}) {
  const headers = {};
  // For multipart uploads the browser must set the Content-Type itself (it
  // adds the multipart boundary), so only JSON bodies get an explicit one.
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body (e.g. some error responses) — fine
  }

  if (!res.ok) {
    const message = data?.detail || `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return data;
}

// ---- Realtime: post_created / post_updated over WebSocket ------------------
// Replaces the mock's in-memory pub/sub with the backend's real WS push
// (`GET /ws` — see websockets/manager.py). Same subscribe API as before:
// call returns an unsubscribe function, so existing `useEffect(() => onPostX(cb), [])`
// call sites don't need to change.

const createdListeners = new Set();
const updatedListeners = new Set();
const deletedListeners = new Set();
const notificationListeners = new Set();

let socket = null;
let reconnectTimer = null;

function wsUrl() {
  return `${API_BASE.replace(/^http/, "ws")}/ws`;
}

function ensureSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  socket = new WebSocket(wsUrl());

  socket.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    if (msg.type === "post_created") {
      createdListeners.forEach((cb) => cb(msg.post));
    } else if (msg.type === "post_updated") {
      updatedListeners.forEach((cb) => cb(msg.post));
    } else if (msg.type === "post_deleted") {
      deletedListeners.forEach((cb) => cb(msg.ids));
    } else if (msg.type === "notification") {
      notificationListeners.forEach((cb) => cb(msg.userId));
    }
  };

  socket.onclose = () => {
    socket = null;
    // Only bother reconnecting while someone's still listening.
    if ((createdListeners.size > 0 || updatedListeners.size > 0 || deletedListeners.size > 0 || notificationListeners.size > 0) && !reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        ensureSocket();
      }, 2000);
    }
  };

  socket.onerror = () => {
    socket?.close();
  };
}

export function onPostCreated(cb) {
  createdListeners.add(cb);
  ensureSocket();
  return () => createdListeners.delete(cb);
}

export function onPostUpdated(cb) {
  updatedListeners.add(cb);
  ensureSocket();
  return () => updatedListeners.delete(cb);
}

// cb receives the id of the user a new notification is for; callers compare
// it to their own id (the server broadcasts to everyone, payload is tiny).
export function onNotification(cb) {
  notificationListeners.add(cb);
  ensureSocket();
  return () => notificationListeners.delete(cb);
}

// cb receives an array of deleted post ids (a delete cascades to replies,
// so more than one id can disappear from a single delete).
export function onPostDeleted(cb) {
  deletedListeners.add(cb);
  ensureSocket();
  return () => deletedListeners.delete(cb);
}

// ---- Auth / current user ---------------------------------------------------

export async function getCurrentUser() {
  if (!getAuthToken()) return null;
  return request("/auth/me");
}

export async function login(identifier, password) {
  // `identifier` can be a username OR an email -- the backend accepts either.
  const data = await request("/auth/login", { method: "POST", body: { identifier, password }, auth: false });
  setAuthToken(data.access_token);
  return data.user;
}

export async function register({ username, email, password, displayName }) {
  const data = await request("/auth/register", {
    method: "POST",
    body: { username, email, password, display_name: displayName },
    auth: false,
  });
  setAuthToken(data.access_token);
  return data.user;
}

export function logout() {
  clearAuthToken();
}

// ---- Feed -------------------------------------------------------------------

export async function getFeed({ limit = 20 } = {}) {
  return request(`/feed?limit=${limit}`);
}

export async function getPost(id) {
  return request(`/posts/${id}`);
}

export async function getReplies(postId) {
  return request(`/posts/${postId}/replies`);
}

// ---- Creating content ---------------------------------------------------

export async function createPost({
  content,
  languageCode = null,
  parentId = null,
  mediaIds = [],
  gifUrls = [],
  isNews = false,
}) {
  return request("/posts", {
    method: "POST",
    body: { content, languageCode, parentId, mediaIds, gifUrls, isNews },
  });
  // The fact-check pipeline runs server-side (background task) -- and only
  // for posts tagged as news -- then pushes the analyzed post over the
  // WebSocket as a `post_updated` event. No extra call needed here.
}

// Upload one image or video; resolves to { id, kind, mimeType, url } to put in
// `mediaIds`. The server checks the file's real type and size.
export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/media/upload", { method: "POST", formData });
}

// A post's whole conversation: { ancestors: [...root first], replies: [...all depths] }
export async function getThread(postId) {
  return request(`/posts/${postId}/thread`);
}

// Admin only -- tier is "gold" | "news" | "government" | "company" | null.
export async function setUserVerification(username, tier) {
  return request(`/admin/users/${encodeURIComponent(username)}/verification`, {
    method: "PUT",
    body: { tier },
  });
}

export async function deletePost(postId) {
  return request(`/posts/${postId}`, { method: "DELETE" });
  // Returns null (204 No Content). A delete cascades to replies on the
  // backend and broadcasts a `post_deleted` WS event with every id removed
  // -- see onPostDeleted above -- so other open views update automatically.
}

// ---- Engagement ---------------------------------------------------------

export async function toggleLike(postId) {
  return request(`/posts/${postId}/like`, { method: "POST" });
}

export async function toggleRepost(postId) {
  return request(`/posts/${postId}/repost`, { method: "POST" });
}

// ---- Users / profile ------------------------------------------------------

export async function getUserByUsername(username) {
  return request(`/users/${encodeURIComponent(username)}`, { auth: false });
}

export async function getUserPosts(username, tab = "posts") {
  return request(`/users/${encodeURIComponent(username)}/posts?tab=${tab}`, { auth: false });
}

export async function updateUser(username, patch) {
  // `patch` keys already line up with the backend's expected aliases
  // (displayName, bio, location, avatarColor, languages, autoAnalyze,
  // disputedThreshold, defaultPostLanguage) — see app/models/schemas.py's
  // UserUpdate. No transform needed.
  return request(`/users/${encodeURIComponent(username)}`, { method: "PATCH", body: patch });
}

// ---- Discovery --------------------------------------------------------------

export async function getTrending() {
  return request("/trending", { auth: false });
}

export async function searchAll(query) {
  if (!query.trim()) return { posts: [], users: [] };
  return request(`/search?q=${encodeURIComponent(query)}`, { auth: false });
}

// ---- GIF search (compose box picker) ---------------------------------------

export async function searchGifs(query) {
  return request(`/gifs/search?q=${encodeURIComponent(query)}`, { auth: false });
  // -> { results: [{id, url, previewUrl, title}], configured: bool }
}

// ---- Notifications ----------------------------------------------------------
// Likes, reposts, replies and fact-check results on your posts.

export async function getNotifications() {
  return request("/notifications");
}

export async function markNotificationRead(id) {
  return request(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead() {
  return request("/notifications/read-all", { method: "POST" });
}

export async function getUnreadNotificationCount() {
  const data = await request("/notifications/unread-count");
  return data?.count ?? 0;
}

// ---- Demo data reset ----------------------------------------------------
// No-op now — there's no local mock store left to reset. Kept so
// Settings.jsx's existing "reset demo data" button doesn't need changing.

export async function resetMockData() {
  // eslint-disable-next-line no-console
  console.info("resetMockData: no-op — now backed by a real database.");
  return true;
}
