// src/config/db.js
import { PrismaClient as PlatformPrismaClient } from '@prisma/client'; // generado desde platform.prisma
import { PrismaClient as TenantPrismaClient } from '@prisma/client';   // generado desde tenant.prisma
import dotenv from 'dotenv';

dotenv.config();

/**
 * =========================
 * Cliente Platform (global)
 * =========================
 * Para: usuarios, stores, roles, templates IA
 */
export const platformPrisma = new PlatformPrismaClient();

/**
 * =========================
 * Cliente Tenant (dinámico)
 * =========================
 * Para: cada tienda individual (productos, pedidos, clientes)
 * La conexión debe crearse dinámicamente con la DB de la tienda
 */
export function createTenantPrisma(dbName) {
  if (!dbName) throw new Error("Debe especificarse dbName para tenant Prisma");

  const url = `${process.env.TENANT_DB_PREFIX}${dbName}`;
  console.log("[Tenant Prisma URL]", url);

  return new TenantPrismaClient({
    datasources: { db: { url } }
  });
}


/**
 * Export default opcional para compatibilidad con imports antiguos
 */
export default platformPrisma;
