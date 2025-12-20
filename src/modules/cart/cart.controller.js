import {
  getCartByCustomer,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCustomerCart
} from "./cart.service.js";

import { getTenantPrisma } from "../../prisma/tenant.js";

/**
 * Helper: obtener customerId y storeId del token
 */
function getTenantUser(req) {
  const payload = req.userPayload || req.user;
  return {
    customerId: payload?.sub || payload?.id || null,
    storeId: payload?.storeId || null
  };
}

/**
 * =========================
 * GET /api/cart
 * =========================
 */
export const getMyCart = async (req, res) => {
  try {
    const { customerId, storeId } = getTenantUser(req);

    if (!customerId || !storeId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const cart = await getCartByCustomer(storeId, customerId);
    return res.json(cart ?? { items: [] });

  } catch (error) {
    console.error("[cart.getMyCart]", error);
    return res.status(500).json({ message: "Error obteniendo carrito" });
  }
};

/**
 * =========================
 * POST /api/cart/items
 * =========================
 */
export const addItem = async (req, res) => {
  try {
    const { customerId, storeId } = getTenantUser(req);
    const { productId, quantity } = req.body;

    if (!customerId || !storeId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!productId || quantity < 1) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const item = await addItemToCart(
      storeId,
      customerId,
      productId,
      quantity
    );

    return res.status(201).json(item);

  } catch (error) {
    console.error("[cart.addItem]", error);
    return res.status(500).json({ message: "Error agregando producto" });
  }
};

/**
 * =========================
 * PUT /api/cart/items/:itemId
 * =========================
 */
export const updateItem = async (req, res) => {
  try {
    const { storeId } = getTenantUser(req);
    const itemId = Number(req.params.itemId);
    const { quantity } = req.body;

    if (!storeId || !itemId || quantity < 1) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const item = await updateCartItem(storeId, itemId, quantity);
    return res.json(item);

  } catch (error) {
    console.error("[cart.updateItem]", error);
    return res.status(500).json({ message: "Error actualizando item" });
  }
};

/**
 * =========================
 * DELETE /api/cart/items/:itemId
 * =========================
 */
export const removeItem = async (req, res) => {
  try {
    const { storeId } = getTenantUser(req);
    const itemId = Number(req.params.itemId);

    if (!storeId || !itemId) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    await removeCartItem(storeId, itemId);
    return res.json({ message: "Item eliminado" });

  } catch (error) {
    console.error("[cart.removeItem]", error);
    return res.status(500).json({ message: "Error eliminando item" });
  }
};

/**
 * =========================
 * DELETE /api/cart
 * =========================
 */
export const clearCart = async (req, res) => {
  try {
    const { customerId, storeId } = getTenantUser(req);

    if (!customerId || !storeId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    await clearCustomerCart(storeId, customerId);
    return res.json({ message: "Carrito vaciado" });

  } catch (error) {
    console.error("[cart.clearCart]", error);
    return res.status(500).json({ message: "Error limpiando carrito" });
  }
};
// cart.controller.js
export const updateQuantity = async (req, res) => {
  try {
    const { storeId } = getTenantUser(req);
    const itemId = Number(req.params.itemId);
    const { quantity } = req.body;

    if (!storeId || !itemId || quantity < 1) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const item = await updateCartItem(storeId, itemId, quantity);
    return res.json(item);

  } catch (error) {
    console.error("[cart.updateQuantity]", error);
    return res.status(500).json({ message: "Error actualizando cantidad" });
  }
};
