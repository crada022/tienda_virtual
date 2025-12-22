// src/config/db.js
import dotenv from "dotenv";
import { PrismaClient as PlatformPrismaClient } from "../prisma/platform/index.js";

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

  return new PlatformPrismaClient({
    datasources: {
      db: { url }
    }
  });
}

export default platformPrisma;
