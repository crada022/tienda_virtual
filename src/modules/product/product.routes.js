import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} from "./product.controller.js";

import { authMiddleware } from "../auth/auth.middleware.js";


const router = Router();

// ================================
// PRODUCTOS POR TIENDA
// ================================

// Obtener todos los productos de una tienda (requiere login)
router.get("/stores/:storeId/products", authMiddleware, getProducts);

// Obtener un producto específico dentro de una tienda
router.get("/stores/:storeId/products/:productId", authMiddleware, getProduct);

// Crear producto SOLO si es ADMIN
router.post("/stores/:storeId/products", authMiddleware, createProduct);

// Actualizar producto SOLO si es ADMIN
router.put("/stores/:storeId/products/:productId", authMiddleware, updateProduct);

// Eliminar producto SOLO si es ADMIN
router.delete("/stores/:storeId/products/:productId", authMiddleware, deleteProduct);

export default router;
