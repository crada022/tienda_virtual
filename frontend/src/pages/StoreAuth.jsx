import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

/* =========================
   REGISTER
========================= */
export function StoreRegister({ slug, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/public/${slug}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al registrar");
      }

      localStorage.setItem(`store:${slug}:token`, data.token);
      window.dispatchEvent(new Event("store-auth-changed"));
      onAuth?.(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="store-auth-form">
      <h3>Crear cuenta</h3>

      {error && <div className="error">{error}</div>}

      <input
        required
        placeholder="Nombre"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <input
        required
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        required
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button disabled={loading}>
        {loading ? "Creando..." : "Registrarse"}
      </button>
    </form>
  );
}

/* =========================
   LOGIN
========================= */
export function StoreLogin({ slug, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/public/${slug}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Credenciales inválidas");
      }

      localStorage.setItem(`store:${slug}:token`, data.token);
      window.dispatchEvent(new Event("store-auth-changed"));
      onAuth?.(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="store-auth-form">
      <h3>Ingresar</h3>

      {error && <div className="error">{error}</div>}

      <input
        required
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        required
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button disabled={loading}>
        {loading ? "Entrando..." : "Ingresar"}
      </button>
    </form>
  );
}
