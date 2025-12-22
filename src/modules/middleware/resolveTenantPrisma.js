import { createTenantPrisma } from "../../config/db.js";

export function resolveTenantPrisma(req, res, next) {
  try {
    if (!req.store?.dbName) {
      throw new Error("Tenant DB name not found in store");
    }

    req.tenantPrisma = createTenantPrisma(req.store.dbName);

    next();
  } catch (err) {
    console.error("[resolveTenantPrisma]", err.message);
    next(err);
  }
}
