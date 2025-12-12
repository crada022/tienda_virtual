// src/modules/ai/ai.service.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Genera una plantilla de tienda basada en el prompt/descripción.
 * Devuelve un objeto con: name, description, bannerUrl, colorTheme, layoutType, style, products[]
 */
export async function generateStoreTemplate(prompt) {
  const instruct = `
You are a storefront designer. Receive a user description and output STRICT JSON (no texto adicional).
JSON schema:
{
  "name": string,
  "description": string,
  "bannerUrl": string | null,
  "colorTheme": string | null,       // comma separated hex colors, e.g. "#0f172a,#f97316"
  "layoutType": string,               // "hero" | "grid" | "catalog" | "minimal"
  "style": string | null,             // optional CSS string or null
  "products": [
    { "name": string, "description": string, "price": number, "imageUrl": string }
  ]
}

User description:
${prompt}

IMPORTANT: Output STRICT JSON only (no explanations). If you cannot build a field, set it to null.
`;

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: instruct,
    max_output_tokens: 1200,
    temperature: 0 // reduce variabilidad para JSON consistente
  });

  const raw = response.output_text || response.output?.[0]?.content?.[0]?.text || "";

  // Limpiar posibles ```json ... ``` o texto extra
  const cleaned = raw.trim().replace(/^```json/, "").replace(/```$/, "");

  let data;
  try {
    // Intentar parsear
    const parsed = JSON.parse(cleaned);

    // Normalizar campos
    data = {
      name: parsed.name || "Tienda generada",
      description: parsed.description || "Descripción de tienda por defecto",
      bannerUrl: parsed.bannerUrl || "https://via.placeholder.com/1200x400.png?text=Tienda",
      colorTheme: parsed.colorTheme || "#0f172a,#f97316",
      layoutType: ["hero", "grid", "catalog", "minimal"].includes(parsed.layoutType)
        ? parsed.layoutType
        : "grid",
      style: parsed.style || null,
      products: Array.isArray(parsed.products)
        ? parsed.products.map(p => ({
            name: p.name || "Producto",
            description: p.description || "",
            price: typeof p.price === "number" ? p.price : 0,
            imageUrl: p.imageUrl || "https://via.placeholder.com/400x400.png?text=Producto"
          }))
        : []
    };

    return data;
  } catch (err) {
    throw new Error("Error parsing JSON from OpenAI: " + err.message + " — raw:" + raw.slice(0, 1000));
  }
}
