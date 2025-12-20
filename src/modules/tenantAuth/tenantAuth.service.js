import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import getPrismaClientForStore from "../../utils/database.js";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * =======================
 * REGISTER CUSTOMER
 * =======================
 */
export async function registerCustomer(dbName, { email, password, name }) {
  const prisma = getPrismaClientForStore(dbName);

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

  return {
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
export async function loginCustomer(dbName, { email, password }) {
  const prisma = getPrismaClientForStore(dbName);

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) {
    throw new Error("Credenciales inválidas");
  }

  const ok = await bcrypt.compare(password, customer.password);
  if (!ok) {
    throw new Error("Credenciales inválidas");
  }

  // ✅ TOKEN CORRECTO
  const token = jwt.sign(
    {
      sub: customer.id,
      email: customer.email,
      storeId: dbName,          // 🔑 CLAVE
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
