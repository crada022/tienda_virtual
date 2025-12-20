import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function StoreEditor() {
  const { storeId } = useParams();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const [store, setStore] = useState(null);
  const [saving, setSaving] = useState(false);

  // 🎨 colores controlados
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");

  /* =========================
     CARGAR TIENDA
  ========================= */
  useEffect(() => {
    fetch(`${API}/api/stores/${storeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const theme = Array.isArray(data.colorTheme)
          ? data.colorTheme
          : typeof data.colorTheme === "string"
            ? JSON.parse(data.colorTheme)
            : [];

        setPrimaryColor(theme[0] || "#000000");
        setSecondaryColor(theme[1] || "#ffffff");

        setStore({
          ...data,
          colorTheme: theme
        });
      });
  }, [storeId]);

  function update(field, value) {
    setStore(prev => ({ ...prev, [field]: value }));
  }

  /* =========================
     CAMBIO DE COLORES (CLAVE)
  ========================= */
  function updatePrimary(color) {
    setPrimaryColor(color);
    setStore(prev => ({
      ...prev,
      colorTheme: [color, prev.colorTheme?.[1] || "#ffffff"]
    }));
  }

  function updateSecondary(color) {
    setSecondaryColor(color);
    setStore(prev => ({
      ...prev,
      colorTheme: [prev.colorTheme?.[0] || "#000000", color]
    }));
  }

  /* =========================
     GUARDAR
  ========================= */
  async function save() {
    setSaving(true);

    const form = new FormData();
    form.append("name", store.name);
    form.append("description", store.description || "");
    form.append("layoutType", store.layoutType || "grid");
    form.append("style", store.style || "");
    form.append("bannerUrl", store.bannerUrl || "");
    form.append("colorTheme", JSON.stringify(store.colorTheme));

    const res = await fetch(`${API}/api/stores/${storeId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });

    setSaving(false);

    if (!res.ok) {
      alert("❌ Error guardando tienda");
      return;
    }

    alert("✅ Tienda actualizada");
  }

  if (!store) return <p>Cargando editor...</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "100vh" }}>
      
      {/* PANEL */}
      <aside style={{ padding: 20, borderRight: "1px solid #ddd", overflowY: "auto" }}>
        <h3>Editor visual</h3>

        <label>Nombre</label>
        <input
          value={store.name}
          onChange={e => update("name", e.target.value)}
        />

        <label>Descripción</label>
        <textarea
          value={store.description || ""}
          onChange={e => update("description", e.target.value)}
        />

        <label>Color primario (botones)</label>
        <input
          type="color"
          value={primaryColor}
          onChange={e => updatePrimary(e.target.value)}
        />

        <label>Color secundario</label>
        <input
          type="color"
          value={secondaryColor}
          onChange={e => updateSecondary(e.target.value)}
        />

        <label>Layout</label>
        <select
          value={store.layoutType || "grid"}
          onChange={e => update("layoutType", e.target.value)}
        >
          <option value="hero">Hero</option>
          <option value="grid">Grid</option>
          <option value="catalog">Catálogo</option>
          <option value="minimal">Minimal</option>
        </select>

        <label>Banner (URL)</label>
        <input
          placeholder="https://res.cloudinary.com/..."
          value={store.bannerUrl || ""}
          onChange={e => update("bannerUrl", e.target.value)}
        />

        <label>CSS personalizado</label>
        <textarea
          rows={6}
          placeholder=".btnAdd { border-radius: 16px; }"
          value={store.style || ""}
          onChange={e => update("style", e.target.value)}
        />

        <button onClick={save} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </aside>

      {/* PREVIEW */}
      <iframe
        key={JSON.stringify(store)}
        src={`/stores/${storeId}`}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
