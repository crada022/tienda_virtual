import api from "../axios";

export const getStores = async () => {
  const response = await api.get("/stores");
  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.stores)) return data.stores;
  return [];
};

export const createStore = async (data) => {
  const response = await api.post("/stores", data);
  return response.data;
};
