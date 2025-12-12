import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function StoreCart() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const key = `store:${storeId}:cart`;
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // inicializar carrito desde localStorage
    setCart(JSON.parse(localStorage.getItem(key) || "[]"));

    const handler = () => setCart(JSON.parse(localStorage.getItem(key) || "[]"));
    window.addEventListener("store-cart-updated", handler);
    return () => window.removeEventListener("store-cart-updated", handler);
  }, [storeId]);

  function save(next) {
    setCart(next);
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("store-cart-updated", { detail: { storeId } }));
  }

  function updateQty(id, qty) {
    const next = cart.map(i => i.id === id ? { ...i, quantity: Math.max(1, Number(qty) || 1) } : i);
    save(next);
  }

  function removeItem(id) {
    const next = cart.filter(i => i.id !== id);
    save(next);
  }

  function emptyCart() {
    save([]);
  }

  function checkout() {
    const token = localStorage.getItem(`store:${storeId}:token`);
    if (!token) {
      // abrir modal de auth en PublicStore (handler ya expuesto)
      window.dispatchEvent(new CustomEvent("open-store-auth", { detail: { storeId } }));
      return;
    }
    navigate(`/stores/${storeId}/checkout`);
  }

  const total = cart.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);

  if (!cart.length) return <div className="no-products" style={{ padding: 20 }}>Tu carrito está vacío</div>;

  return (
    <div style={{ maxWidth: 980, margin: "20px auto", padding: "0 18px" }}>
      <h2>Carrito</h2>

      <div style={{ display: "grid", gap: 12 }}>
        {cart.map(item => (
          <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: "var(--store-card, #fff)", borderRadius: 10 }}>
            <img src={item.image || item.imageUrl || "/placeholder.png"} alt={item.name} style={{ width: 88, height: 72, objectFit: "cover", borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <strong>{item.name}</strong>
              <div style={{ color: "var(--store-muted, #666)" }}>{(item.price ?? 0).toFixed(2)} COP</div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="number" min="1" value={item.quantity || 1} onChange={e => updateQty(item.id, e.target.value)} style={{ width: 64, padding: 6 }} />
              <button className="btn-outline" onClick={() => removeItem(item.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
        <div>Total: <strong className="price">{total.toFixed(2)} COP</strong></div>
        <div>
          <button className="btn-outline" onClick={emptyCart}>Vaciar</button>
          <button className="btn-add" onClick={checkout} style={{ marginLeft: 8 }}>Pagar</button>
          <Link to={`/stores/${storeId}/products`} className="btn-outline" style={{ marginLeft: 8 }}>Seguir comprando</Link>
        </div>
      </div>
    </div>
  );
}