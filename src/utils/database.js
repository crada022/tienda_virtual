// src/utils/database.js
import { PrismaClient } from "@prisma/client";

const clients = {};

// Crea un cliente de Prisma apuntando a la base de datos del tenant
export default function getPrismaClientForStore(dbName) {
  if (!dbName) throw new Error("dbName is required");

  // Evita crear el mismo cliente muchas veces
  if (!clients[dbName]) {
    const user = process.env.PGUSER || "postgres";
    const pass = process.env.PGPASSWORD || "admin";
    const host = process.env.PGHOST || "localhost";
    const port = process.env.PGPORT || 5432;
    const url = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${dbName}?schema=public`;

    clients[dbName] = new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
    });
  }

  return clients[dbName];
}
