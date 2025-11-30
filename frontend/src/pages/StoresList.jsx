import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStores } from "../api/services/storeService";
import { useStoreContext } from "../store/useStoreContext";
import "../App.css";
import { PUBLIC_STORE_URL } from "../config";
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
            <article key={store.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 76,
                  height: 76,
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#09202b,#112b3a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9fb3c7",
                  fontWeight: 700
                }}>
                  {store.name?.slice(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{store.name}</div>
                      <div className="muted" style={{ marginTop: 6 }}>
                        {store.description || "Sin descripción"}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div className="muted" style={{ fontSize: 13 }}>{store.email || "—"}</div>
                      <div className="muted" style={{ fontSize: 13 }}>{store.phone || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div className="muted">
                  Creada: {store.createdAt ? new Date(store.createdAt).toLocaleDateString() : "—"}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setCurrentStoreId(store.id);          // 🔥 Establece tienda activa
                      navigate(`/stores/${store.id}/manage-products`);
                    }}
                  >
                    Gestionar productos
                  </button>
                  <button
  className="btn btn-primary"
  onClick={() => navigate("/stores/ai/generate")}
>
  Crear tienda con IA
</button>


  <button
  className="btn btn-primary"
  onClick={() => window.open(`${PUBLIC_STORE_URL}/stores/${store.id}`, "_blank")}
>
  Ver tienda
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
