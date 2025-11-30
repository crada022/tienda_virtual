import api from "../axios";

// Función para hacer login
export const login = async (data) => {
  try {
    const response = await api.post("/users/login", data);  // Hacer la solicitud POST
    return response.data; // Devuelve el token y el usuario
  } catch (error) {
    throw new Error("Error al iniciar sesión");
  }
};
export const register = async (data) => {
  try {
    const response = await api.post("/users/register", data);  // Solicitud POST para registrar
    return response.data; // Devuelve el usuario o algún dato relevante
  } catch (error) {
    throw new Error("Error al registrar el usuario");
  }
};