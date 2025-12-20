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
    const { storeId } = req.params;
    const customerId = req.customer.id;

    const order = await createOrderFromCart(storeId, customerId);
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
export const createOrderWithItems = async (req, res) => {
  try {
    const { storeId } = req.params;
    const customerId = req.customer.id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items required" });
    }

    const order = await createOrderFromItems(
      storeId,
      customerId,
      items
    );

    return res.json(order);

  } catch (err) {
    console.error("[order.createOrderWithItems]", err);
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
    const { storeId } = req.params;
    const customerId = req.customer.id;

    const orders = await getOrdersByCustomer(storeId, customerId);
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
    const { storeId } = req.params;
    const customerId = req.customer.id;
    const orderId = Number(req.params.id);

    const order = await getOrderById(
      storeId,
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
    const { storeId } = req.params;
    const { status } = req.body;
    const orderId = Number(req.params.id);

    const order = await updateOrderStatusByStore(
      storeId,
      orderId,
      status
    );

    return res.json(order);

  } catch (err) {
    console.error("[order.updateOrderStatus]", err);
    return res.status(400).json({ message: "Error updating order status" });
  }
};
