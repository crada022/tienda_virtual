import { create } from "zustand";

export const useAuth = create((set) => ({
  user: null, // Usuario actual
  token: localStorage.getItem("token") || null, // Token desde localStorage o null si no hay

  // Función para loguear al usuario y guardar el token
  login: (user, token) => {
    localStorage.setItem("token", token); // Guarda el token en localStorage
    set({ user, token }); // Guarda el usuario y el token en el estado global
  },

  // Función para hacer logout (eliminar datos del usuario y token)
  logout: () => {
    localStorage.removeItem("token"); // Elimina el token de localStorage
    set({ user: null, token: null }); // Limpia el estado global
  },
}));
