import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getStorePublic,
  getStoreReviews,
  createReview
} from "../api/storesApi";
import PublicNavBar from "../components/PublicNavBar";
import styles from "../styles/storeReviews.module.css";

export default function StoreReviews() {
  const { slug } = useParams(); // ✅ SLUG
  const [store, setStore] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        // 1️⃣ tienda por slug
        const storeData = await getStorePublic(slug);
        if (!storeData) throw new Error("Tienda no encontrada");

        // 2️⃣ reseñas por storeId
        const reviewsData = await getStoreReviews(storeData.id);

        if (!mounted) return;

        setStore(storeData);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch (error) {
        console.error("Error cargando reseñas:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => (mounted = false);
  }, [slug]);

  /* =========================
     SUBMIT REVIEW
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.trim() || !store) return;

    setSubmitting(true);
    setErr(null);

    try {
      const created = await createReview({
        storeId: store.id,
        comment: newReview,
        rating
      });

      setReviews(prev => [created, ...prev]);
      setNewReview("");
      setRating(5);
      setMsg("Reseña enviada correctamente.");
      setTimeout(() => setMsg(null), 3000);
    } catch (error) {
      console.error("Error creando reseña:", error);
      setErr("No se pudo enviar la reseña.");
      setTimeout(() => setErr(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando reseñas…</div>;
  if (!store) return <div className={styles.error}>Tienda no encontrada</div>;

  return (
    <>
      {/* ✅ NAVBAR CORRECTO */}
      <PublicNavBar slug={slug} storeName={store.name} />

      <div className={styles.reviewsContainer}>
        <h2 className={styles.title}>Reseñas de {store.name}</h2>

        {/* FORM */}
        <div className={styles.reviewForm}>
          <h3>Escribir una reseña</h3>

          <form onSubmit={handleSubmit}>
            <label>Puntuación</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              disabled={submitting}
            >
              <option value={5}>⭐⭐⭐⭐⭐</option>
              <option value={4}>⭐⭐⭐⭐</option>
              <option value={3}>⭐⭐⭐</option>
              <option value={2}>⭐⭐</option>
              <option value={1}>⭐</option>
            </select>

            <label>Comentario</label>
            <textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              rows={4}
              disabled={submitting}
              placeholder="Escribe tu reseña…"
            />

            <button
              type="submit"
              className={styles.btnReview}
              disabled={submitting || !newReview.trim()}
            >
              {submitting ? "Enviando…" : "Enviar reseña"}
            </button>

            {msg && <p className={styles.success}>{msg}</p>}
            {err && <p className={styles.error}>{err}</p>}
          </form>
        </div>

        {/* LIST */}
        <div className={styles.reviewsList}>
          <h3>Reseñas recientes</h3>

          {reviews.length === 0 && (
            <p className={styles.muted}>No hay reseñas aún.</p>
          )}

          {reviews.map((r, i) => (
            <div key={r.id || i} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <span className={styles.reviewRating}>
                  {"⭐".repeat(r.rating || 0)}
                </span>
                <span className={styles.reviewDate}>
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString()
                    : ""}
                </span>
              </div>

              <p className={styles.reviewComment}>{r.comment}</p>
              <p className={styles.reviewUser}>
                Por: {r.userName || "Usuario"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
