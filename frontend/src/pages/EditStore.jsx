import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./EditStore.css";

export default function EditStore({ storeId, onSaved }) {
  const [store, setStore] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoUrl, setLogoUrl] = useState(""); // para permitir URL directa
  const [loading, setLoading] = useState(false); // para guardar
  const [loadingFetch, setLoadingFetch] = useState(true); // nuevo: para cargar tienda
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // usar params como fallback si no llega storeId por props
  const params = useParams();
  const location = useLocation();
  // intentar obtener id desde props, params o última parte de la URL como fallback (más robusto)
  const routeId = params?.id;
  const urlFallbackId = (() => {
    try {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const shortIdRegex = /^[0-9a-fA-F-]{4,}$/;
      // Priorizar segmentos que coincidan con UUID o patrones numéricos/short-id
      for (const p of parts) {
        if (uuidRegex.test(p) || /^\d+$/.test(p) || shortIdRegex.test(p)) return p;
      }
      // Si la última parte es un verbo conocido ('edit','new','create'), tomar la anterior
      const last = parts[parts.length - 1];
      if (last && ["edit", "new", "create"].includes(last.toLowerCase())) {
        return parts.length > 1 ? parts[parts.length - 2] : null;
      }
      // fallback simple: la última parte de la ruta
      return parts.length ? parts[parts.length - 1] : null;
    } catch (e) {
      return null;
    }
  })();
  const idToUse = storeId || routeId || urlFallbackId;

  // base API (leer VITE_API_BASE o fallback)
  const apiBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "http://localhost:4000";

  // evitar que "edit" u otras palabras se usen como id
  const effectiveId = (idToUse && typeof idToUse === "string" && ["edit", "new", "create"].includes(idToUse.toLowerCase()))
    ? (() => {
        const parts = window.location.pathname.split("/").filter(Boolean);
        return parts.length > 1 ? parts[parts.length - 2] : null;
      })()
    : idToUse;

  // mostrar error si no hay id
  useEffect(() => {
    if (!idToUse) {
      setError("ID de tienda no disponible");
      setLoadingFetch(false);
    }
  }, [idToUse]);

  useEffect(() => {
    if (!effectiveId) {
      setError("ID de tienda no disponible");
      setLoadingFetch(false);
      return;
    }
    setLoadingFetch(true);
    setError(null);
    // intentar obtener token en varias keys comunes
    const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const url = `${apiBase}/api/stores/${effectiveId}`;
    console.debug("[EditStore] GET", url, headers ? "with token" : "no token");
    axios.get(url, { headers })
      .then(res => {
        setStore(res.data);
        setName(res.data.name || "");
        setDescription(res.data.description || "");
        setLogoPreview(res.data.logoUrl || "");
        setLogoUrl(res.data.logoUrl || "");
      })
      .catch(err => {
        console.error("[EditStore] error fetching store:", err?.response || err);
        const message = err?.response?.data?.message || err?.response?.data || err.message || "Error desconocido";
        setError(message);
        setStore(null);
      })
      .finally(() => setLoadingFetch(false));
  }, [idToUse]);

  function handleFileChange(e) {
    const f = e.target.files[0];
    setLogoFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setLogoPreview(url);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("description", description || "");
      if (logoFile) {
        form.append("logo", logoFile);
      } else if (logoUrl) {
        form.append("logoUrl", logoUrl);
      }
      const config = {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      };
      // incluir token si existe
      const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      const putUrl = `${apiBase}/api/stores/${effectiveId}`;
      console.debug("[EditStore] PUT", putUrl);
      const res = await axios.put(putUrl, form, config);
      setStore(res.data);
      if (onSaved) onSaved(res.data);
      navigate(`/stores/${idToUse}/manage-products`); // redirige tras guardar
    } catch (err) {
      console.error("[EditStore] save error:", err?.response || err);
      setError(err?.response?.data?.message || err.message || "Error guardando tienda");
    } finally {
      setLoading(false);
    }
  }

  if (loadingFetch) return <div>Cargando tienda...</div>;
  if (error && !store) return <div className="error">{typeof error === "string" ? error : JSON.stringify(error)}</div>;

  return (
    <div className="edit-store">
      <h2>Editar tienda</h2>
      {error && <div className="error">{typeof error === "string" ? error : JSON.stringify(error)}</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div>
          <label>Nombre</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div>
          <label>Descripción</label>
          <textarea className="textarea-white" value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div>
          <label>Logo (subir archivo)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <div>
          <label>O usar URL de logo</label>
          <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div>
          <label>Vista previa</label>
          {logoPreview ? <img src={logoPreview} alt="preview" style={{ maxHeight: 120 }} /> : <div>No hay logo</div>}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}