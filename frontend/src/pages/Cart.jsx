import React, { useEffect, useState } from 'react';
import { getCart, removeItemFromCart, updateQuantity, clearCart } from '../api/services/cartService';

function Cart() {
  const [cart, setCart] = useState(null);

  // Obtener el carrito
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await getCart();
        setCart(data);
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    fetchCart();
  }, []);

  const handleRemove = async (itemId) => {
    await removeItemFromCart(itemId);
    setCart(await getCart()); // Actualizamos el carrito después de eliminar el producto
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    if (quantity > 0) {
      await updateQuantity(itemId, quantity);
      setCart(await getCart()); // Actualizamos el carrito después de cambiar la cantidad
    }
  };

  const handleClearCart = async () => {
    await clearCart();
    setCart(null); // Vaciar el carrito en el estado
  };

  return (
    <section>
      <h1>Carrito</h1>
      <p>Aquí verás los productos añadidos al carrito (implementa la UI/logic según tu store).</p>
      {cart ? (
        <div>
          <ul>
            {cart.items.map((item) => (
              <li key={item.id}>
                <h3>{item.product.name}</h3>
                <p>{item.product.description}</p>
                <p>Precio: ${item.product.price}</p>
                <p>Cantidad: 
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                    min="1"
                  />
                </p>
                <button onClick={() => handleRemove(item.id)}>Eliminar</button>
              </li>
            ))}
          </ul>
          <div>
            <button onClick={handleClearCart}>Vaciar Carrito</button>
            <h3>Total: ${cart.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)}</h3>
          </div>
        </div>
      ) : (
        <p>El carrito está vacío.</p>
      )}
    </section>
  );
}

export default Cart;
