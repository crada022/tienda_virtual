import { platformPrisma } from "../../config/db.js";
import { getPrismaClientForStore } from "../../utils/database.js";
import { updateStoreSchema } from "./store.validation.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadBannerToCloudinary } from "./store.media.service.js";
import { getStoreFromRequest } from "../../utils/getStoreFromRequest.js";

/* 🤖 IA */
import { generateStoreTemplate } from "../ai/ai.service.js";
import { generateAndUploadBanner } from "../ai/banner.service.js";

/* =========================
   MULTER – LOGO / BANNER
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
    const { name, domain } = req.body;
    const user = getUserInfoFromReq(req);

    if (!domain) {
      return res.status(400).json({ error: "El dominio es obligatorio" });
    }

    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    const exists = await platformPrisma.store.findUnique({
      where: { domain: cleanDomain }
    });

    if (exists) {
      return res.status(400).json({ error: "Dominio ya en uso" });
    }

    const store = await platformPrisma.store.create({
      data: {
        name,
        domain: cleanDomain,
        ownerId: user.id
      }
    });

    res.status(201).json(store);
  } catch (err) {
    console.error("[createStore]", err);
    res.status(500).json({ message: "Error creando tienda" });
  }
}

/* =========================
   UPDATE STORE
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
      payload.bannerUrl = await uploadBannerToCloudinary(
        req.file.path,
        store.id
      );
    }

    const { value, error } = updateStoreSchema.validate(payload, {
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: "Datos inválidos", error });
    }

    const updated = await platformPrisma.store.update({
      where: { id: store.id },
      data: value
    });

    res.json(updated);
  } catch (err) {
    console.error("[updateStore]", err);
    res.status(500).json({ message: "Error actualizando tienda" });
  }
}

/* =========================
   PUBLIC STORE (SLUG / DOMAIN)
========================= */
export async function getStorePublic(req, res) {
  try {
    const store = await getStoreFromRequest(req);

    if (!store || !store.active) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    res.json(store);
  } catch (err) {
    console.error("[getStorePublic]", err);
    res.status(500).json({ message: "Error obteniendo tienda" });
  }
}

/* =========================
   PUBLIC PRODUCTS
========================= */
export async function getStoreProductsPublic(req, res) {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({ error: "storeId requerido" });
    }

    // 1️⃣ Buscar tienda en plataforma
    const store = await platformPrisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store || !store.active) {
      return res.status(404).json({ error: "Tienda no encontrada o inactiva" });
    }

    if (!store.dbName) {
      console.error("Store sin dbName:", store);
      return res.status(500).json({ error: "Tienda mal configurada (sin dbName)" });
    }

    // 2️⃣ Prisma del tenant
    const tenantDB = await getPrismaClientForStore(store.id);

    // 3️⃣ Productos
    const products = await tenantDB.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" }
    });

    return res.json(products);

  } catch (err) {
    console.error("[getStoreProductsPublic]", err);
    return res.status(500).json({ error: "Error obteniendo productos públicos" });
  }
}
/* =========================
   DELETE STORE
========================= */
export async function deleteStore(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const storeId = req.params.id;

    const store = await platformPrisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    // Solo dueño o ADMIN
    if (store.ownerId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ message: "No autorizado" });
    }

    /**
     * 🔒 Buenas prácticas:
     * En lugar de borrar físicamente:
     *  - se marca como inactive
     *  - se conserva la DB tenant
     */
    await platformPrisma.store.update({
      where: { id: storeId },
      data: { active: false }
    });

    res.json({
      message: "Tienda desactivada correctamente"
    });
  } catch (err) {
    console.error("[deleteStore]", err);
    res.status(500).json({
      message: "Error eliminando tienda"
    });
  }
}
