import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getStorePublic,
  getProductsPublic,
  getStoreReviews
} from "../api/storesApi";
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
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const storeRef = useRef(null);
  /* =========================
     CARGA DE DATOS
  ========================= */
  console.log("🟢 PublicStore render");
useEffect(() => {
  console.log("🟢 useEffect LOAD DATA ejecutado");

  async function loadData() {
    console.log("🟡 loadData() empezó");

    try {
      const storeData = await getStorePublic(storeId);
      console.log("🟦 storeData recibido:", storeData);

      const productsData = await getProductsPublic(storeId);
      console.log("🟪 productsData recibido:", productsData);

     const normalizedStore = {
  ...storeData,
  colorTheme: Array.isArray(storeData.colorTheme)
    ? storeData.colorTheme
    : typeof storeData.colorTheme === "string"
      ? JSON.parse(storeData.colorTheme)
      : []
};

setStore(normalizedStore);
      setProducts(productsData);

    } catch (err) {
      console.error("🔴 ERROR EN LOAD DATA:", err);
    } finally {
      setLoading(false);
      console.log("⚪ loadData finalizó");
    }
  }

  loadData();
}, [storeId]);


  /* =========================
     COLORES DINÁMICOS
  ========================= */
 useEffect(() => {
  if (!store?.colorTheme?.length) return;
  if (!storeRef.current) return;

  const [primary, secondary] = store.colorTheme;

  storeRef.current.style.setProperty("--store-primary", primary);
  storeRef.current.style.setProperty("--store-accent", secondary);
  console.log(
    "PRIMARY =>",
    getComputedStyle(storeRef.current)
      .getPropertyValue("--store-primary")
  );
}, [store]);


  /* =========================
     CSS CUSTOM (SCOPED)
  ========================= */
  useEffect(() => {
    if (!store?.style) return;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
    const scopedCss = store.style
      .split("}")
      .map(block => {
        const [selectors, body] = block.split("{");
        if (!body || selectors.startsWith("@")) return block;
        return selectors
          .split(",")
          .map(s => `.public-store ${s.trim()}`)
          .join(", ") + `{${body}}`;
      })
      .join("}");

    const tag = document.createElement("style");
    tag.id = "store-style";
    tag.innerHTML = scopedCss;
    document.head.appendChild(tag);

    return () => tag.remove();
  }, [store]);

  /* =========================
     AUTH MODAL EVENT
  ========================= */
  useEffect(() => {
    const handler = e => {
      if (e.detail?.storeId && e.detail.storeId !== storeId) return;
      setAuthMode(e.detail?.mode || "login");
      setAuthOpen(true);
    };
    window.addEventListener("open-store-auth", handler);
    return () => window.removeEventListener("open-store-auth", handler);
  }, [storeId]);

  function handleAuthSuccess(data) {
    if (data?.token) {
      localStorage.setItem(`store:${storeId}:token`, data.token);
      window.dispatchEvent(
        new CustomEvent("store-auth-changed", { detail: { storeId } })
      );
    }
    setAuthOpen(false);
  }

  /* =========================
     CARRITO
  ========================= */
  function addToCart(product) {
    const key = `store:${storeId}:cart`;
    const cart = JSON.parse(localStorage.getItem(key) || "[]");
    const existing = cart.find(p => p.id === product.id);

    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    localStorage.setItem(key, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: { storeId } }));
  }

  /* =========================
     RENDER PRODUCTS
  ========================= */
  function renderCards() {
    return products.map(p => {
      const { discountedPrice } = applyDiscount(
        p.price,
        p.discount || p.productsOnDiscount?.[0]?.discount
      );

      return (
        <div key={p.id} className={styles.productCard}>
          <img src={p.image || "/placeholder.png"} alt={p.name} />
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          <strong>${(discountedPrice ?? p.price).toLocaleString()}</strong>
          <div className={styles.cardActions}>
            <Link to={`/stores/${storeId}/products/${p.id}`} className={styles.btnOutline}>
              Ver
            </Link>
            <button className={styles.btnAdd} onClick={() => addToCart(p)}>
              Agregar
            </button>
          </div>
        </div>
      );
    });
  }

  function renderProducts() {
    switch (store.layoutType) {
      case "catalog":
        return <div className={styles.productsCatalog}>{renderCards()}</div>;
      case "minimal":
        return <div className={styles.productsMinimal}>{renderCards()}</div>;
      default:
        return <div className={styles.productsGrid}>{renderCards()}</div>;
    }
  }

  /* =========================
     RENDER
  ========================= */
  if (loading) return <div className={styles.loader}></div>;
  if (!store) return <div className={styles.error}>Tienda no encontrada</div>;

  return (
   <div
  ref={storeRef}
  className={`public-store ${styles.publicStore}`}
>

      <PublicNavBar storeId={storeId} storeName={store.name} />

      {/* HERO */}
      <header
        className={styles.storeHero}
        style={{ backgroundImage: `url(${store.bannerUrl})` }}
      >
        <div className={styles.overlay}></div>
        <div className={styles.heroContent}>
          <h1>{store.name}</h1>
          <p>{store.description}</p>
          <a href="#products" className={styles.btnAdd}>
            Comprar ahora
          </a>
        </div>
      </header>

      {/* AUTH MODAL */}
      {authOpen && (
        <div className={styles.authModalOverlay} onClick={() => setAuthOpen(false)}>
          <div className={styles.authModal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setAuthOpen(false)}>×</button>
            {authMode === "login" ? (
              <StoreLogin storeId={storeId} onAuth={handleAuthSuccess} />
            ) : (
              <StoreRegister storeId={storeId} onAuth={handleAuthSuccess} />
            )}
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      <section id="products" className={styles.productsSection}>
        <h2>Productos</h2>
        {products.length ? renderProducts() : <p>No hay productos.</p>}
      </section>

      {/* REVIEWS */}
      <section className={styles.reviewsSection}>
        <h2>Reseñas</h2>

        <form
          className={styles.reviewForm}
          onSubmit={async e => {
            e.preventDefault();
            if (!newReview.trim()) return;

            const res = await fetch(`${API}/api/reviews`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem(`store:${storeId}:token`) || ""}`
              },
              body: JSON.stringify({ storeId, comment: newReview, rating })
            });

            if (res.ok) {
              const data = await res.json();
              setReviews([data, ...reviews]);
              setNewReview("");
              setRating(5);
            }
          }}
        >
          <select value={rating} onChange={e => setRating(e.target.value)}>
            {[5,4,3,2,1].map(v => <option key={v} value={v}>{`${"⭐".repeat(v)}`}</option>)}
          </select>
          <textarea value={newReview} onChange={e => setNewReview(e.target.value)} />
          <button type="submit" className={styles.btnAdd}>Enviar</button>
        </form>

        <div className={styles.reviewsList}>
          {reviews.map((r, i) => (
            <div key={i} className={styles.reviewCard}>
              <strong>{"⭐".repeat(r.rating)}</strong>
              <p>{r.comment}</p>
              <small>{new Date(r.createdAt).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      </section>

      <ChatWidget storeId={storeId} />
    </div>
  );
}
