import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStores, deleteStore } from "../api/services/storeService";
import { useStoreContext } from "../store/useStoreContext";
import { PUBLIC_STORE_URL } from "../config";
import "./StoresList.css";

export default function StoresList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { setCurrentStoreId } = useStoreContext();

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    setLoading(true);
    try {
      const data = await getStores();

      // 🔴 NORMALIZACIÓN CLAVE (active ← isActive)
      const normalized = (Array.isArray(data) ? data : data.stores || []).map(
        (s) => ({
          ...s,
          active: s.active ?? true
        })
      );

      setStores(normalized);
    } catch (err) {
      console.error(err);
      setError("Error cargando tiendas");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`¿Eliminar la tienda "${name}"?`)) return;

    setDeletingId(id);
    try {
      await deleteStore(id);
      setStores((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert("Error eliminando tienda");
    } finally {
      setDeletingId(null);
    }
  }

  function handleViewStore(store) {
    // 👉 si ya usas slug en público
    window.open(`${PUBLIC_STORE_URL}/store/${store.slug}`, "_blank");
  }

  function handleManageProducts(id) {
    setCurrentStoreId(id);
    navigate(`/stores/${id}/manage-products`);
  }

  function handleEditStore(id) {
    navigate(`/stores/${id}/edit`);
  }

  if (loading) {
    return (
      <div className="stores-list-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Cargando tiendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stores-list-container">
      <header className="stores-header">
        <h1>Mis tiendas</h1>
        <button
          className="btn-create-store"
          onClick={() => navigate("/stores/create")}
        >
          + Crear tienda
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {stores.length === 0 && (
        <div className="empty-state">
          <h3>No tienes tiendas</h3>
          <p>Crea tu primera tienda</p>
        </div>
      )}

      <div className="stores-grid">
        {stores.map((store) => (
          <article
            key={store.id}
            className={`store-card ${store.active ? "active" : "inactive"}`}
          >
            {/* HEADER */}
            <div className="store-card-header">
              <div className="store-avatar">
                {store.name?.slice(0, 2).toUpperCase()}
              </div>

              <div className="store-status">
                {store.active ? "Activa" : "Inactiva"}
              </div>
            </div>

            {/* BODY */}
            <div className="store-card-body">
              <h3>{store.name}</h3>
              <p>{store.description || "Sin descripción"}</p>
            </div>

            {/* FOOTER */}
            <div className="store-card-footer">
              <button
                className="action-btn secondary"
                disabled={!store.active}
                onClick={() => handleManageProducts(store.id)}
              >
                Productos
              </button>

              <button
                className="action-btn secondary"
                disabled={!store.active}
                onClick={() => handleViewStore(store)}
              >
                Ver
              </button>

              <button
                className="action-btn primary"
                onClick={() => handleEditStore(store.id)}
              >
                Editar
              </button>

              <button
                className="action-btn danger"
                disabled={deletingId === store.id}
                onClick={() => handleDelete(store.id, store.name)}
              >
                {deletingId === store.id ? "..." : "Eliminar"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
