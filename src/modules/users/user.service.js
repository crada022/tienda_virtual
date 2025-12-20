import prisma from "../../config/db.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS || "10");

/**
 * Crear un usuario con email y password.
 * @param {string} email
 * @param {string} password
 * @param {string} [name]
 * @param {string} [role] - "USER" por defecto
 * @returns {Promise<Object>} usuario creado
 */
export async function createUser(email, password, name = null, role = "USER") {
  const normalizedEmail = email.toLowerCase().trim();

  // Verificar si ya existe
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new Error("Email ya registrado");

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashed,
      name: name?.trim() || null,
      role,
    },
  });
}

/**
 * Obtener usuario por email
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function getUserByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  return prisma.user.findUnique({ where: { email: normalizedEmail } });
}

/**
 * Verificar contraseña
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Obtener usuario por id (solo campos públicos)
 */
export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}
