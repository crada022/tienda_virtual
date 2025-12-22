import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/accountOrders.module.css";

export default function StoreAccount() {
  const { slug } = useParams();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token = localStorage.getItem(`store:${slug}:token`);
console.log("🟢 StoreAccount");
console.log("slug:", slug);
console.log("token:", token);
console.log("localStorage keys:", Object.keys(localStorage));
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    async function load() {
      setLoading(true);

      try {
        // 👤 Cliente logueado
        const me = await fetch(
          `${API}/api/public/${slug}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (me.status === 401) {
          localStorage.removeItem(`store:${slug}:token`);
          navigate(`/store/${slug}`);
          return;
        }

        if (me.ok) {
          const data = await me.json();
          setCustomer(data.customer);
        }

        // 📦 Pedidos del cliente
        const or = await fetch(
          `${API}/api/public/${slug}/orders/my`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (or.status === 401) {
          localStorage.removeItem(`store:${slug}:token`);
          navigate(`/store/${slug}`);
          return;
        }

        if (or.ok) {
          setOrders(await or.json());
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug, token, navigate]);

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        Inicia sesión o regístrate para ver tu cuenta.
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando cuenta...</div>;
  }

  return (
    <div style={{ maxWidth: 980, margin: "20px auto", padding: "0 18px" }}>
      <h2>Mi cuenta</h2>

      <div style={{ background: "var(--card-bg)", padding: 12, borderRadius: 10 }}>
        <div>
          <strong>{customer?.name || customer?.email}</strong>
        </div>
        <div style={{ color: "var(--muted)", marginTop: 6 }}>
          Cliente registrado
        </div>
      </div>

      <h3 style={{ marginTop: 18 }}>Mis pedidos</h3>

      {orders.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {orders.map(o => (
            <div
              key={o.id}
              style={{
                padding: 12,
                borderRadius: 8,
                background: "var(--card-bg)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>#{o.id}</strong> —{" "}
                  {new Date(o.createdAt).toLocaleString()}
                </div>

                {o.status === "PENDING" && (
                  <button
                    className="btn-add"
                    onClick={() => {
                      const cartKey = `store:${slug}:cart`;

                      const cart = (o.items || []).map(it => ({
                        productId: it.productId,
                        name: it.name,
                        price: it.price,
                        quantity: it.quantity,
                        image: it.image || "/placeholder.png"
                      }));

                      localStorage.setItem(cartKey, JSON.stringify(cart));
                      window.dispatchEvent(
                        new CustomEvent("store-cart-updated", {
                          detail: { slug }
                        })
                      );

                      // ✅ RUTA CORRECTA
                      navigate(`/store/${slug}/checkout`);
                    }}
                  >
                    Continuar compra
                  </button>
                )}
              </div>

              <div style={{ color: "var(--muted)", marginTop: 6 }}>
                Items: {o.items?.length ?? 0} — Total:{" "}
                {(o.total || 0).toFixed(2)} COP
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noProducts}>No hay pedidos</div>
      )}
    </div>
  );
}
