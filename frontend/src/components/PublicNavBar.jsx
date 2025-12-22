import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/publicNavBar.module.css";

export default function PublicNavBar({ slug, storeName }) {
  const [customer, setCustomer] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const tokenKey = `store:${slug}:token`;

  // 🔐 cargar cliente
  const loadCustomer = useCallback(async () => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setCustomer(null);
      return;
    }

    try {
      const res = await fetch(`${API}/api/public/${slug}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer || null);
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    }
  }, [slug]);

  // 🛒 carrito
  const updateCartCount = useCallback(() => {
    const cart = JSON.parse(
      localStorage.getItem(`store:${slug}:cart`) || "[]"
    );
    setCartCount(cart.reduce((s, p) => s + (p.quantity || 1), 0));
  }, [slug]);

  useEffect(() => {
    loadCustomer();
    updateCartCount();

    window.addEventListener("store-auth-changed", loadCustomer);
    window.addEventListener("store-cart-updated", updateCartCount);

    return () => {
      window.removeEventListener("store-auth-changed", loadCustomer);
      window.removeEventListener("store-cart-updated", updateCartCount);
    };
  }, [loadCustomer, updateCartCount]);

  // 🔓 abrir modal auth
  function openAuth(mode) {
    window.dispatchEvent(
      new CustomEvent("open-store-auth", {
        detail: { slug, mode }
      })
    );
  }

  // ✅ RUTA BASE CORRECTA
  const basePath = `/store/${slug}`;

  return (
    <header className={styles.publicNav}>
      <div className={styles.publicNavInner}>
        {/* LOGO */}
        <Link to={basePath} className={styles.brandWrap}>
          <span className={styles.logo}>
            {(storeName || "T")[0].toUpperCase()}
          </span>
          <span className={styles.name}>{storeName}</span>
        </Link>

        {/* NAV */}
        <nav className={styles.centerNav}>
          <Link to={`${basePath}/products`} className={styles.navItem}>
            Productos
          </Link>
          <Link to={`${basePath}/reviews`} className={styles.navItem}>
            Reseñas
          </Link>
        </nav>

        {/* RIGHT */}
        <div className={styles.rightArea}>
          <Link to={`${basePath}/cart`} className={styles.navCart}>
            🛒
            {cartCount > 0 && (
              <span className={styles.badge}>{cartCount}</span>
            )}
          </Link>

          {customer ? (
            <>
              <Link to={`${basePath}/orders`} className={styles.navItem}>
                Pedidos
              </Link>
              <Link
                to={`${basePath}/account`}
                className={styles.customerLink}
              >
                {customer.name || customer.email}
              </Link>
            </>
          ) : (
            <div className={styles.guestActions}>
              <button
                onClick={() => openAuth("login")}
                className={styles.btnOutline}
              >
                Ingresar
              </button>
              <button
                onClick={() => openAuth("register")}
                className={styles.btnPrimary}
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
