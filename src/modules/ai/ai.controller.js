// src/modules/ai/ai.controller.js
import { generateStoreTemplate } from "./ai.service.js";
import { platformPrisma, createTenantPrisma } from "../../config/db.js";
import { createDatabaseForStore } from "../../utils/createDatabase.js";
import { extractUserFromHeader } from "../auth/auth.middleware.js";

/**
 * Genera nombre válido de DB
 */
const generateDBName = (storeName) =>
  "store_" +
  storeName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

/**
 * Normaliza respuesta de IA
 */
function normalizeTemplate(tpl) {
  if (tpl && typeof tpl === "object") {
    return {
      name: tpl.name || null,
      description: tpl.description || tpl.shortDescription || null,
      bannerUrl: tpl.bannerUrl || null,
      colorTheme: Array.isArray(tpl.colorTheme) ? tpl.colorTheme : null,
      layoutType: tpl.layoutType || null,
      style: tpl.style || null,
      content: tpl.longDescription || tpl.content || null,
      products: Array.isArray(tpl.products) ? tpl.products : []
    };
  }

  if (typeof tpl === "string") {
    try {
      return normalizeTemplate(JSON.parse(tpl));
    } catch {
      return {
        name: null,
        description: tpl.slice(0, 300),
        bannerUrl: null,
        colorTheme: null,
        layoutType: null,
        style: null,
        content: tpl,
        products: []
      };
    }
  }

  return {};
}

/**
 * =========================
 * CREAR TIENDA CON IA (Platform + Tenant)
 * =========================
 */
export const createAIStore = async (req, res) => {
  const { prompt } = req.body;

  const user = req.userPayload || req.user || extractUserFromHeader(req);
  const userId = user?.sub || user?.id;
  const role = user?.role;

  if (!userId) return res.status(401).json({ error: "No autorizado" });
  if (role !== "ADMIN")
    return res.status(403).json({ error: "Solo usuarios ADMIN pueden crear tiendas" });
  if (!prompt || typeof prompt !== "string")
    return res.status(400).json({ error: "Prompt requerido" });

  try {
    // 1️⃣ Generar template con IA
    const tplRaw = await generateStoreTemplate(prompt);
    const tpl = normalizeTemplate(tplRaw);

    const storeName = tpl.name || `Tienda IA ${Date.now()}`;
    const description = tpl.description || tpl.content?.slice(0, 500) || null;

    // 2️⃣ Generar dbName único
    let baseDb = generateDBName(storeName);
    let dbName = baseDb;
    let i = 1;
    while (await platformPrisma.store.findUnique({ where: { dbName } })) {
      dbName = `${baseDb}_${i++}`;
    }

    // 3️⃣ Validar usuario ADMIN
    const existingUser = await platformPrisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(400).json({ error: "Usuario ADMIN no encontrado en la base de datos" });
    }

    // 4️⃣ Crear tienda en Platform (solo metadata)
    const store = await platformPrisma.store.create({
      data: {
        name: storeName,
        description,
        bannerUrl: tpl.bannerUrl || null,
        colorTheme: tpl.colorTheme ? JSON.stringify(tpl.colorTheme) : null,
        layoutType: tpl.layoutType || null,
        style: tpl.style || null,
        dbName,
        ownerId: userId,
        active: true
      }
    });

    // 5️⃣ Crear base tenant + migraciones
    await createDatabaseForStore(dbName);

    // 6️⃣ Conectarse al cliente tenant usando el schema tenant
    const tenantPrisma = createTenantPrisma(dbName);
    await tenantPrisma.$connect();
    console.log(`[Tenant Prisma URL] Conectado a: ${dbName}`);

    // ⚠ Eliminamos toda la creación de productos con IA

    return res.status(201).json({
      message: "Tienda creada con IA y base tenant configurada",
      store
    });

  } catch (err) {
    console.error("[AI CREATE STORE]", err);
    return res.status(500).json({
      error: "Error creando tienda con IA",
      detail: err.message
    });
  }
};
