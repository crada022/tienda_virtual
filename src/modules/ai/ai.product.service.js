import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Función para generar productos con IA
export const generateProductsAI = async (prompt, count = 1) => {
  try {
    // Llamada a OpenAI para generar productos
    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: "Genera productos para una tienda online." },
        { role: "user", content: `Genera ${count} productos para la tienda basada en: ${prompt}` },
      ]
    });

    const products = JSON.parse(completion.choices[0].message.content).products;

    // Generar imágenes para productos y subir a Cloudinary
    const enrichedProducts = [];

    for (const product of products) {
      const image = await openai.images.generate({
        model: "gpt-image-1",
        size: "1024x1024",
        prompt: `Fotografía de un producto de ecommerce: ${product.name} — ${product.description}`,
      });

      const base64 = image.data[0].b64_json;

      // Subir imagen a Cloudinary
      const upload = await cloudinary.uploader.upload(
        `data:image/png;base64,${base64}`,
        { folder: "ai-products" }
      );

      enrichedProducts.push({
        ...product,
        image: upload.secure_url,
      });
    }

    return enrichedProducts;
  } catch (error) {
    console.error("Error generando productos:", error);
    throw new Error("No se pudieron generar los productos con IA");
  }
};
