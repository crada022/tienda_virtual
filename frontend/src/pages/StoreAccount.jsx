import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/accountOrders.module.css";

export default function StoreAccount() {
  const { storeId } = useParams();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token = localStorage.getItem(`store:${storeId}:token`);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const me = await fetch(`${API}/api/stores/${storeId}/auth/me`, { headers: { Authorization: `Bearer ${token}` }});
        if (me.ok) setCustomer((await me.json()).customer);
        // listar pedidos del usuario (endpoint global)
        const or = await fetch(`${API}/api/orders`, { headers: { Authorization: `Bearer ${token}` }});
        if (or.ok) setOrders(await or.json());
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [storeId, token]);

  if (!token) return <div style={{ padding:20 }}>Inicia sesión o regístrate para ver tu cuenta.</div>;

  return (
    <div style={{ maxWidth: 980, margin: "20px auto", padding: "0 18px" }}>
      <h2>Mi cuenta</h2>
      <div style={{ background:"var(--card-bg)", padding:12, borderRadius:10 }}>
        <div><strong>{customer?.name || customer?.email}</strong></div>
        <div style={{ color:"var(--muted)", marginTop:6 }}>Cliente registrado</div>
      </div>

      <h3 style={{ marginTop:18 }}>Mis pedidos</h3>
      {orders.length ? (
        <div style={{ display:"grid", gap:10 }}>
              {orders.map(o => (
                <div key={o.id} style={{ padding:12, borderRadius:8, background:"var(--card-bg)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div><strong>#{o.id}</strong> — {new Date(o.createdAt).toLocaleString()}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ fontSize:12, color:"var(--muted)" }}>{o.status || 'PENDING'}</div>
                      {o.status === 'PENDING' && (
                        <button className="btn-add" onClick={() => {
                          // reconstruir carrito y redirigir al checkout público
                          const storeIds = Array.from(new Set((o.items || []).map(it => it.product?.storeId).filter(Boolean)));
                          if (!storeIds.length && o.storeId) storeIds.push(o.storeId);
                          if (!storeIds.length) {
                            alert('No se pudo determinar la tienda asociada a este pedido.');
                            return;
                          }
                          if (storeIds.length > 1) {
                            alert('Este pedido tiene items de varias tiendas. Continúe desde la vista de pedido.');
                            return;
                          }
                          const storeIdForCart = storeIds[0];
                          const cartKey = `store:${storeIdForCart}:cart`;
                          const cart = (o.items || []).map(it => ({
                            id: it.product?.id || it.productId,
                            productId: it.productId,
                            name: it.product?.name || it.name || 'Producto',
                            price: it.price || 0,
                            quantity: it.quantity || 1,
                            image: it.product?.image || it.image || '/placeholder.png'
                          }));
                          localStorage.setItem(cartKey, JSON.stringify(cart));
                          window.dispatchEvent(new CustomEvent('store-cart-updated', { detail: { storeId: storeIdForCart } }));
                          navigate(`/stores/${storeIdForCart}/checkout`);
                        }}>Continuar compra</button>
                      )}
                    </div>
                  </div>
                  <div style={{ color:"var(--muted)", marginTop:6 }}>Items: {o.items?.length ?? 0} — Total: {(o.total||0).toFixed(2)} USD</div>
                  {o.items && o.items.length > 0 && (
                    <div style={{ marginTop:8 }}>
                      {o.items.map((it, idx) => (
                        <div key={idx} style={{ display:"flex", gap:8, alignItems:"center", padding:6, borderRadius:6, background:"rgba(0,0,0,0.02)", marginTop:6 }}>
                          <img src={it.image || "/placeholder.png"} alt={it.name} style={{ width:48, height:48, objectFit:"cover", borderRadius:6 }} />
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600 }}>{it.name}</div>
                            <div style={{ fontSize:13, color:"var(--muted)" }}>{it.quantity} × {(it.price||0).toFixed(2)} USD</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
          ))}
        </div>
      ) : <div className={styles.noProducts}>No hay pedidos</div>}
    </div>
  );
}