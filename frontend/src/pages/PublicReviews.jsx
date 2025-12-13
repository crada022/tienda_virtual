import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PublicNavBar from "../components/PublicNavBar";
import "../styles/publicReviews.css";

export default function PublicReviews() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // 🔧 TODO: Reemplazar con API real
    setStore({
      name: "Tienda Demo",
      rating: 4.6,
      reviewsCount: 18,
    });

    setReviews([
      {
        id: 1,
        user: "Carlos Ruiz",
        rating: 5,
        comment: "Excelente calidad y envío rápido",
        date: "2024-10-12",
      },
      {
        id: 2,
        user: "Ana María",
        rating: 4,
        comment: "Buen producto, aunque tardó un poco",
        date: "2024-11-02",
      },
      {
        id: 3,
        user: "Pedro Torres",
        rating: 5,
        comment: "Muy satisfecho con la atención",
        date: "2024-11-10",
      },
    ]);
  }, [storeId]);

  return (
    <>
      <PublicNavBar />

      <div className="public-reviews-container fade-in">
        {store && (
          <header className="reviews-header">
            <h1 className="store-title">{store.name}</h1>
            <div className="rating-summary">
              <span className="rating-number">{store.rating.toFixed(1)}</span>
              <div className="stars">
                {"★".repeat(Math.round(store.rating))}
                {"☆".repeat(5 - Math.round(store.rating))}
              </div>
              <span className="reviews-count">
                {store.reviewsCount} reseñas
              </span>
            </div>
          </header>
        )}

        <section className="reviews-list">
          {reviews.length === 0 && (
            <p className="no-reviews">Aún no hay reseñas para esta tienda.</p>
          )}

          {reviews.map((review) => (
            <div key={review.id} className="review-card card slide-up">

              <div className="review-header">
                <h3>{review.user}</h3>
                <span className="stars small">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>

              <p className="review-comment">{review.comment}</p>

              <div className="review-date">{review.date}</div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
