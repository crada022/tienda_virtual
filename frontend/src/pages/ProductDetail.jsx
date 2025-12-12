import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function ProductDetail() {
  const { storeId, productId } = useParams();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`${API}/api/stores/${storeId}/products/${productId}`);
      if (res.ok) {
        setProduct(await res.json());
      } else {
        setProduct(null);
      }
      setLoading(false);
    }
    load();
  }, [storeId, productId]);

  if (loading) return <div className="loader">Cargando producto…</div>;
  if (!product) return <div className="no-products">Producto no encontrado</div>;

  return (
    <div style={{ maxWidth: 980, margin: "20px auto", padding: "0 18px" }}>
      <div style={{ display: "flex", gap: 18 }}>
        <img src={product.imageUrl || "/placeholder.png"} alt={product.name} style={{ width: "360px", borderRadius: 12, objectFit:"cover" }} />
        <div style={{ flex: 1 }}>
          <h2>{product.name}</h2>
          <div className="price">{(product.price ?? 0).toFixed(2)} USD</div>
          <p style={{ color: "var(--muted)" }}>{product.description}</p>
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button className="btn-add" onClick={()=>{
              const key = `store:${storeId}:cart`;
              const cart = JSON.parse(localStorage.getItem(key) || "[]");
              const existing = cart.find(c => c.id === product.id);
              if (existing) existing.quantity = (existing.quantity||1)+1; else cart.push({ ...product, quantity:1});
              localStorage.setItem(key, JSON.stringify(cart));
            }}>Agregar al carrito</button>
            <Link to={`/stores/${storeId}/cart`} className="btn-outline">Ir al carrito</Link>
          </div>
        </div>
      </div>
    </div>
  );
}