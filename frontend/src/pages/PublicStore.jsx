import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; // <- agregado Link
import { getStorePublic, getProductsPublic, getStoreReviews } from "../api/storesApi";
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
const [reviews, setReviews] = useState([]);
const [newReview, setNewReview] = useState("");
const [rating, setRating] = useState(5);

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

        // cargar reseñas usando el helper centralizado (ruta: /api/reviews/stores/:id)
        try {
          const reviewsData = await getStoreReviews(storeId);
          // si la API devuelve { reviews: [...] } adaptamos
          setReviews(Array.isArray(reviewsData) ? reviewsData : (reviewsData.reviews || []));
        } catch (e) {
          console.debug('No se pudieron cargar reseñas al inicio', e);
          setReviews([]);
        }

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
{/* RESEÑAS */}
<section id="reviews" className={styles.reviewsSection}>
  <h2>Reseñas</h2>

  {/* Formulario nueva reseña */}
  <div className={styles.reviewForm}>
    <h3>Escribe una reseña</h3>
  <form
  onSubmit={async (e) => {
    e.preventDefault();
    if (!newReview.trim()) return;

    try {
      const res = await fetch(`${API}/api/reviews`, {  // <-- ruta CORRECTA
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(`store:${storeId}:token`) || ""}`, // si aplica auth
        },
        body: JSON.stringify({
          storeId,      
          comment: newReview,
          rating: Number(rating),
        }),
      });

      if (!res.ok) throw new Error(`Error creando reseña: ${res.status}`);
      const data = await res.json();

      setReviews([data, ...reviews]);
      setNewReview("");
      setRating(5);
    } catch (err) {
      console.error("Error creando reseña:", err);
    }
  }}
>

      <label>Puntuación:</label>
      <select value={rating} onChange={(e) => setRating(e.target.value)}>
        <option value="5">⭐️⭐️⭐️⭐️⭐️</option>
        <option value="4">⭐️⭐️⭐️⭐️</option>
        <option value="3">⭐️⭐️⭐️</option>
        <option value="2">⭐️⭐️</option>
        <option value="1">⭐️</option>
      </select>

      <label>Comentario:</label>
      <textarea
        placeholder="Escribe tu reseña..."
        value={newReview}
        onChange={(e) => setNewReview(e.target.value)}
      />

      <button type="submit" className={styles.btnReview}>
        Enviar reseña
      </button>
    </form>
  </div>

  {/* Listado de reseñas */}
  <div className={styles.reviewsList}>
    <h3>Reseñas recientes</h3>

    {reviews.length === 0 && <p>No hay reseñas aún.</p>}

    {reviews.map((r, i) => (
      <div key={i} className={styles.reviewCard}>
        <div className={styles.reviewHeader}>
          <span className={styles.reviewRating}>
            {"⭐".repeat(r.rating)}
          </span>
          <span className={styles.reviewDate}>
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        </div>

        <p className={styles.reviewComment}>{r.comment}</p>
        <p className={styles.reviewUser}>Por: {r.userName || "Usuario"}</p>
      </div>
    ))}
  </div>
</section>

      <ChatWidget storeId={storeId} />
    </div>
  );
}
