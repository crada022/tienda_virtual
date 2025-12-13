import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStorePublic, getStoreReviews, createReview } from "../api/storesApi";
import PublicNavBar from "../components/PublicNavBar";
import styles from "../styles/storeReviews.module.css";

export default function StoreReviews() {
  const { storeId } = useParams();
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
    const loadData = async () => {
      try {
        const [storeRes, reviewsRes] = await Promise.all([
          getStorePublic(storeId),
          getStoreReviews(storeId),
        ]);

        if (!mounted) return;

        // 🔹 Aquí ya no usamos .data porque getStorePublic retorna el objeto directamente
        setStore(storeRes);
        setReviews(reviewsRes.reviews || []); // Ajusta según lo que devuelva tu API
      } catch (err) {
        console.error("Error cargando tienda y reseñas:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => (mounted = false);
  }, [storeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.trim()) return;
    setSubmitting(true);
    setErr(null);
    try {
      const res = await createReview(storeId, { comment: newReview, rating });
      const created = res.review || res;
      setReviews(prev => [created, ...prev]);
      setNewReview("");
      setRating(5);
      setMsg("Reseña enviada correctamente.");
      setTimeout(() => setMsg(null), 3500);
    } catch (error) {
      console.error("Error creando reseña", error);
      setErr("No se pudo enviar la reseña.");
      setTimeout(() => setErr(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando tienda…</div>;

  return (
    <>
      <PublicNavBar storeId={storeId} storeName={store?.name || "Tienda"} />

      <div className={styles.reviewsContainer}>
        <h2 className={styles.title}>Reseñas de {store?.name}</h2>

        <div className={styles.reviewForm}>
          <h3>Escribir una reseña</h3>
          <form onSubmit={handleSubmit}>
            <label>Puntuación:</label>
            <select
              aria-label="Puntuación"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              disabled={submitting}
            >
              <option value={5}>⭐️⭐️⭐️⭐️⭐️</option>
              <option value={4}>⭐️⭐️⭐️⭐️</option>
              <option value={3}>⭐️⭐️⭐️</option>
              <option value={2}>⭐️⭐️</option>
              <option value={1}>⭐️</option>
            </select>

            <label htmlFor="reviewComment">Comentario:</label>
            <textarea
              id="reviewComment"
              placeholder="Escribe tu reseña..."
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              disabled={submitting}
              rows={4}
            />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="submit" className={styles.btnReview} disabled={submitting || !newReview.trim()}>
                {submitting ? 'Enviando...' : 'Enviar reseña'}
              </button>
              {msg && <div className={styles.success}>{msg}</div>}
              {err && <div className={styles.error}>{err}</div>}
            </div>
          </form>
        </div>

        <div className={styles.reviewsList}>
          <h3>Reseñas recientes</h3>
          {reviews.length === 0 && <p className={styles.muted}>No hay reseñas aún.</p>}

          {reviews.map((r, i) => (
            <div key={r.id || i} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <span className={styles.reviewRating}>{Array(Math.max(0, r.rating || 0)).fill('⭐').join('')}</span>
                <span className={styles.reviewDate}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</span>
              </div>

              <p className={styles.reviewComment}>{r.comment}</p>
              <p className={styles.reviewUser}>Por: {r.userName || r.user || 'Usario_Registrado'}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
