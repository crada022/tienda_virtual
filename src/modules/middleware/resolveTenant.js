import { platformPrisma } from "../../prisma/platform.js";
import { getTenantPrisma } from "../../prisma/tenant.js";

export const resolveTenant = async (req, res, next) => {
  try {
    const storeId = req.headers["x-store-id"] || req.params.storeId || req.query.storeId;
    const domain = req.headers["x-store-domain"] || req.query.domain;

    if (!storeId && !domain) {
      return res.status(400).json({ error: "storeId or domain required" });
    }

    const store = await platformPrisma.store.findFirst({
      where: storeId ? { id: storeId } : { domain },
    });

    if (!store) return res.status(404).json({ error: "Store not found" });
    if (!store.dbName) return res.status(500).json({ error: "Store dbName is missing" });

    const tenantPrefix = process.env.TENANT_DB_PREFIX;
    if (!tenantPrefix) return res.status(500).json({ error: "TENANT_DB_PREFIX missing in .env" });

    const tenantDbUrl = tenantPrefix.endsWith("/")
      ? tenantPrefix + store.dbName
      : tenantPrefix + "/" + store.dbName;

    console.log(`[resolveTenant] tenantDbUrl: ${tenantDbUrl}`);

    req.tenantPrisma = getTenantPrisma(tenantDbUrl);
    req.store = store;

    next();
  } catch (error) {
    console.error("[resolveTenant] error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
