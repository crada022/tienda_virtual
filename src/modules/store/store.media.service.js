import cloudinary from "../../config/cloudinary.js";

export async function uploadBannerToCloudinary(file, storeId) {
  const res = await cloudinary.uploader.upload(file, {
    folder: `stores/${storeId}/banner`,
    overwrite: true,
    resource_type: "image"
  });

  return res.secure_url; // 🔑 URL REAL
}
