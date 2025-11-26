import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} from "./product.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { isAdmin } from "../auth/isAdmin.middleware.js";

const router = Router();

// Ruta para obtener los productos de una tienda (con autenticación)
router.get("/stores/:storeId/products", authMiddleware, getProducts);

// Ruta para obtener un producto específico dentro de una tienda (con autenticación)
router.get("/stores/:storeId/products/:productId", authMiddleware, getProduct);

// Solo ADMIN puede crear productos para una tienda
router.post("/stores/:storeId/products", authMiddleware, isAdmin, createProduct);

// Solo ADMIN puede actualizar un producto de una tienda
router.put("/stores/:storeId/products/:productId", authMiddleware, isAdmin, updateProduct);

// Solo ADMIN puede eliminar un producto de una tienda
router.delete("/stores/:storeId/products/:productId", authMiddleware, isAdmin, deleteProduct);

export default router;
