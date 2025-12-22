// src/api/storesApi.js
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * 🔓 Obtener tienda pública por slug
 */
export async function getStorePublic(slug) {
  const res = await axios.get(`${API}/api/public/${slug}`);
  return res.data;
}

/**
 * 🔓 Obtener productos públicos (CORREGIDO)
 */
export async function getProductsPublic(storeId) {
  const res = await axios.get(`${API}/api/stores/${storeId}/products`);
  return res.data;
}

/**
 * 🔓 Obtener reseñas de la tienda
 */
export async function getStoreReviews(storeId) {
  const res = await axios.get(`${API}/api/reviews/stores/${storeId}`);
  return res.data;
}

/**
 * 🔐 Crear reseña (cliente autenticado)
 */
export async function createReview({ storeId, comment, rating }) {
  const token = localStorage.getItem(`store:${storeId}:token`);

  const res = await axios.post(
    `${API}/api/reviews`,
    { storeId, comment, rating },
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : ""
      }
    }
  );

  return res.data;
}
