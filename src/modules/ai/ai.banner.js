import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateBannerImage(imagePrompt) {
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: imagePrompt,
    size: "1792x1024" // formato hero banner
  });

  const base64 = result.data[0].b64_json;
  const buffer = Buffer.from(base64, "base64");

  return buffer; // imagen lista para subir
}
