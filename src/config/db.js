// src/config/db.js
import dotenv from "dotenv";
import { PrismaClient as PlatformPrismaClient } from "../prisma/platform/index.js";
import { PrismaClient as TenantPrismaClient } from "../prisma/tenant/index.js";

dotenv.config();

/**
 * =========================
 * Cliente Platform
 * =========================
 */
export const platformPrisma = new PlatformPrismaClient();

/**
 * =========================
 * Cliente Tenant dinámico
 * =========================
 */
export function createTenantPrisma(dbName) {
  if (!dbName) throw new Error("Debe especificarse dbName");

  const url = `${process.env.TENANT_DB_PREFIX}${dbName}`;
  console.log("[Tenant Prisma URL]", url);

  return new TenantPrismaClient({
    datasources: {
      db: { url }
    }
  });
}

export default platformPrisma;
