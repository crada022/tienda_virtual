import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PublicNavBar from "../components/PublicNavBar";
import ChatWidget from "../components/ChatWidget";
import styles from "../styles/accountOrders.module.css";

export default function StoreOrders() {
  const { storeId } = useParams();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token = localStorage.getItem(`store:${storeId}:token`);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return setLoading(false);
    async function load() {
      try {
        // intentar obtener orders globales con token tenant (si backend permite)
        const res = await fetch(`${API}/api/orders`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setOrders(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [storeId, token]);

  function continuePurchase(order) {
    const storeIds = Array.from(new Set((order.items || []).map(it => it.product?.storeId).filter(Boolean)));
    // fallback: order.storeId (adjuntado por backend) o el storeId de la ruta
    if (!storeIds.length && order.storeId) storeIds.push(order.storeId);
    if (!storeIds.length && storeId) storeIds.push(storeId);
    if (storeIds.length === 0) return alert("No se pudo determinar la tienda asociada a este pedido.");
    if (storeIds.length > 1) return alert("Este pedido contiene items de varias tiendas.");
    const sid = storeIds[0];
    const cartKey = `store:${sid}:cart`;
    const cart = order.items.map(it => ({
      id: it.product?.id || it.productId,
      productId: it.productId,
      name: it.product?.name || it.name || 'Producto',
      price: it.price || 0,
      quantity: it.quantity || 1,
      image: it.product?.image || it.image || '/placeholder.png'
    }));
    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('store-cart-updated', { detail: { storeId: sid } }));
    navigate(`/stores/${sid}/checkout`);
  }

  if (!token) return <div style={{ padding:20 }}>Inicia sesión para ver tus pedidos.</div>;
  if (loading) return <div style={{ padding:20 }}>Cargando pedidos...</div>;

  return (
    <>
      <PublicNavBar storeId={storeId} />
      <div style={{ maxWidth: 980, margin: "20px auto", padding: "0 18px" }}>
        <h2>Pedidos</h2>
      <div className={styles['orders-list']}>
        {orders.length === 0 && <div>No hay pedidos</div>}
        {orders.map(o => (
          <div key={o.id} className={styles['order-card']}>
            <div className={styles['order-top']}>
              <div>
                <div style={{ fontSize: 14, color: "var(--muted)" }}>#{o.id} • {new Date(o.createdAt).toLocaleString()}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{(o.total || 0).toFixed(2)} COP</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className={styles['order-badge']}>{o.status || 'PENDING'}</div>
                {o.status === 'PENDING' && <button className={styles['continue-btn']} onClick={() => continuePurchase(o)}>Continuar compra</button>}
              </div>
            </div>

            <div className={styles['order-items']}>
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
    </>
  );
}
