// src/utils/database.js
import { PrismaClient } from "@prisma/client";

const clients = {};

// Crea un cliente de Prisma apuntando a la base de datos del tenant
export default function getPrismaClientForStore(dbName) {
  if (!dbName) throw new Error("dbName is required");

  // Evita crear el mismo cliente muchas veces
  if (!clients[dbName]) {
    clients[dbName] = new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://postgres:admin@localhost:5432/tutienda?schema=public`,
        },
      },
    });
  }

  return clients[dbName];
}
