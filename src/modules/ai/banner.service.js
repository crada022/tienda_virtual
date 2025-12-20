import cloudinary from "../../config/cloudinary.js";
import { generateBannerImage } from "./ai.images.js";

/**
 * Genera banner con IA y lo sube a Cloudinary
 * Devuelve la URL pública
 */
export async function generateAndUploadBanner(imagePrompt, storeId) {
  const imageBuffer = await generateBannerImage(imagePrompt);

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "store-banners",
        public_id: `banner_${storeId}`,
        overwrite: true,
        resource_type: "image"
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(imageBuffer);
  });

  return uploadResult.secure_url;
}
