import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const api = axios.create({
  baseURL: API_BASE || undefined,
  headers: { "Content-Type": "application/json" }
});

// intento leer token desde varias claves comunes y fallback a window.__APP_TOKEN__
function readTokenFromStorage() {
  try {
    if (typeof window === "undefined") return null;
    const keys = ["token", "accessToken", "access_token", "authToken", "jwt"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    // fallback: alguna app puede exponer token globalmente (solo para debug)
    return window.__APP_TOKEN__ || null;
  } catch (e) {
    return null;
  }
}

// Interceptor: inyecta token actual desde storage antes de cada petición
api.interceptors.request.use((config) => {
  try {
    const token = readTokenFromStorage();
    // Log temporal para depurar (elimina en producción)
    console.debug("[storeService] token present:", !!token, token ? `${token.slice(0,8)}...${token.slice(-8)}` : null);
    if (token) {
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }
  } catch (e) {
    console.warn("[storeService] error leyendo token", e);
  }
  return config;
}, (err) => Promise.reject(err));

// create with AI
export async function createStoreWithAI(prompt) {
  try {
    const token = readTokenFromStorage();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const resp = await api.post("/api/stores/create/ai", { prompt }, { headers });
    return resp.data;
  } catch (err) {
    console.error("[storeService.createStoreWithAI] error:", err?.response?.data || err.message);
    throw err;
  }
}

// create normal
export async function createStore(payload) {
  try {
    const resp = await api.post("/api/stores", payload);
    return resp.data;
  } catch (err) {
    console.error("[storeService.createStore] error:", err?.response?.data || err.message);
    throw err;
  }
}

export const getStores = async () => {
  try {
    const response = await api.get("/api/stores");
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.stores)) return data.stores;
    return [];
  } catch (err) {
    console.error("[storeService.getStores] error:", err?.response?.data || err.message);
    return [];
  }
};

export async function deleteStore(id) {
  const res = await api.delete(`/api/stores/${id}`);
  return res.data;
}
