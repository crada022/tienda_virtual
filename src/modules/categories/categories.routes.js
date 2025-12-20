import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categories.controller.js";

const router = Router({ mergeParams: true }); // mergeParams para leer :storeId desde parent

import { requireAuth } from "../../middleware/auth.js";

router.get("/", getCategories);
router.post("/", requireAuth, createCategory);
router.put("/:categoryId", requireAuth,  updateCategory);
router.delete("/:categoryId",  requireAuth,  deleteCategory);

export default router;