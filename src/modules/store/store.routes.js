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
import { createAIStore } from "../ai/ai.controller.js";
import express from "express";
import * as storeController from "./store.controller.js";
import { uploadLogo } from "./store.controller.js"; // ya exportado en controller

const router = Router();
// Proteger creación IA: requiere token válido
router.post("/create/ai", requireAuth, createAIStore);

// 🔓 RUTAS PÚBLICAS (primero)
router.get("/public/:id", getStorePublic);
router.get("/public/:id/products", getStoreProductsPublic);

// ⭐ NUEVA RUTA PARA GENERAR ESTILO DINÁMICO CON OPENAI
router.post("/public/:id/generate-style", generateStoreStyle);

// 🔐 RUTAS PRIVADAS
router.post("/", requireAuth, createStore);
router.get("/", requireAuth, getStores);
router.get("/:id", requireAuth, getStoreById);
router.put("/:id", uploadLogo, storeController.updateStore);
router.delete("/:id", requireAuth, deleteStore);

export default router;
