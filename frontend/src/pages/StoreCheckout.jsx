import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PublicNavBar from "../components/PublicNavBar";
import styles from "../styles/checkout.module.css";
import { getStorePublic } from "../api/storesApi";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function StoreCheckout() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const cartKey = `store:${slug}:cart`;
  const token = localStorage.getItem(`store:${slug}:token`);

  const [store, setStore] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState({
    name: "",
    email: "",
    address: ""
  });

  /* =========================
     LOAD STORE
  ========================= */
  useEffect(() => {
    async function loadStore() {
      try {
        const s = await getStorePublic(slug);
        setStore(s);
      } catch (err) {
        console.error("Error cargando tienda", err);
      }
    }
    loadStore();
  }, [slug]);

  /* =========================
     LOAD CART
  ========================= */
  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem(cartKey) || "[]"));
  }, [slug]);

  /* =========================
     LOAD CUSTOMER (ME)
  ========================= */
  useEffect(() => {
    if (!token) return;

    async function loadCustomer() {
      try {
        const res = await fetch(
          `${API}/api/public/${slug}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (res.ok) {
          const data = await res.json();
          setBilling(b => ({
            ...b,
            name: data.customer?.name || "",
            email: data.customer?.email || ""
          }));
        }
      } catch (err) {
        console.error("Error cargando cliente", err);
      }
    }

    loadCustomer();
  }, [slug, token]);

  /* =========================
     CREATE ORDER + STRIPE
  ========================= */
  async function submitOrder() {
    if (!token) {
      alert("Debes iniciar sesión para continuar");
      return;
    }

    if (!cart.length) {
      alert("Tu carrito está vacío");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Crear orden
      const orderRes = await fetch(`${API}/api/public/${slug}/orders/create-from-items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            items: cart.map(p => ({
              productId: p.id,
              quantity: Number(p.quantity || 1),
              price: Number(p.price || 0)
            })),
            billing
          })
        }
      );

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.error || "Error creando la orden");
      }

      const order = await orderRes.json();

      // 2️⃣ Stripe session
      const stripeRes = await fetch(
        `${API}/api/payments/stripe/create-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId: order.id
          })
        }
      );

      if (!stripeRes.ok) {
        const err = await stripeRes.json().catch(() => ({}));
        throw new Error(err.error || "Error creando sesión de pago");
      }

      const { url } = await stripeRes.json();

      localStorage.removeItem(cartKey);

      if (url) {
        window.location.href = url;
      } else {
        navigate(`/${slug}/orders`);
      }

    } catch (err) {
      alert(err.message || "Error procesando la orden");
    } finally {
      setLoading(false);
    }
  }

  const total = cart.reduce(
    (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
    0
  );

  if (!store) return <div className={styles.loader}>Cargando tienda…</div>;

  return (
    <>
      <PublicNavBar slug={slug} storeName={store.name} />

      <div className={styles["checkout-wrap"]}>
        <div className={styles["checkout-main"]}>
          <h2>Finalizar compra</h2>

          {!cart.length ? (
            <p>Tu carrito está vacío</p>
          ) : (
            <>
              <div className={styles["cart-list"]}>
                {cart.map((it, i) => (
                  <div key={i} className={styles["cart-item"]}>
                    <img src={it.image || "/placeholder.png"} alt={it.name} />
                    <div>
                      <strong>{it.name}</strong>
                      <div>
                        {(it.price || 0).toFixed(2)} × {it.quantity}
                      </div>
                    </div>
                    <div>
                      {((it.price || 0) * it.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles["billing-box"]}>
                <h3>Datos de facturación</h3>

                <input
                  placeholder="Nombre"
                  value={billing.name}
                  onChange={e =>
                    setBilling({ ...billing, name: e.target.value })
                  }
                />

                <input
                  placeholder="Email"
                  value={billing.email}
                  onChange={e =>
                    setBilling({ ...billing, email: e.target.value })
                  }
                />

                <input
                  placeholder="Dirección"
                  value={billing.address}
                  onChange={e =>
                    setBilling({ ...billing, address: e.target.value })
                  }
                />
              </div>

              <div className={styles["checkout-footer"]}>
                <strong>Total: {total.toFixed(2)} COP</strong>
                <button
                  className={styles["btn-add"]}
                  onClick={submitOrder}
                  disabled={loading}
                >
                  {loading ? "Procesando..." : "Pagar y finalizar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
