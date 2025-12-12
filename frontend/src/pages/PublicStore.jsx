import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; // <- agregado Link
import { getStorePublic, getProductsPublic } from "../api/storesApi";
import PublicNavBar from "../components/PublicNavBar";
import ChatWidget from "../components/ChatWidget";
import styles from "../styles/publicStore.module.css";
import { StoreLogin, StoreRegister } from "./StoreAuth";
import { applyDiscount } from "../utils/discounts.js";

export default function PublicStore() {
  const { storeId } = useParams();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Auth modal state (token gestionada por PublicNavBar / localStorage)
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  // escuchar evento para abrir el modal de auth (disparado por PublicNavBar u otros)
  useEffect(() => {
    function onOpenAuth(e) {
      const detail = e?.detail || {};
      // si el evento especifica storeId distinto, ignorar
      if (detail.storeId && detail.storeId !== storeId) return;
      setAuthMode(detail.mode || "login");
      setAuthOpen(true);
    }
    window.addEventListener("open-store-auth", onOpenAuth);
    return () => window.removeEventListener("open-store-auth", onOpenAuth);
  }, [storeId]);

  useEffect(() => {
    async function loadData() {
      try {
        const storeData = await getStorePublic(storeId);
        const productsData = await getProductsPublic(storeId);
        setStore(storeData);
        setProducts(productsData);

        // Si la tienda trae style (CSS), lo inyectamos en un <style id="store-style">
        // Pero scopeamos los selectores para que sólo afecte a la vista pública (.public-store)
        if (storeData?.style) {
          const scopeCss = (css, scope) => {
            // Simple scoping: prefija cada selector fuera de @-rules con el scope
            try {
              return css.split('}').map(block => {
                const parts = block.split('{');
                if (parts.length < 2) return '';
                const selectors = parts[0].trim();
                const body = parts.slice(1).join('{');
                // dejar intacto bloques @media, @keyframes, @font-face, etc.
                if (selectors.startsWith('@')) {
                  return selectors + '{' + body + '}';
                }
                const scoped = selectors.split(',').map(s => {
                  s = s.trim();
                  // si el selector ya contiene el scope, no lo dupliques
                  if (s.startsWith(scope)) return s;
                  // evitar prefijar html/body raíz si el scope es body-like: aún así prefijamos
                  return `${scope} ${s}`;
                }).join(', ');
                return scoped + '{' + body + '}';
              }).join('\n');
            } catch (e) {
              console.warn('Error scoping CSS, injecting raw', e);
              return css;
            }
          };

          const scopedStyle = scopeCss(storeData.style, '.public-store');
          let tag = document.getElementById('store-style');
          if (!tag) {
            tag = document.createElement('style');
            tag.id = 'store-style';
            document.head.appendChild(tag);
          }
          tag.innerHTML = scopedStyle;
        }
        // comprobar si hay token global (propietario) y si el token tiene permiso sobre la tienda
        const globalToken = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
        if (globalToken) {
          try {
            const r = await fetch(`${API}/api/stores/${storeId}`, { headers: { Authorization: `Bearer ${globalToken}` } });
            if (r.ok) setIsOwner(true);
          } catch (e) {
            console.debug("No owner token or error verifying owner", e);
          }
        }
      } catch (err) {
        console.error("Error cargando tienda pública:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // cleanup: remover style si existía al desmontar
    return () => {
      const tag = document.getElementById("store-style");
      if (tag) tag.remove();
    };
  }, [storeId]);

  function handleAuthSuccess(data) {
    // guardar token en localStorage para esta tienda y notificar al navbar
    if (data?.token) localStorage.setItem(`store:${storeId}:token`, data.token);
    window.dispatchEvent(new CustomEvent("store-auth-changed", { detail: { storeId } }));
    setAuthOpen(false);
  }

  if (loading) return <div className={styles.loader}></div>;
  if (!store) return <div className={styles.error}>Tienda no encontrada</div>;

  return (
    <div className={styles.publicStore}>
      <PublicNavBar storeId={storeId} storeName={store?.name} />

      {/* HERO */}
      <header className={styles.storeHero} style={{ backgroundImage: store?.bannerUrl ? `url(${store.bannerUrl})` : undefined }}>
        <div className={styles.overlay}></div>
        <div className={styles.heroContent}>
          <h1>{store.name}</h1>
          <p>{store.description || "Bienvenido a nuestra tienda"}</p>
          <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="#products" className={styles.btnAdd}>Comprar ahora</a>
            <a href="#products" className={styles.btnOutline}>Ver productos</a>
           
          </div>
        </div>
      </header>

      {/* Auth modal */}
      {authOpen && (
        <div className={styles.authModalOverlay} onClick={() => setAuthOpen(false)}>
          <div className={styles.authModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setAuthOpen(false)}>×</button>
            {authMode === "login" ? (
              <StoreLogin storeId={storeId} onAuth={handleAuthSuccess} />
            ) : (
              <StoreRegister storeId={storeId} onAuth={handleAuthSuccess} />
            )}
          </div>
        </div>
      )}

      <section id="products" className={styles.productsSection}>
        <h2>Productos</h2>

        {products.length === 0 ? (
          <p className={styles.noProducts}>No hay productos disponibles por ahora.</p>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((p) => {
              const { discountedPrice } = applyDiscount(p.price, p.discount || (p.productsOnDiscount?.[0]?.discount));
              return (
                <div key={p.id} className={styles.productCard}>
                  {p.category?.name && <div className={styles.badgeCat}>{p.category.name}</div>}
                  <div className={styles.mediaWrap}>
                    <img src={p.image || "/placeholder.png"} alt={p.name} className={styles.productImg} />
                    <div className={styles.priceBubble}>${(discountedPrice ?? p.price).toLocaleString()}</div>
                  </div>
                  <div className={styles.cardBody}>
                    <h3>{p.name}</h3>
                    <p className={styles.desc}>{p.description}</p>
                    <div className={styles.cardActions}>
                      <Link to={`/stores/${storeId}/products/${p.id}`} className={styles.btnOutline}>Ver</Link>
                      <button className={styles.btnAdd} onClick={() => addToCart(p)}>Agregar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ChatWidget storeId={storeId} />
    </div>
  );
}
