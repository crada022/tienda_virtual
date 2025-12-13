import React, { useEffect, useState } from 'react';
import {
  getCart,
  removeItemFromCart,
  updateQuantity,
  clearCart,
} from '../api/services/cartService';
import PublicNavBar from '../components/PublicNavBar';
import { getStorePublic } from '../api/storesApi';
import styles from '../styles/cart.module.css';

// ✅ ESTA FUNCIÓN DEBE IR AFUERA DEL COMPONENTE
function getStoreIdFromPath() {
  try {
    const parts = window.location.pathname.split('/');
    const index = parts.indexOf('stores');
    if (index !== -1 && parts[index + 1]) return parts[index + 1];
  } catch {}
  return null;
}

function Cart() {
  const [cart, setCart] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [store, setStore] = useState(null);

  // Obtener carrito + tienda
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await getCart();
        setCart(data);

        // Buscar storeId
        const lsSid = (() => {
          try {
            const keys = Object.keys(localStorage || {});
            const match = keys.find(
              (k) => k.startsWith('store:') && k.endsWith(':cart')
            );
            if (match) return match.split(':')[1];
          } catch {}
          return null;
        })();

        const sid =
          lsSid || data?.items?.[0]?.product?.storeId || getStoreIdFromPath();

        if (sid) setStoreId(sid);

        // Cargar tienda pública
        if (sid) {
          const s = await getStorePublic(sid);
          setStore(s);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    fetchCart();
  }, []);

  // Colores de marca de tienda
  const containerStyle = store
    ? {
        ['--store-primary']: store.primaryColor || store.color || '#0066cc',
        ['--store-accent']: store.accentColor || '#ff7a59',
        ['--store-text']: store.textColor || '#222',
      }
    : {};

  // Totales
  const subtotal =
    cart?.items?.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    ) || 0;

  const itemCount =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleRemove = async (productId) => {
    await removeItemFromCart(productId);
    setCart(await getCart());
  };

  const handleQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    await updateQuantity(productId, quantity);
    setCart(await getCart());
  };

  const handleClearCart = async () => {
    await clearCart();
    setCart({ items: [] });
  };

  return (
    <div style={containerStyle}>
      {/* NAVBAR PÚBLICA */}
      <PublicNavBar storeId={storeId} storeName={store?.name || 'Tienda'} />

      <div className={styles.cartContainer}>
        <div className={styles.cartHero}>
          <div className={styles.heroContent}>
            <h1>Tu Carrito</h1>
            <p className={styles.muted}>
              {cart?.items?.length > 0
                ? `${itemCount} ${
                    itemCount === 1 ? 'artículo' : 'artículos'
                  } en tu carrito`
                : 'Aún no has agregado productos'}
            </p>
          </div>
        </div>

        {/* Carrito vacío */}
        {cart?.items?.length === 0 && (
          <div className={styles.emptyCart}>
            <h2>🛒 Tu carrito está vacío</h2>
            <p>Explora productos y agrégalos al carrito.</p>
          </div>
        )}

        {/* Carrito con productos */}
        {cart?.items?.length > 0 && (
          <div className={styles.contentGrid}>
            {/* LISTA DE PRODUCTOS */}
            <div className={styles.itemsList}>
              {cart.items.map((item) => (
                <div key={item.product._id} className={styles.itemCard}>
                  <img
                    src={item.product.image || '/placeholder.png'}
                    alt={item.product.name}
                    className={styles.productImage}
                  />

                  <div className={styles.itemInfo}>
                    <h3>{item.product.name}</h3>
                    <p className={styles.price}>
                      ${item.product.price.toLocaleString()}
                    </p>

                    <div className={styles.quantityControl}>
                      <button
                        onClick={() =>
                          handleQuantity(
                            item.product._id,
                            item.quantity - 1
                          )
                        }
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          handleQuantity(
                            item.product._id,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemove(item.product._id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* RESUMEN DE COMPRA */}
            <div className={styles.summaryCard}>
              <h3>Resumen</h3>

              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <strong>${subtotal.toLocaleString()}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Envío:</span>
                <strong>Calculado al pagar</strong>
              </div>

              <hr />

              <div className={styles.summaryTotal}>
                <span>Total:</span>
                <strong>${subtotal.toLocaleString()}</strong>
              </div>

              <button className={styles.checkoutBtn}>Proceder al Pago</button>

              <button className={styles.clearBtn} onClick={handleClearCart}>
                Vaciar Carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
