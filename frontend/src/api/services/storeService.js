import api from "../axios";

// Función para obtener las tiendas
export const getStores = async () => {
  const response = await api.get("/stores");
  return response.data; // Devuelve la lista de tiendas
};

// Función para crear una tienda
export const createStore = async (data) => {
  const response = await api.post("/stores", data);
  return response.data;
};
