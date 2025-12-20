import { PrismaClient } from "../prisma/tenant/index.js";

// Cache de clientes por tenant
const tenantClients = new Map();

export const getTenantPrisma = (dbUrl) => {
  console.log("[getTenantPrisma] dbUrl recibido:", dbUrl);
  if (!dbUrl) throw new Error("dbUrl is undefined for tenant PrismaClient");

  if (tenantClients.has(dbUrl)) {
    return tenantClients.get(dbUrl);
  }

  const client = new PrismaClient({
    datasources: {
      db: { url: dbUrl }
    }
  });

  tenantClients.set(dbUrl, client);

  console.log(`[Tenant Prisma] Nueva instancia creada para: ${dbUrl}`);
  return client;
};
