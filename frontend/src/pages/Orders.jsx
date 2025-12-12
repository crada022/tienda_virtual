import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/accountOrders.module.css";

export default function Orders() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
      if (!token) {
        setOrders([]);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API}/api/orders`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("No se pudieron obtener los pedidos");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function continuePurchase(order) {
    // intentar determinar storeId
    const storeIds = Array.from(new Set(order.items.map(it => it.product?.storeId).filter(Boolean)));
    // fallback: usar order.storeId si fue adjuntado por el backend
    if (!storeIds.length && order.storeId) storeIds.push(order.storeId);
    if (storeIds.length === 0) {
      alert("No se pudo determinar la tienda asociada a este pedido.");
      return;
    }
    if (storeIds.length > 1) {
      alert("Este pedido contiene items de varias tiendas. Continúe manualmente desde la página del pedido.");
      return;
    }
    const storeId = storeIds[0];
    const cartKey = `store:${storeId}:cart`;
    const cart = order.items.map(it => ({
      id: it.product?.id || it.productId,
      productId: it.productId,
      name: it.product?.name || "Producto",
      price: it.price || 0,
      quantity: it.quantity || 1,
      image: it.product?.image || it.product?.imageUrl || "/placeholder.png"
    }));
    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("store-cart-updated", { detail: { storeId } }));
    navigate(`/stores/${storeId}/checkout`);
  }

  if (loading) return <div style={{ padding: 20 }}>Cargando pedidos...</div>;
  if (!orders.length) return <div style={{ padding: 20 }}>No hay pedidos</div>;

  return (
    <div style={{ maxWidth: 980, margin: "20px auto", padding: "0 18px" }}>
      <h2>Mis pedidos</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {orders.map(o => (
          <div key={o.id} className={styles.orderCard}>
            <div className={styles.orderTop}>
              <div>
                <div style={{ fontSize: 14, color: "var(--muted)" }}>#{o.id} • {new Date(o.createdAt).toLocaleString()}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{(o.total || 0).toFixed(2)} COP</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className={styles.orderBadge}>{o.status || 'PENDING'}</div>
                {o.status === 'PENDING' && (
                  <button className={styles.continueBtn} onClick={() => continuePurchase(o)}>Continuar compra</button>
                )}
              </div>
            </div>

            <div className={styles.orderItems}>
              {o.items.map((it, idx) => (
                <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img src={it.product?.image || "/placeholder.png"} alt={it.product?.name} style={{ width: 64, height: 56, objectFit: "cover", borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{it.product?.name || it.name}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{it.quantity} × {(it.price||0).toFixed(2)} COP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
