import api from "../axios";

// Obtener productos de la tienda
export const getProducts = async (storeId) => {
  const response = await api.get(`/stores/${storeId}/products`);
  return response.data;
};

// Agregar un producto a la tienda
export const addProduct = async (storeId, productData) => {
  const body = { ...productData, price: Number(productData.price) };
  const response = await api.post(`/stores/${storeId}/products`, body);
  return response.data;
};

// Eliminar un producto
export const deleteProduct = async (storeId, productId) => {
  const response = await api.delete(`/stores/${storeId}/products/${productId}`);
  return response.data;
};

// Actualizar un producto
export const updateProduct = async (storeId, productId, updatedData) => {
  const response = await api.put(`/stores/${storeId}/products/${productId}`, updatedData);
  return response.data;
};
