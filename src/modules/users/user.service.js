import prisma from "../../config/db.js";
import bcrypt from "bcrypt";

export async function createUser(email, password) {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { email, password: hashed },
  });
}

export async function getUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}
