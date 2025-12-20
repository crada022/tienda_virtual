// src/modules/ai/ai.service.js
import OpenAI from "openai";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

/**
 * Genera una plantilla de tienda basada en un prompt.
 * Devuelve datos NORMALIZADOS y SEGUROS para backend.
 */
export async function generateStoreTemplate(prompt) {
const instruction = `
You are an expert ecommerce storefront designer.

Your job is to design a UNIQUE visual identity for an online store
based on the user's description.

Return STRICT JSON only.
NO explanations.
NO markdown.
NO comments.

Each store design MUST feel different.
Avoid generic or repeated designs.

Schema:
{
  "name": string,
  "description": string,

  "colorTheme": string[], 
  // array of 2 HEX colors: [primary, secondary]

  "layoutType": "hero" | "grid" | "catalog" | "minimal",

  "banner": {
    "title": string,
    "subtitle": string,
    "imagePrompt": string
  },

  "style": string | null,

  "products": [
    {
      "name": string,
      "description": string,
      "price": number
    }
  ]
}

Rules:
- colorTheme must contain exactly 2 valid HEX colors
- Choose colors creatively according to the store description
- layoutType must match the business type
- banner.imagePrompt must describe a realistic ecommerce hero image
- Do NOT include URLs
- Max 5 products
- Prices must be realistic
- The result must NOT feel generic or repeated
- Prefer modern, clean and commercial designs

User store description:
${prompt}
`;


  const response = await openai.responses.create({
    model: MODEL,
    input: instruction,
    temperature: 0.7,
    max_output_tokens: 1200
  });

  const raw =
    response.output_text ||
    response.output?.[0]?.content?.[0]?.text ||
    "";

  /**
   * Limpieza defensiva
   */
  const cleaned = raw
    .trim()
    .replace(/^```json/i, "")
    .replace(/```$/i, "")
    .replace(/\n/g, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("AI RAW RESPONSE:", raw);
    throw new Error("Invalid JSON from AI");
  }

  /**
   * Normalización final (backend manda)
   */
  return {
    name: parsed.name || "Tienda generada con IA",
    description: parsed.description || "Descripción generada automáticamente",
    bannerUrl: null, // backend decide
    colorTheme: Array.isArray(parsed.colorTheme)
      ? parsed.colorTheme.slice(0, 2)
      : ["#0f172a", "#f97316"],
    layoutType: ["hero", "grid", "catalog", "minimal"].includes(parsed.layoutType)
      ? parsed.layoutType
      : "grid",
    style: typeof parsed.style === "string" ? parsed.style : null,
    products: Array.isArray(parsed.products)
      ? parsed.products.slice(0, 5).map(p => ({
          name: p.name || "Producto",
          description: p.description || "",
          price: typeof p.price === "number" ? p.price : 0,
          imageUrl: null,     // backend asigna
          published: false    // 👈 MUY IMPORTANTE
        }))
      : []
  };
}

