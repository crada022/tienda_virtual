// src/pages/CreateStore.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createStore, createStoreWithAI } from "../api/services/storeService";
import { createAIStore } from "../api/services/authService.js";
import "../App.css";

export default function CreateStore() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    domain: ""
  });
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (useAI) {
        // envia la descripción / prompt a la ruta IA
        const prompt = form.description || `Crea una tienda moderna llamada ${form.name || "Mi tienda"}.`;
        const result = await createStoreWithAI(prompt);
        alert("Tienda generada con IA");
        navigate("/stores/list");
        return;
      }

      const { name, description, /* ... */ } = form;
      const payload = { name, description, /* ... */ };
      const result = await createAIStore(payload);
      alert("Tienda creada");
      navigate("/stores/list");
    } catch (err) {
      console.error(err);
      // si err es Response de fetch, intenta leer body para mensaje
      try {
        const body = await err.json();
        setError(body.message || "Error creando tienda");
      } catch (_) {
        setError("Error creando tienda");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title">Crear nueva tienda</div>
          <div className="page-sub">Llena los datos y publica tu tienda en segundos</div>
        </div>
      </header>

      <section className="card" style={{ marginTop: 12 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row">
              <label className="muted">Nombre</label>
              <input className="input" name="name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <label className="muted">Subdominio / dominio (opcional)</label>
              <input className="input" name="domain" value={form.domain} onChange={handleChange} placeholder="mitienda.ejemplo.com" />
            </div>

            <div className="form-row">
              <label className="muted">Teléfono</label>
              <input className="input" name="phone" value={form.phone} onChange={handleChange} />
            </div>

            <div className="form-row">
              <label className="muted">Email de contacto</label>
              <input className="input" name="email" value={form.email} onChange={handleChange} type="email" />
            </div>

            <div style={{ gridColumn: "1 / -1" }} className="form-row">
              <label className="muted">Dirección</label>
              <input className="input" name="address" value={form.address} onChange={handleChange} />
            </div>

            <div style={{ gridColumn: "1 / -1" }} className="form-row">
              <label className="muted">Descripción (si marcas IA se usará como prompt)</label>
              <textarea name="description" value={form.description} onChange={handleChange} />
            </div>

            <div style={{ gridColumn: "1 / -1" }} className="form-row">
              <label>
                <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
                &nbsp; Sí, quiero que la tienda se genere automáticamente con IA
              </label>
            </div>

          </div>

          {error && <div className="error-message">{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate("/stores/list")}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (useAI ? "Generando..." : "Creando...") : (useAI ? "Generar con IA" : "Crear tienda")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
