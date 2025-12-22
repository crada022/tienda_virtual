import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPrismaClientForStore } from "../../utils/database.js";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * =======================
 * REGISTER CUSTOMER
 * =======================
 */
export async function registerCustomer(storeId, { email, password, name }) {
  const prisma = await getPrismaClientForStore(storeId);

  const exists = await prisma.customer.findUnique({ where: { email } });
  if (exists) {
    throw new Error("El cliente ya está registrado");
  }

  const hashed = await bcrypt.hash(password, 10);

  const customer = await prisma.customer.create({
    data: {
      email,
      password: hashed,
      name
    }
  });

  // 🔐 TOKEN IGUAL QUE LOGIN
  const token = jwt.sign(
    {
      sub: customer.id,
      email: customer.email,
      storeId,          // 🔥 CLAVE
      type: "CUSTOMER"
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name
    }
  };
}


/**
 * =======================
 * LOGIN CUSTOMER
 * =======================
 */
export async function loginCustomer(storeId, { email, password }) {
  const prisma = await getPrismaClientForStore(storeId);

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) {
    throw new Error("Credenciales inválidas");
  }

  const ok = await bcrypt.compare(password, customer.password);
  if (!ok) {
    throw new Error("Credenciales inválidas");
  }

  const token = jwt.sign(
    {
      sub: customer.id,
      email: customer.email,
      storeId,              // ✅ STORE ID REAL
      type: "CUSTOMER"
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name
    }
  };
}

/**
 * =======================
 * VERIFY TOKEN
 * =======================
 */
export function verifyTenantToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
