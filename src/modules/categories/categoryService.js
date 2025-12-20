import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api",
});

function getAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ========================
   CATEGORÍAS
======================== */
export const getCategories = async (storeId, token) => {
  const res = await API.get(`/stores/${storeId}/categories`, {
    headers: getAuthHeaders(token),
  });
  return res.data;
};

export const createCategory = async (storeId, name, token) => {
  const res = await API.post(
    `/stores/${storeId}/categories`,
    { name },
    { headers: getAuthHeaders(token) }
  );
  return res.data;
};

export const updateCategory = async (storeId, categoryId, data, token) => {
  const res = await API.put(`/stores/${storeId}/categories/${categoryId}`, data, {
    headers: getAuthHeaders(token),
  });
  return res.data;
};

export const deleteCategory = async (storeId, categoryId, token) => {
  const res = await API.delete(`/stores/${storeId}/categories/${categoryId}`, {
    headers: getAuthHeaders(token),
  });
  return res.data;
};