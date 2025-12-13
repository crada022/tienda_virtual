import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/publicNavBar.module.css";

export default function PublicNavBar({ storeId, storeName }) {
  const [customer, setCustomer] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [token, setToken] = useState(() => (storeId ? localStorage.getItem(`store:${storeId}:token`) : null) || null);

  const loadCustomer = useCallback(async (tkn) => {
    if (!storeId || !tkn) return setCustomer(null);
    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const res = await fetch(`${API}/api/stores/${storeId}/auth/me`, {
        headers: { Authorization: `Bearer ${tkn}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCustomer(json.customer ?? null);
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    }
  }, [storeId]);

  const updateCartCount = useCallback(() => {
    if (!storeId) return setCartCount(0);
    const key = `store:${storeId}:cart`;
    const cart = JSON.parse(localStorage.getItem(key) || "[]");
    setCartCount(cart.reduce((s, p) => s + (p.quantity || 1), 0));
  }, [storeId]);

  useEffect(() => {
    setToken(storeId ? (localStorage.getItem(`store:${storeId}:token`) || null) : null);
    loadCustomer(storeId ? localStorage.getItem(`store:${storeId}:token`) : null);
    updateCartCount();

    const onAuthChanged = () => {
      const t = localStorage.getItem(`store:${storeId}:token`) || null;
      setToken(t);
      loadCustomer(t);
    };
    const onCartUpdated = () => updateCartCount();

    window.addEventListener("store-auth-changed", onAuthChanged);
    window.addEventListener("store-cart-updated", onCartUpdated);

    return () => {
      window.removeEventListener("store-auth-changed", onAuthChanged);
      window.removeEventListener("store-cart-updated", onCartUpdated);
    };
  }, [storeId, loadCustomer, updateCartCount]);

  function openAuth(mode = "login") {
    window.dispatchEvent(new CustomEvent("open-store-auth", { detail: { storeId, mode } }));
  }

  const basePath = storeId ? `/stores/${storeId}` : '#';

  return (
    <header className={styles.publicNav} role="banner">
      <div className={styles.publicNavInner}>
        <Link to={basePath} className={styles.brandWrap} aria-label={`Ir a ${storeName || "la tienda"}`}>
          <span className={styles.logo} aria-hidden>{(storeName || "Tienda").slice(0, 1).toUpperCase()}</span>
          <span className={styles.name}>{storeName || "Tienda"}</span>
        </Link>

        <nav className={styles.centerNav} role="navigation" aria-label="Navegación tienda">
          <Link to={`${basePath}/products`} className={styles.navItem}>Productos</Link>
          <Link to={`${basePath}/reviews`} className={styles.navItem}>Ver reseñas</Link>
        </nav>

        <div className={styles.rightArea} role="group" aria-label="Acciones usuario">
          <Link to={`${basePath}/cart`} className={styles.navCart} aria-label="Ver carrito">
            <span className={styles.icon} aria-hidden>🛒</span>
            {cartCount > 0 && <span className={styles.badge} aria-hidden>{cartCount}</span>}
          </Link>

          {customer && (
              <Link to={`${basePath}/orders`} className={styles.navOrders} style={{ marginLeft: 8 }}>Pedidos</Link>
          )}

          {customer ? (
            <div className={styles.customerInfo} aria-live="polite">
              <Link to={`${basePath}/account`} title="Mi cuenta" className={styles.customerLink}>
                {customer.name || customer.email}
              </Link>
            </div>
          ) : (
            <div className={styles.guestActions}>
              <button onClick={() => openAuth("login")} className={styles.btnOutline}>Ingresar</button>
              <button onClick={() => openAuth("register")} className={styles.btnPrimary} style={{ marginLeft: 8 }}>Registrarse</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
