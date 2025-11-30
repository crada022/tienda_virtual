// src/components/ReviewList.jsx
import { useEffect, useState } from "react";
import reviewService from "../api/services/reviewService";

export default function ReviewList({ productId, storeId, userId }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (productId) {
          const res = await reviewService.getProductReviews(productId);
          setReviews(res.data);
        } else if (storeId) {
          const res = await reviewService.getStoreReviews(storeId);
          setReviews(res.data);
        } else if (userId) {
          const res = await reviewService.getUserReviews(userId);
          setReviews(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [productId, storeId, userId]);

  if (!reviews.length) return <p>No hay reseñas todavía.</p>;

  return (
    <div className="reviews">
      {reviews.map((r) => (
        <div key={r.id} className="review-card">
          <strong>{r.rating} ⭐</strong>
          <p>{r.comment}</p>
          <small>Por usuario: {r.userId}</small>
        </div>
      ))}
    </div>
  );
}
