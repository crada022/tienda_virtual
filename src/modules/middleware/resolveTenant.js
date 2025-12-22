import { platformPrisma } from "../../config/db.js";

export async function resolveStore(req, res, next) {
  try {
    console.log("🔎 resolveStore URL:", req.originalUrl);
console.log("🔎 params:", req.params);
    console.log("HOST:", req.headers.host);
console.log("SLUG:", req.params?.slug);
console.log("STOREID:", req.params?.storeId);
    let store = null;

    // 1️⃣ Por dominio (producción)
    const host = req.headers.host;
    if (host && !host.includes("localhost")) {
      store = await platformPrisma.store.findUnique({
        where: { domain: host }
      });
    }

    // 2️⃣ Por slug (desarrollo / SPA)
    if (!store && req.params?.slug) {
      store = await platformPrisma.store.findUnique({
        where: { slug: req.params.slug }
      });
    }

    // 3️⃣ Por storeId (fallback)
    if (!store && req.params?.storeId) {
      store = await platformPrisma.store.findUnique({
        where: { id: req.params.storeId }
      });
    }

    if (!store) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }

    /**
     * 🔥 NORMALIZAR STORE PARA TENANT
     * No pasar el modelo crudo
     */
    req.store = {
      id: store.id,
      name: store.name,
      slug: store.slug,
      domain: store.domain,
      dbName: store.dbName, // 🔑 CLAVE ABSOLUTA
      // opcional: dbUrl si lo tienes
      // dbUrl: store.dbUrl
    };

    if (!req.store.dbName) {
      throw new Error("Store dbName is missing");
    }

    next();
  } catch (err) {
    console.error("[resolveStore]", err);
    return res.status(500).json({ error: err.message });
  }
}
