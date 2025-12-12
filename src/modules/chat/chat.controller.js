import { buildStoreContext, askOpenAI } from "./chat.service.js";

export const postChat = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { messages, message } = req.body;

    const ctx = await buildStoreContext(storeId);
    if (!ctx) return res.status(404).json({ error: "Tienda no encontrada" });

    const userMessages = Array.isArray(messages)
      ? messages
      : [{ role: "user", content: message ?? "" }];

    const finalMessages = [{ role: "system", content: ctx.system }, ...userMessages];

    const reply = await askOpenAI(finalMessages);
    res.json({ reply });
  } catch (err) {
    console.error("chat error", err);
    res.status(500).json({ error: "Error en chat", detail: err.message });
  }
};