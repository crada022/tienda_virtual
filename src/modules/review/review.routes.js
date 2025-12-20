import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { resolveTenant } from "../middleware/resolveTenant.js";
import {
  createReview,
  getReviews,
  updateReview,
  deleteReview
} from "./review.controller.js";

const router = Router();

// 🌍 Reviews públicas por tienda
router.get("/stores/:storeId", resolveTenant, (req, res) => {
  req.query.storeId = req.params.storeId;
  return getReviews(req, res);
});

// Crear review
router.post("/", authMiddleware, resolveTenant, createReview);

// Obtener reviews por query
router.get("/", resolveTenant, getReviews);

// Actualizar review
router.put("/:id", authMiddleware, resolveTenant, updateReview);

// Eliminar review
router.delete("/:id", authMiddleware, resolveTenant, deleteReview);

export default router;
