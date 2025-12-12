import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PublicNavBar from "../components/PublicNavBar";
import styles from "../styles/checkout.module.css";

export default function StoreCheckout() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const key = `store:${storeId}:cart`;
  const token = localStorage.getItem(`store:${storeId}:token`) || localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState({ name: "", email: "", address: "" });

  useEffect(()=> setCart(JSON.parse(localStorage.getItem(key) || "[]")), [storeId]);

  // intentar prellenar datos del cliente tenant
  useEffect(() => {
    async function loadCustomer() {
      if (!token) return;
      try {
        const res = await fetch(`${API}/api/stores/${storeId}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const j = await res.json();
          setBilling(b => ({ ...b, name: j.customer?.name || "", email: j.customer?.email || "" }));
        }
      } catch (e) {}
    }
    loadCustomer();
  }, [storeId, token]);

  async function submitOrder() {
    if (!token) return alert("Necesitas iniciar sesión en esta tienda para comprar.");
    if (!cart.length) return alert("Carrito vacío");
    setLoading(true);
    try {
      // Crear la orden enviando los items con el precio actual desde el frontend
      const payloadItems = cart.map(it => ({ productId: it.productId || it.id || it._id, quantity: it.quantity || 1, price: it.price || 0 }));
      const orderRes = await fetch(`${API}/api/orders/create-from-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: payloadItems })
      });
      if (!orderRes.ok) {
        const errBody = await orderRes.json().catch(() => ({}));
        throw new Error(errBody.message || "Error creando orden");
      }
      const order = await orderRes.json();

      // 3) solicitar sesión de Stripe para la orden y redirigir
      try {
        const sessRes = await fetch(`${API}/api/payments/stripe/create-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId: order.id })
        });
        if (!sessRes.ok) {
          const b = await sessRes.json().catch(()=>null);
          console.error("create-session failed", b);
          throw new Error(b?.error || "Error creando sesión de pago");
        }
        const data = await sessRes.json();
        if (data.url) {
          // limpiar carrito local antes de redirigir
          localStorage.removeItem(key);
          window.location.href = data.url;
          return;
        }
      } catch (e) {
        console.error("Stripe session creation error", e);
      }

      // si no se redirige a Stripe, ir a cuenta
      localStorage.removeItem(key);
      navigate(`/stores/${storeId}/orders`);
    } catch (err) {
      alert(err.message || "Error procesando orden");
    } finally { setLoading(false); }
  }

  const total = cart.reduce((s,i)=>s + (i.price||0) * (i.quantity||1), 0);

  return (
    <>
      <PublicNavBar storeId={storeId} />
      <div className={styles['checkout-wrap']}>
        <div className={styles['checkout-main']}>
          <h2>Finalizar compra</h2>
          {!cart.length ? (
            <div className={styles['no-products'] || ''}>Tu carrito está vacío</div>
          ) : (
            <>
              <div className={styles['cart-list']}>
                {cart.map((it, idx) => (
                  <div key={idx} className={styles['cart-item']}>
                    <img src={it.image || "/placeholder.png"} alt={it.name} />
                    <div className="ci-body">
                      <div className="ci-name">{it.name}</div>
                      <div className="ci-meta">{(it.price||0).toFixed(2)} × {it.quantity}</div>
                    </div>
                    <div className={styles['ci-sub']}>{((it.price||0) * (it.quantity||1)).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className={styles['billing-box']}>
                <h3>Datos de facturación</h3>
                <label>Nombre</label>
                <input value={billing.name} onChange={e => setBilling({ ...billing, name: e.target.value })} />
                <label>Email</label>
                <input value={billing.email} onChange={e => setBilling({ ...billing, email: e.target.value })} />
                <label>Dirección</label>
                <input value={billing.address} onChange={e => setBilling({ ...billing, address: e.target.value })} />
              </div>

              <div className={styles['checkout-footer']}>
                <div className={styles['total'] || 'total'}>Total: <strong className={styles['price'] || 'price'}>{total.toFixed(2)} USD</strong></div>
                <div className={styles['actions']}>
                  <button className={styles['btn-outline'] || 'btn-outline'} onClick={() => { localStorage.removeItem(key); setCart([]); }}>Vaciar</button>
                  <button className={styles['btn-add'] || 'btn-add'} onClick={submitOrder} disabled={loading}>{loading ? "Procesando..." : "Pagar y finalizar"}</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}