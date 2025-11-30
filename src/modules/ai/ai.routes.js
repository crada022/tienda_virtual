// src/modules/ai/ai.routes.js
import express from 'express';
import { createAIStore } from './ai.controller.js';

const router = express.Router();

// Ruta para generar la tienda
router.post("/generate-store", createAIStore);

export default router;
