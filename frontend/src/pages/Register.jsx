import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/services/authService";
import { useAuth } from "../store/useAuth";
import "./Login.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password) return setError("Todos los campos son obligatorios.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    try {
      const data = await register({ name, email, password });
      const token = data?.token || data?.accessToken || data?.data?.token || (typeof data === "string" ? data : null);
      if (token) {
        localStorage.setItem("token", token);
        if (auth && typeof auth.setToken === "function") auth.setToken(token);
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (err) {
      const msg = err?.message || (err?.statusText ? `${err.status}: ${err.statusText}` : "Error registrando usuario.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Crear cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" />
          </div>
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmar contraseña" />
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="actions">
            <button type="submit" disabled={loading}>{loading ? "Creando..." : "Crear cuenta"}</button>
            <span className="small-note">¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></span>
          </div>
        </form>
      </div>
    </div>
  );
}
