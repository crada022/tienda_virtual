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
      req,
      customerId
    );

    return res.status(201).json(order);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

/**
 * =========================
 * CREAR ORDEN DESDE ITEMS
 * =========================
 * Checkout rápido / Buy now
 */
export const createOrderFromItemsController = async (req, res) => {
  try {
    const { items } = req.body;
    const customerId = req.customer.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    const order = await createOrderFromItems(
      req,          // 🔥 tenantPrisma vive aquí
      customerId,
      items
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
      req,
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
      req,
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
 * ACTUALIZAR ESTADO (ADMIN TIENDA)
 * =========================
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = Number(req.params.id);

    const order = await updateOrderStatusByStore(
      req,        // 🔥 pasar req para tenantPrisma
      orderId,
      status
    );

    return res.json(order);
  } catch (err) {
    console.error("[order.updateOrderStatus]", err);
    return res.status(400).json({ message: err.message });
  }
};
