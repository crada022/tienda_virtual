import {
  createOrderFromCart,
  getOrdersByUser,
  getOrderById,
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

// =======================
//   LISTAR ÓRDENES DEL USUARIO
// =======================
export const listMyOrders = async (req, res) => {
  try {
    const orders = await getOrdersByUser(req.user.id);
    res.json(orders);
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

    res.json(order);
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
