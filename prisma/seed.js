import { PrismaClient } from "../src/prisma/platform/index.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const platformPrisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@tutienda.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashed = await bcrypt.hash(password, 10);

  const exists = await platformPrisma.user.findUnique({
    where: { email },
  });

  if (exists) {
    console.log("✅ Admin already exists:", email);
    return;
  }

  const user = await platformPrisma.user.create({
    data: {
      email,
      password: hashed,
      role: "ADMIN",
      name: "Admin",
    },
  });

  console.log("✅ Created admin:", user.email);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await platformPrisma.$disconnect();
  });
