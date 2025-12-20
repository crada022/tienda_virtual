import { platformPrisma } from "../../prisma/platform.js";
import getPrismaClientForStore from "../../utils/database.js";
import { createDatabaseForStore } from "../../utils/createDatabase.js";
import { updateStoreSchema } from "./store.validation.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadBannerToCloudinary } from "./store.media.service.js";

/* 🤖 IA */
import { generateStoreTemplate } from "../ai/ai.service.js";
import { generateAndUploadBanner } from "../ai/banner.service.js";

/* =========================
   MULTER – LOGO / BANNER MANUAL
========================= */
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "public", "uploads", "logos");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(png|jpe?g|gif|webp|svg)$/i;
    cb(null, allowed.test(file.originalname));
  }
});

export const uploadLogo = upload.single("logo");

/* =========================
   HELPERS
========================= */
const generateDBName = (storeName) =>
  "store_" + storeName.toLowerCase().replace(/\s+/g, "_");

function getUserInfoFromReq(req) {
  const payload = req.user || req.userPayload;
  if (!payload) return { id: null, role: null };

  return {
    id: payload.id || payload.sub,
    role: payload.role
  };
}

/* =========================
   GET STORES (OWNER)
========================= */
export async function getStores(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id) return res.status(401).json({ message: "No autorizado" });

    const stores = await platformPrisma.store.findMany({
      where: { ownerId: user.id }
    });

    res.json(stores);
  } catch (err) {
    console.error("[getStores]", err);
    res.status(500).json({ message: "Error listando tiendas" });
  }
}

/* =========================
   GET STORE BY ID
========================= */
export async function getStoreById(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id) return res.status(401).json({ message: "No autorizado" });

    const store = await platformPrisma.store.findUnique({
      where: { id: req.params.id }
    });

    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });

    if (store.ownerId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ message: "No autorizado" });
    }

    res.json(store);
  } catch (err) {
    console.error("[getStoreById]", err);
    res.status(500).json({ message: "Error obteniendo tienda" });
  }
}

/* =========================
   CREATE STORE (BÁSICO)
========================= */
export async function createStore(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id) return res.status(401).json({ message: "No autorizado" });

    const dbName = generateDBName(req.body.name);

    const store = await platformPrisma.store.create({
      data: {
        ...req.body,
        ownerId: user.id,
        dbName
      }
    });

    await createDatabaseForStore(dbName);

    res.status(201).json(store);
  } catch (err) {
    console.error("[createStore]", err);
    res.status(500).json({ message: "Error creando tienda" });
  }
}

/* =========================
   UPDATE STORE (MANUAL)
========================= */
export async function updateStore(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id) return res.status(401).json({ message: "No autorizado" });

    const store = await platformPrisma.store.findUnique({
      where: { id: req.params.id }
    });

    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });

    if (store.ownerId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ message: "No autorizado" });
    }

    const payload = { ...(req.body || {}) };

   if (req.file) {
  const bannerUrl = await uploadBannerToCloudinary(
    req.file.path,
    store.id
  );
  payload.bannerUrl = bannerUrl;
}


    const { value, error } = updateStoreSchema.validate(payload, {
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: "Datos inválidos", error });
    }

    const updated = await platformPrisma.store.update({
      where: { id: req.params.id },
      data: value
    });

    res.json(updated);
  } catch (err) {
    console.error("[updateStore]", err);
    res.status(500).json({ message: "Error actualizando tienda" });
  }
}

/* =========================
   DELETE STORE
========================= */
export async function deleteStore(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id) return res.status(401).json({ message: "No autorizado" });

    const store = await platformPrisma.store.findUnique({
      where: { id: req.params.id }
    });

    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });

    if (store.ownerId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ message: "No autorizado" });
    }

    await platformPrisma.store.delete({
      where: { id: req.params.id }
    });

    res.json({ message: "Tienda eliminada" });
  } catch (err) {
    console.error("[deleteStore]", err);
    res.status(500).json({ message: "Error eliminando tienda" });
  }
}

/* =========================
   PUBLIC STORE + PRODUCTS
========================= */
export async function getStorePublic(req, res) {
  try {
    const store = await platformPrisma.store.findUnique({
      where: { id: req.params.id }
    });

    if (!store || !store.active) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const tenant = getPrismaClientForStore(store.dbName);

    let products = [];
    try {
      products = await tenant.product.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" }
      });
    } catch {}

    res.json({ ...store, products });
  } catch (err) {
    console.error("[getStorePublic]", err);
    res.status(500).json({ message: "Error obteniendo tienda" });
  }
}

/* =========================
   🤖 AI – GENERATE FULL STORE DESIGN
========================= */
export async function generateStoreWithAI(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id) return res.status(401).json({ message: "No autorizado" });

    const store = await platformPrisma.store.findUnique({
      where: { id: req.params.id }
    });

    if (!store) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    // 1️⃣ Generar diseño con IA
    const template = await generateStoreTemplate(
      store.description || store.name
    );

    // 2️⃣ Generar banner real
    const bannerUrl = await generateAndUploadBanner(
      template.banner.imagePrompt,
      store.id
    );

    // 3️⃣ Guardar configuración
    const updated = await platformPrisma.store.update({
      where: { id: store.id },
      data: {
        name: template.name,
        description: template.description,
        bannerUrl,
        colorTheme: template.colorTheme,
        layoutType: template.layoutType,
        style: template.style
      }
    });

    res.json({
      message: "Diseño generado con IA",
      store: updated
    });
  } catch (err) {
    console.error("[generateStoreWithAI]", err);
    res.status(500).json({ message: "Error generando diseño con IA" });
  }
}
/* =========================
   PUBLIC PRODUCTS ONLY
========================= */
export async function getStoreProductsPublic(req, res) {
  try {
    const store = await platformPrisma.store.findUnique({
      where: { id: req.params.id }
    });

    if (!store || !store.active) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const tenant = getPrismaClientForStore(store.dbName);

    const products = await tenant.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" }
    });

    res.json(products);
  } catch (err) {
    console.error("[getStoreProductsPublic]", err);
    res.status(500).json({ message: "Error obteniendo productos" });
  }
}
