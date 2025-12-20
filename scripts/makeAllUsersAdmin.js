import 'dotenv/config'; // automáticamente carga variables de .env
import { platformPrisma } from "../src/prisma/platform.js";

async function main() {
  try {
    const updated = await platformPrisma.user.updateMany({
      data: { role: "ADMIN" }, // asigna rol ADMIN a todos
    });

    console.log(`Usuarios actualizados a ADMIN: ${updated.count}`);
  } catch (error) {
    console.error("Error actualizando usuarios:", error);
  } finally {
    await platformPrisma.$disconnect();
  }
}

main();
