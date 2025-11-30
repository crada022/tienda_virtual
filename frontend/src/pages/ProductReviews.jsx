import { useParams } from "react-router-dom";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";

export default function ProductReviews() {
  const { productId } = useParams();

  return (
    <div className="product-reviews-page" style={{ padding: "20px" }}>
      <h2>Reseñas del producto</h2>

      <ReviewForm productId={productId} 
                  onCreated={() => window.location.reload()} />

      <ReviewList productId={productId} />
    </div>
  );
}
