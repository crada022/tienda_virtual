import axios from "./axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Obtener tienda pública
export async function getStorePublic(id) {
  const res = await fetch(`${API}/api/stores/public/${id}`);
  if (!res.ok) throw new Error(`Error obteniendo tienda ${res.status}`);
  return await res.json();
}

// Obtener productos públicos
export async function getProductsPublic(id, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") params.set(k, String(v));
  });

  const url = `${API}/api/stores/public/${id}/products${params.toString() ? "?" + params.toString() : ""}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// Obtener reseñas de la tienda
export const getStoreReviews = async (storeId) => {
  const res = await fetch(`${API}/api/reviews/stores/${storeId}`);
  if (!res.ok) throw new Error(`Error cargando reseñas: ${res.status}`);
  return res.json();
};

// Crear una nueva reseña
export const createReview = async (storeId, data) => {
  const payload = { ...data, storeId };
  const res = await fetch(`${API}/api/reviews`, {
    
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // incluir token si es necesario
      Authorization: `Bearer ${localStorage.getItem(`store:${storeId}:token`) || ""}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Error creando reseña: ${res.status}`);
  return res.json();
};
