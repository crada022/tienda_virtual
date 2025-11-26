import axios from 'axios';

const API_URL = 'http://localhost:4000/api/cart';

// Obtener el carrito del usuario
export const getCart = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Agregar un producto al carrito
export const addToCart = async (productId, quantity) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    API_URL,
    { productId, quantity },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Actualizar la cantidad de un producto en el carrito
export const updateQuantity = async (itemId, quantity) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(
    `${API_URL}/update/${itemId}`,
    { quantity },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Eliminar un producto del carrito
export const removeItemFromCart = async (itemId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/${itemId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Vaciar el carrito
export const clearCart = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/clear`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
