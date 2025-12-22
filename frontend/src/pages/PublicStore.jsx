// src/pages/PublicStore.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getStorePublic,
  getProductsPublic,
  getStoreReviews
} from "../api/storesApi";
import PublicNavBar from "../components/PublicNavBar";
import ChatWidget from "../components/ChatWidget";
import styles from "../styles/publicStore.module.css";

export default function PublicStore() {
  const { slug } = useParams(); // ✅ SLUG
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // 1️⃣ Tienda por slug
        const storeData = await getStorePublic(slug);
        setStore(storeData);

        const storeId = storeData.id;

        // 2️⃣ Productos (internamente por storeId)
        const productsData = await getProductsPublic(storeId);
        setProducts(productsData);

        // 3️⃣ Reseñas
        const reviewsData = await getStoreReviews(storeId);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch (err) {
        console.error("Error cargando tienda pública:", err);
        setStore(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  if (loading) return <div className={styles.loader}></div>;
  if (!store) return <div className={styles.error}>Tienda no encontrada</div>;

  return (
    <div className={styles.publicStore}>
      {/* NAVBAR */}
      <PublicNavBar slug={slug} storeName={store.name} />

      {/* HERO */}
      <header
        className={styles.storeHero}
        style={{
          backgroundImage: store.bannerUrl
            ? `url(${store.bannerUrl})`
            : undefined
        }}
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

      {/* PRODUCTOS */}
      <section id="products" className={styles.productsSection}>
        <h2>Productos</h2>

        {products.length === 0 ? (
          <p>No hay productos disponibles</p>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((p) => (
              <div key={p.id} className={styles.productCard}>
                <img
                  src={p.image || "/placeholder.png"}
                  alt={p.name}
                  className={styles.productImg}
                />
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <strong>${p.price.toLocaleString()}</strong>

                {/* 🔥 URL PÚBLICA POR SLUG */}
                <Link
                  to={`/store/${slug}/products/${p.id}`}
                  className={styles.btnOutline}
                >
                  Ver producto
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RESEÑAS */}
      <section className={styles.reviewsSection}>
        <h2>Reseñas</h2>

        {reviews.length === 0 && <p>No hay reseñas aún</p>}

        {reviews.map((r, i) => (
          <div key={i} className={styles.reviewCard}>
            <strong>{"⭐".repeat(r.rating)}</strong>
            <p>{r.comment}</p>
          </div>
        ))}
      </section>

      {/* CHAT (usa storeId internamente) */}
      <ChatWidget storeId={store.id} />
    </div>
  );
}
