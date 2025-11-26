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

// Público
router.get("/", getProducts);
router.get("/:id", getProduct);

// Solo ADMIN
router.post("/", authMiddleware, isAdmin, createProduct);
router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);

export default router;
