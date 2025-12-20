import { PrismaClient } from "../src/prisma/tenant/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Tenant seed vacío (OK)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
