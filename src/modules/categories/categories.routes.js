import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categories.controller.js";

const router = Router({ mergeParams: true }); // mergeParams para leer :storeId desde parent

// Opcional: proteger rutas con middleware de autenticación si existe
// import requireAuth from '../../middlewares/requireAuth.js';

router.get("/", getCategories);
router.post("/", /* requireAuth, */ createCategory);
router.put("/:categoryId", /* requireAuth, */ updateCategory);
router.delete("/:categoryId", /* requireAuth, */ deleteCategory);

export default router;