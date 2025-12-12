import React, { useEffect, useState } from 'react';
import { getCart, removeItemFromCart, updateQuantity, clearCart } from '../api/services/cartService';
import PublicNavBar from "../components/PublicNavBar";
import { getStorePublic } from "../api/storesApi";
import styles from "../styles/cart.module.css";

function Cart() {
  const [cart, setCart] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [store, setStore] = useState(null);

  // Obtener el carrito
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await getCart();
        setCart(data);
        
        const lsSid = (() => {
          try {
            const keys = Object.keys(localStorage || {});
            const match = keys.find(k => k.startsWith('store:') && k.endsWith(':cart'));
            if (match) return match.split(':')[1];
          } catch (e) {
            // ignore
          }
          return null;
        })();
        const sid = lsSid || data?.items?.[0]?.product?.storeId || getStoreIdFromPath();
        if (sid) setStoreId(sid);
        
        if (sid) {
          try {
            const s = await getStorePublic(sid);
            setStore(s);
          } catch (e) {
            console.debug('No se pudo cargar tienda pública', e);
          }
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    fetchCart();
  }, []);

  // Aplicar estilos de la tienda (si están disponibles) al documento
  useEffect(() => {
    if (!store) return;

    const prevBg = document.body.style.backgroundImage;
    if (store.bannerUrl) {
      document.body.style.backgroundImage = `url(${store.bannerUrl})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }

    return () => {
      document.body.style.backgroundImage = prevBg || '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
    };
  }, [store]);

  function getStoreIdFromPath() {
    try {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('stores');
      if (idx !== -1 && parts.length > idx + 1) return parts[idx + 1];
    } catch (e) {}
    return null;
  }

  const handleRemove = async (itemId) => {
    await removeItemFromCart(itemId);
    setCart(await getCart());
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    if (quantity > 0) {
      await updateQuantity(itemId, quantity);
      setCart(await getCart());
    }
  };

  const handleClearCart = async () => {
    await clearCart();
    setCart(null);
  };

  const containerStyle = store ? {
    ['--store-primary']: store.primaryColor || store.color || '#0066cc',
    ['--store-accent']: store.accentColor || '#ff7a59',
    ['--store-text']: store.textColor || '#222'
  } : {};

  const subtotal = cart?.items?.reduce((acc, item) => acc + item.product.price * item.quantity, 0) || 0;
  const itemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div style={containerStyle}>
      <PublicNavBar storeId={storeId} storeName={store?.name} />
      <div className={styles.cartContainer}>
        <div className={styles.cartHero}>
          <div className={styles.heroContent}>
            <h1>Tu Carrito de Compras</h1>
            <p className={styles.muted}>
              {cart?.items?.length > 0 
                ? `${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'} en tu carrito`
                : 'Revisa tu pedido antes de proceder al pago'
              }
            </p>
          </div>
        </div>

        {cart?.items?.length > 0 ? (
          <div className={styles.cartWrap}>
            <div className={styles.cartMain}>
              <ul className={styles.cartList}>
                {cart.items.map((item) => (
                  <li key={item.id} className={styles.cartItem}>
                    <div className={styles.itemImageWrap}>
                      <img src={item.product.image || '/placeholder.png'} alt={item.product.name} className={styles.thumb} />
                    </div>
                    <div className={styles.itemBody}>
                      <h3 className={styles.itemTitle}>{item.product.name}</h3>
                      <p className={styles.itemDesc}>{item.product.description}</p>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemPriceUnit}>
                          ${item.product.price.toFixed(2)} c/u
                        </span>
                      </div>
                      <div className={styles.itemControls}>
                        <div className={styles.qty}>
                          <button 
                            className={styles.qtyBtn} 
                            onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            aria-label="Disminuir cantidad"
                          >
                            −
                          </button>
                          <input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => handleUpdateQuantity(item.id, Number(e.target.value))} 
                            min="1"
                            aria-label="Cantidad"
                          />
                          <button 
                            className={styles.qtyBtn} 
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            aria-label="Aumentar cantidad"
                          >
                            +
                          </button>
                        </div>
                        <div className={styles.price}>
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button 
                        className={styles.btnRemove} 
                        onClick={() => handleRemove(item.id)}
                        aria-label="Eliminar producto"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className={styles.cartSummary}>
              <div className={styles.summaryCard}>
                <h3>Resumen del Pedido</h3>
                <div className={styles.summaryDetails}>
                  <div className={styles.summaryLine}>
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'artículo' : 'artículos'})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className={`${styles.summaryLine} ${styles.muted}`}>
                    <span>Envío</span>
                    <span>Calculado en checkout</span>
                  </div>
                  <div className={`${styles.summaryLine} ${styles.muted}`}>
                    <span>Impuestos</span>
                    <span>Calculado en checkout</span>
                  </div>
                </div>
                <div className={styles.summaryTotal}>
                  <span>Total estimado</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.summaryActions}>
                  <a className={styles.btnPrimary} href={storeId ? `/stores/${storeId}/checkout` : '/'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5l7 7-7 7"/>
                    </svg>
                    Proceder al Pago
                  </a>
                  <button className={styles.btnOutline} onClick={handleClearCart}>
                    Vaciar Carrito
                  </button>
                </div>
                <div className={styles.securityBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span>Pago seguro y encriptado</span>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            <h2>Tu carrito está vacío</h2>
            <p>Agrega productos para comenzar tu compra</p>
            {storeId && (
              <a className={styles.btnPrimary} href={`/stores/${storeId}`}>
                Continuar Comprando
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;