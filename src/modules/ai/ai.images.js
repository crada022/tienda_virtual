import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Genera una imagen real a partir de un prompt
 * Devuelve un Buffer listo para subir
 */
export async function generateBannerImage(imagePrompt) {
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: imagePrompt,
    size: "1792x1024" // hero banner
  });

  const base64Image = result.data[0].b64_json;
  return Buffer.from(base64Image, "base64");
}
