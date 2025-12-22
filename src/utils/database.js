// src/utils/database.js
import { platformPrisma } from "../config/db.js";
import { PrismaClient } from "../prisma/tenant/index.js";

const clients = {};

export async function getPrismaClientForStore(storeId) {
  if (!storeId) throw new Error("storeId requerido");

  // 1️⃣ Buscar tienda en PLATFORM
  const store = await platformPrisma.store.findUnique({
    where: { id: storeId }
  });

  if (!store) throw new Error("Tienda no encontrada");
  if (!store.dbName) throw new Error("Tienda sin dbName");

  // 2️⃣ Cachear Prisma TENANT
  if (!clients[store.dbName]) {
    const url = `postgresql://postgres:admin@localhost:5432/${store.dbName}?schema=public`;

    clients[store.dbName] = new PrismaClient({
      datasources: {
        db: { url }
      }
    });

    console.log("[Tenant Prisma URL]", url);
  }

  return clients[store.dbName];
}
