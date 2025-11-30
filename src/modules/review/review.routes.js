import express from "express";
import { body, param, query, validationResult } from "express-validator";
import { authMiddleware } from "../auth/auth.middleware.js";

import {
  createReview,
  getReviewsForProduct,
  getReviewsForStore,
  getReviewsForUser,
  updateReview,
  deleteReview
} from "./review.controller.js";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// crear review
router.post(
  "/",
  authMiddleware,
  body("rating").isInt({ min: 1, max: 5 }),
  body("comment").optional().isString().isLength({ min: 3 }),
  body().custom((value) => {
    if (!value.productId && !value.storeId && !value.reviewedUserId) {
      throw new Error("Debe indicar productId, storeId o reviewedUserId");
    }
    return true;
  }),
  validate,
  createReview
);

// listar con paginación y filtros
router.get(
  "/products/:productId",
  param("productId").isInt().toInt(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  getReviewsForProduct
);

router.get(
  "/stores/:storeId",
  param("storeId").isString().notEmpty(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  getReviewsForStore
);

router.get(
  "/users/:userId",
  param("userId").isInt().toInt(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  getReviewsForUser
);

// opcional: editar / borrar (autor o admin)
router.put("/:id", authMiddleware, body("comment").optional().isString(), body("rating").optional().isInt({ min:1, max:5 }), validate, updateReview);
router.delete("/:id", authMiddleware, validate, deleteReview);

export default router;
