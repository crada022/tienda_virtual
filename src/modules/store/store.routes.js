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
  generateStoreWithAI,
  uploadLogo
} from "./store.controller.js";

import { createAIStore } from "../ai/ai.controller.js";

const router = Router();

/* =========================
   🤖 IA – CREAR TIENDA + DB
========================= */
router.post("/create/ai", requireAuth, createAIStore);

/* =========================
   🔓 RUTAS PÚBLICAS
========================= */
router.get("/public/:id", getStorePublic);
router.get("/public/:id/products", getStoreProductsPublic);

/* =========================
   🔐 RUTAS PRIVADAS (OWNER)
========================= */
router.post("/", requireAuth, createStore);
router.get("/", requireAuth, getStores);
router.get("/:id", requireAuth, getStoreById);
router.put("/:id", requireAuth, uploadLogo, updateStore);
router.delete("/:id", requireAuth, deleteStore);

/* =========================
   🤖 IA – GENERAR DISEÑO
========================= */
router.post("/:id/generate-ai", requireAuth, generateStoreWithAI);

export default router;
