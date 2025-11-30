// src/components/ReviewForm.jsx
import { useState } from "react";
import reviewService from "../api/services/reviewService";
import { useAuth } from "../store/useAuth";

export default function ReviewForm({ productId, storeId, userId, onCreated }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { token } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await reviewService.createReview(
        { rating, comment, productId, storeId, reviewedUserId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComment("");
      onCreated?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={submit} className="review-form">
      <h3>Deja una reseña</h3>

      <label>Puntuación:</label>
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      <label>Comentario:</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      />

      <button type="submit">Enviar</button>
    </form>
  );
}
