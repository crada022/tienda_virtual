import {
  createOrderFromCart,
  getOrdersByUser,
  getOrderById,
  createOrderFromItems,
} from "./order.service.js";
import prisma from "../../config/db.js";

// =======================
//   CREAR ORDEN DESDE EL CARRITO
// =======================
export const createOrder = async (req, res) => {
  try {
    const order = await createOrderFromCart(req.user.id);
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Crear orden a partir de items enviados (frontend envía precios para preservar precio)
export const createOrderWithItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Items required" });

    const order = await createOrderFromItems(userId, items);
    return res.json(order);
  } catch (err) {
    console.error("createOrderWithItems error", err);
    return res.status(400).json({ message: err.message });
  }
};

// =======================
//   LISTAR ÓRDENES DEL USUARIO
// =======================
export const listMyOrders = async (req, res) => {
  try {
    const orders = await getOrdersByUser(req.user.id);

    // asegurar que cada orden tenga storeId (derive desde items.product.storeId o consultando producto)
    const enriched = await Promise.all(orders.map(async (o) => {
      let storeId = null;
      if (o.items && o.items.length) {
        const ids = Array.from(new Set(o.items.map(it => it.product?.storeId).filter(Boolean)));
        if (ids.length === 1) storeId = ids[0];
        else if (ids.length > 1) storeId = null; // multi-store
        else {
          // intentar consultar el primer producto por id
          try {
            const pid = o.items[0].productId;
            const p = await prisma.product.findUnique({ where: { id: pid } });
            if (p && p.storeId) storeId = p.storeId;
          } catch (e) {
            console.debug("could not resolve product storeId", e?.message);
          }
        }
      }
      return { ...o, storeId };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};

// =======================
//   OBTENER UNA ORDEN POR ID
// =======================
export const getOrder = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const order = await getOrderById(orderId, req.user.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    // determinar storeId si es posible
    let storeId = null;
    if (order.items && order.items.length) {
      const ids = Array.from(new Set(order.items.map(it => it.product?.storeId).filter(Boolean)));
      if (ids.length === 1) storeId = ids[0];
      else if (ids.length === 0) {
        try {
          const pid = order.items[0].productId;
          const p = await prisma.product.findUnique({ where: { id: pid } });
          if (p && p.storeId) storeId = p.storeId;
        } catch (e) {
          console.debug("could not resolve product storeId", e?.message);
        }
      }
    }

    res.json({ ...order, storeId });
  } catch (err) {
    res.status(500).json({ message: "Error fetching order" });
  }
};

// =======================
//   ACTUALIZAR ESTADO DE ORDEN (ADMIN)
// =======================
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });

    res.json(order);

  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error updating order status" });
  }
};
