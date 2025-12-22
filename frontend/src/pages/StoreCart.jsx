import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PublicNavBar from "../components/PublicNavBar";
import styles from "../styles/cart.module.css";
import { getStorePublic } from "../api/storesApi";

export default function Cart() {
  const { slug } = useParams(); // ✅ SLUG
  const navigate = useNavigate();

  const cartKey = `store:${slug}:cart`;
  const tokenKey = `store:${slug}:token`;

  const [cart, setCart] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* =========================
     LOAD CART + STORE
  ========================= */
  useEffect(() => {
    let mounted = true;

    // cargar carrito
    setCart(JSON.parse(localStorage.getItem(cartKey) || "[]"));

    const onCartUpdate = () =>
      setCart(JSON.parse(localStorage.getItem(cartKey) || "[]"));

    window.addEventListener("store-cart-updated", onCartUpdate);

    // cargar tienda por slug
    (async () => {
      try {
        const s = await getStorePublic(slug);
        if (!mounted) return;
        setStore(s);
      } catch (err) {
        console.error("Error cargando tienda:", err);
        setError("No se pudo cargar la tienda");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      window.removeEventListener("store-cart-updated", onCartUpdate);
    };
  }, [slug]);

  /* =========================
     CART ACTIONS
  ========================= */
  const save = (next) => {
    setCart(next);
    localStorage.setItem(cartKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("store-cart-updated"));
  };

  const updateQty = (id, qty) =>
    save(
      cart.map(i =>
        i.id === id
          ? { ...i, quantity: Math.max(1, Number(qty) || 1) }
          : i
      )
    );

  const removeItem = (id) => save(cart.filter(i => i.id !== id));
  const emptyCart = () => save([]);

  const checkout = () => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("open-store-auth", {
          detail: { slug, mode: "login" }
        })
      );
      return;
    }
    navigate(`/store/${slug}/checkout`);
  };

  /* =========================
     TOTALS
  ========================= */
  const subtotal = cart.reduce(
    (acc, i) => acc + (i.price ?? 0) * (i.quantity ?? 1),
    0
  );

  const itemCount = cart.reduce(
    (acc, i) => acc + (i.quantity ?? 1),
    0
  );

  if (loading) return <div className={styles.loader}>Cargando tienda…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div>
      {/* ✅ NAVBAR CORRECTO */}
      <PublicNavBar slug={slug} storeName={store?.name || "Tienda"} />

      <div className={styles.cartContainer}>
        <h1>Tu Carrito</h1>

        {cart.length === 0 && (
          <div className={styles.emptyCart}>
            <h2>🛒 Tu carrito está vacío</h2>
          </div>
        )}

        {cart.length > 0 && (
          <>
            {cart.map(item => (
              <div key={item.id} className={styles.itemCard}>
                <img
                  src={item.image || "/placeholder.png"}
                  alt={item.name}
                />
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.price} COP</p>

                  <div>
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  </div>

                  <button onClick={() => removeItem(item.id)}>Quitar</button>
                </div>
              </div>
            ))}

            <div className={styles.summary}>
              <p>Total: <strong>{subtotal.toLocaleString()} COP</strong></p>
              <button onClick={checkout}>Proceder al Pago</button>
              <button onClick={emptyCart}>Vaciar carrito</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
