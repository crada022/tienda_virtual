import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNavBar from '../components/PublicNavBar';
import styles from '../styles/cart.module.css';
import { getStorePublic } from '../api/storesApi';

export default function Cart() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const key = `store:${storeId}:cart`;

  const [cart, setCart] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    // Cargar carrito
    setCart(JSON.parse(localStorage.getItem(key) || "[]"));
    const handler = () => setCart(JSON.parse(localStorage.getItem(key) || "[]"));
    window.addEventListener("store-cart-updated", handler);

    // Cargar tienda
    (async () => {
      try {
        const s = await getStorePublic(storeId);
        if (!mounted) return;
        setStore(s);
      } catch (err) {
        console.error("Error cargando la tienda:", err);
        setError("No se pudo cargar la tienda");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => window.removeEventListener("store-cart-updated", handler);
  }, [storeId]);

  const save = (next) => {
    setCart(next);
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("store-cart-updated", { detail: { storeId } }));
  };

  const updateQty = (id, qty) => {
    const next = cart.map(i => i.id === id ? { ...i, quantity: Math.max(1, Number(qty) || 1) } : i);
    save(next);
  };

  const removeItem = (id) => save(cart.filter(i => i.id !== id));
  const emptyCart = () => save([]);
  const checkout = () => {
    const token = localStorage.getItem(`store:${storeId}:token`);
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-store-auth", { detail: { storeId } }));
      return;
    }
    navigate(`/stores/${storeId}/checkout`);
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const itemCount = cart.reduce((acc, i) => acc + (i.quantity ?? 1), 0);

  const containerStyle = store
    ? {
        ['--store-primary']: store.primaryColor || store.color || '#0066cc',
        ['--store-accent']: store.accentColor || '#ff7a59',
        ['--store-text']: store.textColor || '#222',
      }
    : {};

  if (loading) return <div className={styles.loader}>Cargando tienda…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div style={containerStyle}>
      <PublicNavBar storeId={storeId} storeName={store?.name || 'Tienda'} />

      <div className={styles.cartContainer}>
        <div className={styles.cartHero}>
          <div className={styles.heroContent}>
            <h1>Tu Carrito</h1>
            <p className={styles.muted}>
              {cart.length > 0
                ? `${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'} en tu carrito`
                : 'Aún no has agregado productos'}
            </p>
          </div>
        </div>

        {cart.length === 0 && (
          <div className={styles.emptyCart}>
            <h2>🛒 Tu carrito está vacío</h2>
            <p>Explora productos y agrégalos al carrito.</p>
          </div>
        )}

        {cart.length > 0 && (
          <div className={styles.contentGrid}>
            <div className={styles.itemsList}>
              {cart.map(item => (
                <div key={item.id} className={styles.itemCard}>
                  <img
                    src={item.image || item.imageUrl || '/placeholder.png'}
                    alt={item.name}
                    className={styles.productImage}
                  />
                  <div className={styles.itemInfo}>
                    <h3>{item.name}</h3>
                    <p className={styles.price}>{(item.price ?? 0).toLocaleString()} COP</p>

                    <div className={styles.quantityControl}>
                      <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity ?? 1}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                    </div>

                    <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summaryCard}>
              <h3>Resumen</h3>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <strong>{subtotal.toLocaleString()} COP</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Envío:</span>
                <strong>Calculado al pagar</strong>
              </div>
              <hr />
              <div className={styles.summaryTotal}>
                <span>Total:</span>
                <strong>{subtotal.toLocaleString()} COP</strong>
              </div>

              <button className={styles.checkoutBtn} onClick={checkout}>Proceder al Pago</button>
              <button className={styles.clearBtn} onClick={emptyCart}>Vaciar Carrito</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
