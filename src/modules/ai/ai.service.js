// src/modules/ai/ai.service.js
import { OpenAI } from "openai";
import "dotenv/config";

// Inicializa OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función para generar plantilla de tienda
export const generateStoreTemplate = async (prompt) => {
  try {
    // Realizamos la llamada a la API de OpenAI para obtener la respuesta
    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: "Eres un experto en la creación de tiendas online. Tu tarea es generar una respuesta en formato JSON que describa la tienda y las plantillas." },
        { role: "user", content: `Genera una tienda online basada en: ${prompt}. Devuelve la respuesta en formato JSON.` },
      ],
    });

    // Obtener la respuesta de la IA
    let storeTemplate = completion.choices[0].message.content;

    // Verificamos que el contenido sea un JSON válido
    if (typeof storeTemplate === 'string') {
      try {
        // Limpiar posibles caracteres no deseados
        storeTemplate = storeTemplate.replace(/^¡.*\n|\n.*$/g, ''); // Eliminar cualquier encabezado o pie no deseado en la respuesta

        // Intentamos convertir el string en JSON
        storeTemplate = JSON.parse(storeTemplate);
      } catch (parseError) {
        console.error("Error al parsear la respuesta de AI:", parseError);
        throw new Error("La respuesta de AI no es un JSON válido.");
      }
    }

    return storeTemplate;
  } catch (error) {
    console.error("Error generando la tienda con IA:", error);
    throw new Error("No se pudo generar la tienda con IA");
  }
};
