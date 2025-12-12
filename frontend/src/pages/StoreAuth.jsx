import { useState } from "react";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function StoreRegister({ storeId, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/stores/${storeId}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem(`store:${storeId}:token`, data.token);
        onAuth?.(data);
      } else {
        setError(data.error || "Error al registrar");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="store-auth-form">
      <h3>Crear cuenta en esta tienda</h3>
      {error && <div className="error">{error}</div>}
      <input required type="text" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
      <input required type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input required type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? "Creando..." : "Registrarse"}</button>
    </form>
  );
}

export function StoreLogin({ storeId, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/stores/${storeId}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem(`store:${storeId}:token`, data.token);
        onAuth?.(data);
      } else {
        setError(data.error || "Credenciales inválidas");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="store-auth-form">
      <h3>Ingresar a esta tienda</h3>
      {error && <div className="error">{error}</div>}
      <input required type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input required type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? "Entrando..." : "Ingresar"}</button>
    </form>
  );
}