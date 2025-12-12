import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Añadiendo columna 'existe' a la tabla Store (si no existe)...");
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "existe" boolean DEFAULT true;'
  );
  console.log("Columna 'existe' añadida (o ya existía).");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });