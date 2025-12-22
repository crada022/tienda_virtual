import {
  createOrderFromCart,
  getOrdersByCustomer,
  getOrderById,
  createOrderFromItems,
  updateOrderStatusByStore
} from "./order.service.js";

/**
 * =========================
 * CREAR ORDEN DESDE CARRITO
 * =========================
 */
export const createOrder = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const order = await createOrderFromCart(
      req,               // 🔥 pasar req
      customerId
    );

    return res.json(order);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

/**
 * =========================
 * CREAR ORDEN DESDE ITEMS
 * =========================
 */
export const createOrderFromItemsController = async (req, res) => {
  try {
    const { items, billing } = req.body;
    const customerId = req.customer.id;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "Items are required" });
    }

    const order = await createOrderFromItems(
      req,          // 🔥 CLAVE
      customerId,
      items,
      billing
    );

    return res.status(201).json(order);
  } catch (err) {
    console.error("[order.createOrderFromItems]", err);
    return res.status(400).json({ message: err.message });
  }
};

/**
 * =========================
 * LISTAR ÓRDENES DEL CUSTOMER
 * =========================
 */
export const listMyOrders = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const orders = await getOrdersByCustomer(
      req,           // 🔥 pasar req
      customerId
    );

    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching orders" });
  }
};

/**
 * =========================
 * OBTENER ORDEN POR ID
 * =========================
 */
export const getOrder = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const orderId = Number(req.params.id);

    const order = await getOrderById(
      req,           // 🔥 pasar req
      orderId,
      customerId
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching order" });
  }
};

/**
 * =========================
 * ACTUALIZAR ESTADO (ADMIN)
 * =========================
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = Number(req.params.id);

    const order = await updateOrderStatusByStore(
      req.store.id,   // 🔥 store real
      orderId,
      status
    );

    return res.json(order);
  } catch (err) {
    console.error("[order.updateOrderStatus]", err);
    return res.status(400).json({ message: "Error updating order status" });
  }
};
