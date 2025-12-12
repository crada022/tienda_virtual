// src/modules/ai/ai.routes.js
import { Router } from "express";
import { createAIStore } from "./ai.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";

const router = Router();

// Crear tienda con IA (usuario debe estar autenticado)
router.post("/create-store", authMiddleware, createAIStore);

export default router;
