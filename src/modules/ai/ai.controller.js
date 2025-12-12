// src/modules/ai/ai.controller.js
import { generateStoreTemplate } from "./ai.service.js";
import prisma from "../../config/db.js";
import { createDatabaseForStore } from "../../utils/createDatabase.js";
import { extractUserFromHeader } from "../auth/auth.middleware.js";

const generateDBName = (storeName) =>
  "store_" + storeName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

// Helper: intenta convertir respuesta IA en objeto estructurado
function normalizeTemplate(tpl) {
  // si ya es objeto, devolver campos mínimos
  if (tpl && typeof tpl === "object") {
    return {
      name: tpl.name || null,
      description: tpl.description || tpl.shortDescription || null,
      bannerUrl: tpl.bannerUrl || null,
      colorTheme: tpl.colorTheme || null,
      layoutType: tpl.layoutType || null,
      style: tpl.style || null,
      content: tpl.longDescription || tpl.content || null
    };
  }

  // si es string, intentar parsear JSON
  if (typeof tpl === "string") {
    try {
      const parsed = JSON.parse(tpl);
      if (parsed && typeof parsed === "object") {
        return normalizeTemplate(parsed);
      }
    } catch (e) {
      // no es JSON -> extraer partes del texto
      const text = tpl.trim();
      const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      const nameCandidate = paragraphs[0] && paragraphs[0].length < 60 ? paragraphs[0] : null;
      const short = paragraphs[0] || text.slice(0, 200);
      const long = text;
      return {
        name: nameCandidate,
        description: short,
        bannerUrl: null,
        colorTheme: null,
        layoutType: null,
        style: null,
        content: long
      };
    }
  }

  return {
    name: null,
    description: null,
    bannerUrl: null,
    colorTheme: null,
    layoutType: null,
    style: null,
    content: null
  };
}

export const createAIStore = async (req, res) => {
  const { prompt } = req.body;
  // obtener usuario desde middleware (req.userPayload), req.user o fallback a header (decode)
  const user = req.userPayload || req.user || extractUserFromHeader(req);
  const userId = user?.sub || user?.id || null;

  if (!userId) return res.status(401).json({ error: "No autorizado" });
  if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "prompt es requerido" });

  try {
    const tplRaw = await generateStoreTemplate(prompt);
    const tpl = normalizeTemplate(tplRaw);

    // asegurar nombre/descripcion por defecto
    const suggestedName = tpl.name || `Tienda IA ${Date.now()}`;
    const suggestedDescription = tpl.description || (tpl.content ? tpl.content.slice(0, 800) : null);

    // Generar dbName único (si existe, le agregamos sufijo)
    let baseDb = generateDBName(suggestedName || "store");
    let dbName = baseDb;
    let counter = 1;
    while (await prisma.store.findUnique({ where: { dbName } })) {
      dbName = `${baseDb}_${counter++}`;
    }

    // Crear el registro global
    const store = await prisma.store.create({
      data: {
        name: suggestedName,
        description: suggestedDescription,
        bannerUrl: tpl.bannerUrl,
        colorTheme: tpl.colorTheme,
        layoutType: tpl.layoutType,
        style: tpl.style,
        dbName,
        ownerId: userId
      }
    });

    // Crear tenant DB (migrations / seed si corresponde)
    await createDatabaseForStore(dbName);

    // Opcional: si template trae productos en tpl.content/parsed.products, los podrías insertar en tenant aquí.
    return res.status(201).json({ message: "Tienda creada con IA", store });
  } catch (err) {
    console.error("AI store error:", err);
    return res.status(500).json({ error: "Error creando tienda con IA", detail: err.message });
  }
};
