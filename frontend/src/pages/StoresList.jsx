import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStores } from "../api/services/storeService";
import { useStoreContext } from "../store/useStoreContext";
import "../App.css";
import "./StoresList.css"; 
import { PUBLIC_STORE_URL } from "../config";
import { deleteStore } from "../api/services/storeService";

export default function StoresList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setCurrentStoreId } = useStoreContext();

  useEffect(() => {
    console.log("📌 StoresList MONTADO");
    setLoading(true);
    getStores()
      .then((list) => {
        if (!Array.isArray(list)) {
          console.warn("getStores returned non-array:", list);
          setStores(Array.isArray(list?.stores) ? list.stores : []);
        } else {
          setStores(list);
        }
      })
      .catch(err => {
        console.error("Error getStores:", err);
        setStores([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Nuevo: handler para eliminar tienda
  const handleDelete = async (storeId, storeName) => {
    const ok = window.confirm(`Eliminar la tienda "${storeName}"? Esta acción es irreversible.`);
    if (!ok) return;
    try {
      await deleteStore(storeId);
      setStores(prev => prev.filter(s => s.id !== storeId));
    } catch (err) {
      console.error("Error deleting store:", err);
      alert("Error al eliminar la tienda. Revisa la consola para más detalles.");
    }
  };

  if (loading) {
    console.log("StoresList se está renderizando", stores);
    return (
      <div className="card">
        <div className="page-title">Cargando tiendas…</div>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title">Tiendas</div>
          <div className="page-sub">Lista de tiendas registradas — administra y entra a cada una</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={() => navigate("/stores/create")}>
            Crear tienda
          </button>
        </div>
      </header>

      <section style={{ marginTop: 12 }}>
        <div className="grid">
          {stores.length === 0 && (
            <div className="card">
              <div className="muted">No hay tiendas todavía</div>
            </div>
          )}

          {stores.map(store => (
            <article key={store.id} className="card store-card">
              <div className="store-card-top">
                <div className="store-logo">{store.name?.slice(0, 2).toUpperCase()}</div>

                <div className="store-meta" style={{ flex: 1 }}>
                  <div className="store-meta-row">
                    <div>
                      <div className="store-name">{store.name}</div>
                      <div className="muted store-desc" style={{ marginTop: 6 }}>{store.description || "Sin descripción"}</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div className="muted small">{store.email || "—"}</div>
                      <div className="muted small">{store.phone || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="store-card-footer">
                <div className="muted small">Creada: {store.createdAt ? new Date(store.createdAt).toLocaleDateString() : "—"}</div>

                <div className="card-actions">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setCurrentStoreId(store.id);
                      navigate(`/stores/${store.id}/manage-products`);
                    }}
                  >
                    Gestionar productos
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      // ver versión pública en nueva pestaña
                      window.open(`${PUBLIC_STORE_URL}/stores/${store.id}`, "_blank");
                    }}
                  >
                    Ver tienda
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/stores/${store.id}/edit`)}
                  >
                    Editar
                  </button>

                  {/* Nuevo botón para eliminar tienda */}
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(store.id, store.name)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
