import { execSync } from "child_process";
import prisma from "../../config/db.js";
import { createStoreSchema, updateStoreSchema } from "./store.validation.js";
import { createDatabaseForStore } from "../../utils/createDatabase.js";
import getPrismaClientForStore from "../../utils/database.js";
import OpenAI from "openai";
import { deleteStoreDatabase } from "./store.service.js";
import multer from "multer";
import path from "path";
import fs from "fs";
// configurar multer para logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "public", "uploads", "logos");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(png|jpe?g|gif|webp|svg)$/i;
    cb(null, allowed.test(file.originalname));
  }
});
export const uploadLogo = upload.single("logo");
// =========================
// Helper para generar DB
// =========================
const generateDBName = (storeName) =>
  "store_" + storeName.toLowerCase().replace(/\s+/g, "_");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Helper: obtener id y role del usuario desde req (req.user, req.userPayload o token JWT sin verificar)
 */
function getUserInfoFromReq(req) {
  const payload = req.user || req.userPayload;
  if (payload) {
    return {
      id: payload.sub || payload.id || payload.userId || payload.uid || null,
      email: payload.email || null,
      role: payload.role || (payload.roles && payload.roles[0]) || null
    };
  }

  const auth = req.headers?.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const raw = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
        return {
          id: decoded.sub || decoded.id || decoded.userId || decoded.uid || null,
          email: decoded.email || null,
          role: decoded.role || (decoded.roles && decoded.roles[0]) || null
        };
      }
    } catch (e) {
      // ignore
    }
  }
  return { id: null, email: null, role: null };
}

function isProbablyId(val) {
  if (!val) return false;
  // si contiene @ es muy probablemente un email
  if (typeof val !== "string") return true;
  if (val.includes("@")) return false;
  // UUID / numeric / short id heurística
  return /^[0-9a-fA-F-]{4,}$/.test(val) || /^\d+$/.test(val);
}

/* GET /api/stores -> tiendas del usuario (o todas si es admin) */
export async function getStores(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id && !user.email) return res.status(401).json({ message: "No autorizado" });

    const isAdmin = (user.role || "").toString().toLowerCase() === "admin";

    if (isAdmin) {
      const stores = await prisma.store.findMany();
      return res.json(stores);
    }

    // Para evitar errores de validación de tipos en Prisma, obtenemos y filtramos en memoria
    const all = await prisma.store.findMany();

    const filtered = all.filter(store => {
      // comparaciones seguras usando toString cuando exista
      const matchesId = user.id && (
        (store.ownerId && store.ownerId.toString() === user.id.toString()) ||
        (store.userId && store.userId.toString() === user.id.toString()) ||
        (store.createdBy && store.createdBy.toString() === user.id.toString())
      );

      const matchesEmail = user.email && (
        (store.ownerEmail && store.ownerEmail === user.email) ||
        (store.createdByEmail && store.createdByEmail === user.email)
      );

      return Boolean(matchesId || matchesEmail);
    });

    return res.json(filtered);
  } catch (err) {
    console.error("[store.getStores]", err);
    return res.status(500).json({ message: "Error listando tiendas" });
  }
}

/* GET /api/stores/:id -> sólo owner o admin */
export async function getStoreById(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id && !user.email) return res.status(401).json({ message: "No autorizado" });

    const store = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });

    const isOwner = (user.id && [store.ownerId, store.userId, store.createdBy].some(x => x && x.toString() === user.id.toString()))
      || (user.email && [store.ownerEmail, store.createdByEmail].some(x => x && x === user.email));

    const isAdmin = (user.role || "").toString().toLowerCase() === "admin";

    if (!isOwner && !isAdmin) return res.status(403).json({ message: "No tienes permiso para ver esta tienda" });

    return res.json(store);
  } catch (err) {
    console.error("[store.getStoreById]", err);
    return res.status(500).json({ message: "Error obteniendo tienda" });
  }
}

/* POST /api/stores -> crear y asignar owner desde token */
export async function createStore(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id && !user.email) return res.status(401).json({ message: "No autorizado" });

    const data = { ...req.body };
    // Asignar ownerId/userId/createdBy sólo si user.id parece un id (no un email)
    if (isProbablyId(user.id)) {
      if (!data.ownerId) data.ownerId = user.id;
      if (!data.userId) data.userId = user.id;
      if (!data.createdBy) data.createdBy = user.id;
    } else if (user.email) {
      // si schema tuviera campos de email (ownerEmail/createdByEmail) no los asignamos automáticamente
      // para evitar errores; el frontend/cliente debería enviar el campo correcto si es necesario.
      console.warn("[store.createStore] user id parece email, no asignando ownerId automáticamente.");
    }

    const store = await prisma.store.create({ data });
    return res.status(201).json(store);
  } catch (err) {
    console.error("[store.createStore]", err);
    return res.status(500).json({ message: "Error creando tienda" });
  }
}

/* PUT /api/stores/:id -> sólo owner o admin puede editar */
export async function updateStore(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id && !user.email) return res.status(401).json({ message: "No autorizado" });

    const store = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });

    const isOwner = (user.id && [store.ownerId, store.userId, store.createdBy].some(x => x && x.toString() === user.id.toString()))
      || (user.email && [store.ownerEmail, store.createdByEmail].some(x => x && x === user.email));

    const isAdmin = (user.role || "").toString().toLowerCase() === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "No tienes permiso para editar esta tienda" });

    // Soportar actualización de logo por file upload (req.file) o por campo logoUrl en body
    // Soportar actualización de logo por file upload (req.file) o por campo logoUrl en body
    // Validar y sanitizar los campos permitidos usando updateStoreSchema
    const payload = { ...(req.body || {}) };
    if (req.file) {
      const publicPath = path.join("/uploads", "logos", req.file.filename).replace(/\\/g, "/");
      payload.logoUrl = publicPath;
    } else if (req.body.logoUrl) {
      payload.logoUrl = req.body.logoUrl;
    }

    // Aplicar validación Joi (solo extrae campos permitidos)
    const { value, error } = updateStoreSchema.validate(payload, { stripUnknown: true, convert: true });
    if (error) {
      console.warn("[store.updateStore] Validation failed:", error.details);
      return res.status(400).json({ message: "Datos inválidos", detail: error.details });
    }

    // Asegurar tipos (ownerId number, active boolean si vienen como strings)
    const updateData = { ...value };
    if (updateData.ownerId && typeof updateData.ownerId === "string") {
      const n = Number(updateData.ownerId);
      if (!Number.isNaN(n)) updateData.ownerId = n;
    }
    if (typeof updateData.active === "string") {
      updateData.active = updateData.active === "true" || updateData.active === "1";
    }

    try {
      const updated = await prisma.store.update({ where: { id: req.params.id }, data: updateData });
      return res.json(updated);
    } catch (e) {
      console.error("[store.updateStore] prisma.update error:", e);
      // si falla la actualización, propagar mensaje claro al cliente
      return res.status(500).json({ message: "Error actualizando tienda (BD)", detail: e.message });
    }
  } catch (err) {
    console.error("[store.updateStore]", err);
    return res.status(500).json({ message: "Error actualizando tienda" });
  }
}

/* DELETE /api/stores/:id -> sólo owner o admin puede borrar */
export async function deleteStore(req, res) {
  try {
    const user = getUserInfoFromReq(req);
    if (!user.id && !user.email) return res.status(401).json({ message: "No autorizado" });

    const store = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });

    const isOwner = (user.id && [store.ownerId, store.userId, store.createdBy].some(x => x && x.toString() === user.id.toString()))
      || (user.email && [store.ownerEmail, store.createdByEmail].some(x => x && x === user.email));

    const isAdmin = (user.role || "").toString().toLowerCase() === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "No tienes permiso para borrar esta tienda" });

    await prisma.store.delete({ where: { id: req.params.id } });
    return res.json({ message: "Tienda eliminada" });
  } catch (err) {
    console.error("[store.deleteStore]", err);
    return res.status(500).json({ message: "Error eliminando tienda" });
  }
}

// =========================
// GET STORE PUBLIC + PRODUCTS FROM TENANT DB
// =========================
export const getStorePublic = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id }
    });

    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });

    const tenant = getPrismaClientForStore(store.dbName);

    const products = await tenant.product.findMany({
      include: { category: true }, // incluir categoría en la vista pública
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      ...store,
      products
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo tienda" });
  }
};

// =========================
// GET ONLY PRODUCTS (PUBLIC) FROM TENANT DB
// =========================
export async function getStoreProductsPublic(req, res) {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });

    const tenant = getPrismaClientForStore(store.dbName);

    const products = await tenant.product.findMany({
      include: { category: true }, // asegurar que devuelva la relación
      orderBy: { createdAt: "desc" },
    });

    return res.json(products);

  } catch (error) {
    console.error("Error obteniendo productos públicos", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// =========================
// GENERATE STORE STYLE WITH OPENAI
// =========================
export const generateStoreStyle = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id }
    });

    if (!store) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const prompt = `
      Genera un archivo CSS visual hermoso, moderno y profesional
      para una tienda llamada "${store.name}". 
      Sin comentarios. Solo CSS puro.
    `;

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: prompt
    });

    const css =
      response.output_text ||
      response.output[0]?.content?.[0]?.text ||
      "/* No se pudo generar estilo */";

    await prisma.store.update({
      where: { id },
      data: { style: css }
    });

    return res.json({
      message: "Estilo generado correctamente",
      style: css
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando estilos de tienda" });
  }
};

// =========================
// GET PUBLIC PRODUCTS (PUBLIC) FROM TENANT DB
// =========================
export const getPublicProducts = async (req, res) => {
  const { storeId } = req.params;
  try {
    const store = await checkStore(storeId);
    if (!store) return res.status(404).json({ error: "La tienda no existe" });

    const tenantDB = getPrismaClientForStore(store.dbName);

    // Asegurarse de incluir la relación category para la vista pública
    const products = await tenantDB.product.findMany({
      include: { category: true }, // <-- agregar aquí
      where: { published: true }, // ejemplo si filtras por publicados
      orderBy: { createdAt: "desc" },
    });

    return res.json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener productos públicos", detail: err.message });
  }
};
