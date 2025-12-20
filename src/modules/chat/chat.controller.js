// src/modules/chat/chat.controller.js

import { buildStoreContext, askOpenAI } from "./chat.service.js";

/**
 * POST /api/stores/:storeId/chat
 * Público (clientes) o privado según configuración de la tienda
 */
export const postChat = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { messages, message } = req.body;

    // 1️⃣ Construir contexto IA de la tienda
    const ctx = await buildStoreContext(storeId);
    if (!ctx) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }

    // 2️⃣ Normalizar mensajes usuario
    let userMessages = [];

    if (Array.isArray(messages)) {
      userMessages = messages
        .filter(m => m?.role && typeof m.content === "string")
        .slice(-10); // 🔥 límite de historial
    } else if (typeof message === "string" && message.trim()) {
      userMessages = [{ role: "user", content: message.trim() }];
    } else {
      return res.status(400).json({ error: "Mensaje requerido" });
    }

    // 3️⃣ Mensajes finales enviados a OpenAI
    const finalMessages = [
      { role: "system", content: ctx.system },
      ...userMessages
    ];

    // 4️⃣ Llamada IA
    const reply = await askOpenAI(finalMessages);

    return res.json({
      reply,
      store: {
        id: storeId,
        name: ctx.storeName
      }
    });
  } catch (err) {
    console.error("[postChat]", err);
    return res.status(500).json({
      error: "Error en chat IA",
      detail: err.message
    });
  }
};
