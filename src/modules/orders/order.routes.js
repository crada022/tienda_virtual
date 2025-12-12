import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { isAdmin } from "../auth/auth.middleware.js"; // si lo separas, ajusta la ruta

import { 
  createOrder, 
  listMyOrders, 
  getOrder,
  updateOrderStatus
} from "./order.controller.js";
import { createOrderWithItems } from "./order.controller.js";

const router = Router();

// Crear pedido
router.post("/", authMiddleware, createOrder);
// Crear pedido usando items (preserva precio enviado por frontend)
router.post("/create-from-items", authMiddleware, createOrderWithItems);

// Listar pedidos del usuario
router.get("/", authMiddleware, listMyOrders);

// Ver pedido por ID
router.get("/:id", authMiddleware, getOrder);

// Actualizar estado del pedido (solo admin)
router.put("/:id/status", authMiddleware, isAdmin, updateOrderStatus);

export default router;
