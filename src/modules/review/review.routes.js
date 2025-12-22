import { Router } from "express";
import {
  createReview,
  getStoreReviews,
  deleteReview
} from "./review.controller.js";

const router = Router();

// 🔓 públicas
router.get("/stores/:storeId", getStoreReviews);

// 🔐 cliente autenticado
router.post("/stores/:storeId", createReview);

// 🔐 admin / owner
router.delete("/stores/:storeId/:id", deleteReview);

export default router;
