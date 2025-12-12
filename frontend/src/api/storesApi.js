import axios from "./axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function getStorePublic(id) {
  const res = await fetch(`${API}/api/stores/public/${id}`);
  if (!res.ok) throw new Error(`Error obteniendo tienda ${res.status}`);
  return await res.json();
}

export async function getProductsPublic(id, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") params.set(k, String(v));
  });

  const url = `${API}/api/stores/public/${id}/products${params.toString() ? "?" + params.toString() : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`getProductsPublic ${id} -> ${res.status}`);
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export const getStores = async () => {
  const res = await axios.get("/stores");
  return res.data;
};