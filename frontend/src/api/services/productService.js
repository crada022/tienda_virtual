import api from "../axios";

// intento leer token desde varias claves comunes
function readTokenFromStorage() {
  try {
    if (typeof window === "undefined") return null;
    const keys = ["token", "accessToken", "access_token", "authToken", "jwt"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    return window.__APP_TOKEN__ || null;
  } catch (e) {
    return null;
  }
}

/* ============================
   📦 PRODUCTOS
============================ */

// Obtener productos de la tienda
export const getProducts = async (storeId) => {
  try {
    const response = await api.get(`/stores/${storeId}/products`);
    if (Array.isArray(response.data)) return response.data;
    return response.data.products || [];
  } catch (err) {
    const status = err?.response?.status;
    const serverData = err?.response?.data;
    console.error("[getProducts] error:", { status, serverData, err });
    const message = serverData?.message || serverData?.error || err.message || "Error al obtener productos";
    const e = new Error(`getProducts: ${message} (status: ${status})`);
    e.original = err;
    e.server = serverData;
    throw e;
  }
};

export async function addProduct(storeId, payload) {
  try {
    const token = readTokenFromStorage();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await api.post(`/stores/${storeId}/products`, payload, { headers });
    return res.data;
  } catch (err) {
    console.error("[addProduct] error:", err?.response?.data || err.message, "request:", err?.config);
    throw err;
  }
};

// Eliminar producto
export const deleteProduct = async (storeId, productId) => {
  const response = await api.delete(`/stores/${storeId}/products/${productId}`);
  return response.data;
};

// Actualizar producto
export const updateProduct = async (storeId, productId, updatedData) => {
  try {
    if (updatedData.price !== undefined) {
      const price = Number(updatedData.price);
      if (Number.isNaN(price)) throw new Error("Price inválido");
      updatedData = { ...updatedData, price };
    }

    const response = await api.put(
      `/stores/${storeId}/products/${productId}`,
      updatedData
    );

    return response.data.product || response.data;
  } catch (err) {
    const status = err?.response?.status;
    const serverData = err?.response?.data;
    const message = serverData?.message || err.message || "Error al actualizar producto";
    const enriched = new Error(`updateProduct: ${message} (status: ${status})`);
    enriched.original = err;
    enriched.server = serverData;
    throw enriched;
  }
};


/* ============================

============================ */

// Obtener categorías
export async function getCategories(storeId) {
  try {
    const response = await api.get(`/stores/${storeId}/categories`);
    return Array.isArray(response.data)
      ? response.data
      : response.data.categories || [];
  } catch (err) {
    const status = err?.response?.status;
    const serverData = err?.response?.data;
    const msg = serverData?.message || serverData?.error || err.message || "Error al obtener categorías";
    const e = new Error(`getCategories: ${msg} (status: ${status})`);
    e.original = err;
    e.server = serverData;
    console.error("[getCategories] error:", e, "server:", serverData);
    throw e;
  }
}

// Crear categoría
export async function createCategory(storeId, name, description = "") {
  try {
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new Error("El nombre de la categoría es requerido");
    }

    const token = readTokenFromStorage();
    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    const body = {
      name: name.trim(),
      description: description || "",
      storeId,
    };

    const response = await api.post(
      `/stores/${storeId}/categories`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`, // 🔥 ESTA ERA LA LÍNEA QUE FALTABA
        },
      }
    );

    return response.data.category || response.data;
  } catch (err) {
    const status = err?.response?.status;
    const serverData = err?.response?.data;
    const serverMsg = serverData?.message || serverData?.error;
    const message = serverMsg || err.message || "Error al crear categoría";
    const enriched = new Error(`createCategory: ${message} (status: ${status})`);
    enriched.original = err;
    enriched.server = serverData;
    enriched.request =
      err?.config && {
        url: err.config.url,
        method: err.config.method,
        data: err.config.data,
        headers: err.config.headers,
      };

    console.error("[createCategory] error:", enriched);
    throw enriched;
  }
}


// Eliminar categoría
export async function deleteCategory(storeId, categoryId) {
  try {
    const response = await api.delete(`/stores/${storeId}/categories/${categoryId}`);
    return response.data;
  } catch (err) {
    const status = err?.response?.status;
    const serverData = err?.response?.data;
    const message = serverData?.message || serverData?.error || err.message || "Error al eliminar categoría";
    const e = new Error(`deleteCategory: ${message} (status: ${status})`);
    e.original = err;
    e.server = serverData;
    console.error("[deleteCategory] error:", e, "server:", serverData);
    throw e;
  }
}
