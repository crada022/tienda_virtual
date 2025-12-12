import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/services/authService";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!email) return setErr("Ingresa tu correo.");
    setLoading(true);
    try {
      await forgotPassword(email);
      setMsg("Si el correo existe, recibirás instrucciones para recuperar la contraseña.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (e) {
      setErr("No se pudo enviar el correo. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Recuperar contraseña</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" />
          </div>
          {msg && <p className="success">{msg}</p>}
          {err && <p className="error">{err}</p>}
          <div className="actions">
            <button type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar instrucciones"}</button>
            <span className="small-note"><a href="/login">Volver al inicio</a></span>
          </div>
        </form>
      </div>
    </div>
  );
}