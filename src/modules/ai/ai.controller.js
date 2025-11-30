// src/modules/ai/ai.controller.js
import { generateStoreTemplate } from './ai.service.js';

// Controlador para crear la tienda desde una plantilla generada por IA
export const createAIStore = async (req, res) => {
  const { prompt } = req.body;  // Desestructuramos el prompt del request

  try {
    // Genera la plantilla de la tienda usando la IA
    const storeTemplate = await generateStoreTemplate(prompt);

    // Aquí podríamos guardar la tienda en la base de datos si lo deseamos
    // Por ejemplo:
    // const newStore = new Store(storeTemplate);
    // await newStore.save();

    res.status(200).json(storeTemplate); // Enviar la plantilla generada al frontend
  } catch (error) {
    console.error("Error al crear la tienda:", error);
    res.status(500).json({ error: "Error al crear la tienda" });
  }
};
