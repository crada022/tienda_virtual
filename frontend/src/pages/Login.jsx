import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/services/authService"; // Asegúrate de importar correctamente
import "./Login.css";
import { useAuth } from "../store/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth(); // hook para actualizar token en el store

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const data = await login({ email, password });

      // soportar diferentes formas de respuesta
      const token =
        data?.token ||
        data?.accessToken ||
        data?.data?.token ||
        (typeof data === "string" ? data : null);

      if (!token) {
        setError("Respuesta inválida del servidor. No se recibió token.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      // Actualizar el auth store si está disponible; si no, hacer fallback a navegación forzada
      if (auth && typeof auth.setToken === "function") {
        auth.setToken(token);
        navigate("/dashboard", { replace: true });
      } else {
        // fallback: forzar navegación para que la app pueda leer token desde localStorage
        window.location.href = "/dashboard";
      }
    } catch (err) {
      // Mostrar mensaje proveniente del backend si existe
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Credenciales inválidas. Por favor, intente nuevamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="error" role="alert">{error}</p>}

          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? "Cargando..." : "Iniciar sesión"}
            </button>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <a href="/forgot-password" className="small-note">¿Olvidaste tu contraseña?</a>
              <a href="/register" className="small-note">¿No tienes cuenta? Regístrate</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
