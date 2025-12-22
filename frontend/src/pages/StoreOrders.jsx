import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PublicNavBar from "../components/PublicNavBar";
import ChatWidget from "../components/ChatWidget";
import styles from "../styles/accountOrders.module.css";

export default function StoreOrders() {
  const { slug } = useParams(); // ✅ slug
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token = localStorage.getItem(`store:${slug}:token`); // ✅ token correcto

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        // ✅ pedidos del customer EN ESTA TIENDA
        const res = await fetch(
          `${API}/api/public/${slug}/orders/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (res.ok) {
          setOrders(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug, token]);

  function continuePurchase(order) {
    const cartKey = `store:${slug}:cart`;

    const cart = (order.items || []).map(it => ({
      productId: it.productId,
      name: it.product?.name || it.name || "Producto",
      price: it.price || 0,
      quantity: it.quantity || 1,
      image: it.product?.image || it.image || "/placeholder.png"
    }));

    localStorage.setItem(cartKey, JSON.stringify(cart));

    window.dispatchEvent(
      new CustomEvent("store-cart-updated", {
        detail: { slug }
      })
    );

    // ✅ checkout por slug
    navigate(`/store/${slug}/checkout`);
  }

  if (!token) {
    return <div style={{ padding: 20 }}>Inicia sesión para ver tus pedidos.</div>;
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando pedidos...</div>;
  }

  return (
    <>
      <PublicNavBar slug={slug} />

      <div style={{ maxWidth: 980, margin: "20px auto", padding: "0 18px" }}>
        <h2>Pedidos</h2>

        <div className={styles["orders-list"]}>
          {orders.length === 0 && <div>No hay pedidos</div>}

          {orders.map(o => (
            <div key={o.id} className={styles["order-card"]}>
              <div className={styles["order-top"]}>
                <div>
                  <div style={{ fontSize: 14, color: "var(--muted)" }}>
                    #{o.id} • {new Date(o.createdAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {(o.total || 0).toFixed(2)} COP
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div className={styles["order-badge"]}>
                    {o.status || "PENDING"}
                  </div>

                  {o.status === "PENDING" && (
                    <button
                      className={styles["continue-btn"]}
                      onClick={() => continuePurchase(o)}
                    >
                      Continuar compra
                    </button>
                  )}
                </div>
              </div>

              <div className={styles["order-items"]}>
                {o.items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <img
                      src={it.product?.image || "/placeholder.png"}
                      alt={it.product?.name}
                      style={{
                        width: 64,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 8
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>
                        {it.product?.name || it.name}
                      </div>
                      <div
                        style={{ fontSize: 13, color: "var(--muted)" }}
                      >
                        {it.quantity} × {(it.price || 0).toFixed(2)} COP
                      </div>
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
