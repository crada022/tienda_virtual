import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";

import {
  getMyCart,
  addItem,
  updateItem,
  removeItem,
  updateQuantity,
  clearCart,
} from "./cart.controller.js";

const router = Router();

// Obtener carrito del usuario
router.get("/", authMiddleware, getMyCart);

// Agregar item
router.post("/", authMiddleware, addItem);

// Actualizar solo cantidad (ruta más específica)
router.put("/update/:itemId", authMiddleware, updateQuantity);

// Actualizar item completo (ruta genérica)
router.put("/:itemId", authMiddleware, updateItem);

// Eliminar item
router.delete("/:itemId", authMiddleware, removeItem);

// Vaciar todo el carrito
router.delete("/clear", authMiddleware, clearCart);

export default router;
