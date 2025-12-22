import { platformPrisma } from "../../config/db.js";

export async function resolveStore(req, res, next) {
  try {
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

    // 🔥 inyectar tienda en request
    req.store = store;
    next();
  } catch (err) {
    console.error("[resolveStore]", err);
    return res.status(500).json({ error: "Error resolviendo tienda" });
  }
}
