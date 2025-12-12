const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

function buildUrl(path) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  console.debug("[authService] fetch URL ->", url);
  return url;
}

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function me() {
  const url = buildUrl("/api/auth/me");
  const resp = await fetch(url, { headers: { Accept: "application/json", ...getAuthHeaders() } });
  if (!resp.ok) throw resp;
  return resp.json();
}

export async function updateMe(payload) {
  const url = buildUrl("/api/auth/me");
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw resp;
  return resp.json();
}

export async function changePassword(currentPassword, newPassword) {
  const url = buildUrl("/api/auth/change-password");
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  if (!resp.ok) throw resp;
  return resp.json();
}

export async function login(credentials) {
  const url = buildUrl("/api/auth/login");
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  if (!resp.ok) throw resp;
  return resp.json();
}

export async function register(payload) {
  const url = buildUrl("/api/auth/register");
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw resp;
  return resp.json();
}

export async function forgotPassword(email) {
  const url = buildUrl("/api/auth/forgot-password");
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  if (!resp.ok) throw resp;
  return resp.json();
}

export async function createAIStore(payload) {
  const url = buildUrl("/api/ai/create-store");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw resp;
  return resp.json();
}