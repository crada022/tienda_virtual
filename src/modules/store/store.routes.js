import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
  getStorePublic,
  getStoreProductsPublic,
  generateStoreStyle // <-- IMPORTANTE
} from "./store.controller.js";

const router = Router();

// 🔓 RUTAS PÚBLICAS (primero)
router.get("/public/:id", getStorePublic);
router.get("/public/:id/products", getStoreProductsPublic);

// ⭐ NUEVA RUTA PARA GENERAR ESTILO DINÁMICO CON OPENAI
router.post("/public/:id/generate-style", generateStoreStyle);

// 🔐 RUTAS PRIVADAS
router.post("/", requireAuth, createStore);
router.get("/", requireAuth, getStores);
router.get("/:id", requireAuth, getStoreById);
router.put("/:id", requireAuth, updateStore);
router.delete("/:id", requireAuth, deleteStore);

export default router;
