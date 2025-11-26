import {
  getCartByUser,
  addItemToCart,
  updateCartItem,
  removeCartItem,
} from "./cart.service.js";
import prisma from "../../config/db.js";  // <--- ESTE FALTABA

export const getMyCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await getCartByUser(userId);
    res.json(cart ?? { items: [] });
  } catch (e) {
    res.status(500).json({ message: "Error getting cart" });
  }
};

export const addItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const item = await addItemToCart(userId, productId, quantity);
    res.json(item);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error adding item" });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const itemId = Number(req.params.itemId);

    const item = await updateCartItem(itemId, quantity);
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Error updating item" });
  }
};

export const removeItem = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    await removeCartItem(itemId);
    res.json({ message: "Item removed" });
  } catch (e) {
    res.status(500).json({ message: "Error removing item" });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity < 1)
      return res.status(400).json({ error: "Quantity must be at least 1" });

    const item = await prisma.cartItem.update({
      where: { id: Number(itemId) },
      data: { quantity }
    });

    res.json({ message: "Quantity updated", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id }
    });

    if (!cart) return res.json({ message: "Cart already empty" });

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
