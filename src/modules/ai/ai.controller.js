import { generateStoreTemplate } from "./ai.service.js";
import { platformPrisma } from "../../config/db.js";
import { createDatabaseForStore } from "../../utils/createDatabase.js";
import { extractUserFromHeader } from "../auth/auth.middleware.js";
import { slugify } from "../../utils/slugify.js";

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
      description: tpl.description || null,
      bannerUrl: tpl.bannerUrl || null,
      colorTheme: Array.isArray(tpl.colorTheme) ? tpl.colorTheme : null,
      layoutType: tpl.layoutType || null,
      style: tpl.style || null,
      content: tpl.content || null
    };
  }
  return {};
}

/**
 * =========================
 * CREAR TIENDA CON IA
 * =========================
 */
export const createAIStore = async (req, res) => {
  const { prompt, domain } = req.body;

  const user = req.userPayload || extractUserFromHeader(req);
  const userId = user?.sub || user?.id;
  const role = user?.role;

  if (!userId) return res.status(401).json({ error: "No autorizado" });
  if (role !== "ADMIN")
    return res.status(403).json({ error: "Solo ADMIN puede crear tiendas" });

  if (!prompt) return res.status(400).json({ error: "Prompt requerido" });
  if (!domain) return res.status(400).json({ error: "El dominio es obligatorio" });

  const cleanDomain = domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  try {
    // 1️⃣ dominio único
    const domainExists = await platformPrisma.store.findUnique({
      where: { domain: cleanDomain }
    });

    if (domainExists) {
      return res.status(400).json({ error: "Dominio ya en uso" });
    }

    // 2️⃣ IA
    const tplRaw = await generateStoreTemplate(prompt);
    const tpl = normalizeTemplate(tplRaw);

    const storeName = tpl.name || `Tienda IA ${Date.now()}`;
    const description = tpl.description || null;

    // 3️⃣ slug único
    const baseSlug = slugify(storeName);
    let slug = baseSlug;
    let i = 1;

    while (await platformPrisma.store.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    // 4️⃣ dbName único
    const baseDb = generateDBName(storeName);
    let dbName = baseDb;
    let j = 1;

    while (await platformPrisma.store.findUnique({ where: { dbName } })) {
      dbName = `${baseDb}_${j++}`;
    }

    // 5️⃣ crear tienda
    const store = await platformPrisma.store.create({
      data: {
        name: storeName,
        slug,
        domain: cleanDomain,
        description,
        bannerUrl: tpl.bannerUrl || null,
        colorTheme: tpl.colorTheme
          ? JSON.stringify(tpl.colorTheme)
          : null,
        layoutType: tpl.layoutType || null,
        style: tpl.style || null,
        dbName,
        ownerId: userId,
        active: true
      }
    });

    // 6️⃣ crear DB tenant
    await createDatabaseForStore(dbName);

    return res.status(201).json({
      message: "Tienda creada con IA",
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
