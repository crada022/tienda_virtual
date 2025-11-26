import React, { useState } from 'react';
import { addToCart } from '../api/services/cartService';

function AddToCartButton({ productId }) {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    try {
      await addToCart(productId, quantity);
      alert('Producto agregado al carrito');
    } catch (error) {
      console.error('Error adding product to cart:', error);
      alert('Error al agregar producto al carrito');
    }
  };

  return (
    <div>
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        min="1"
      />
      <button onClick={handleAddToCart}>Agregar al carrito</button>
    </div>
  );
}

export default AddToCartButton;
