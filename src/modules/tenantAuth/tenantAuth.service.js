import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import getPrismaClientForStore from "../../utils/database.js";

const SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS || "10");
const JWT_SECRET = process.env.TENANT_JWT_SECRET || process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES = process.env.TENANT_JWT_EXPIRES || "7d";

export async function registerCustomer(dbName, { email, password, name }) {
  const tenant = getPrismaClientForStore(dbName);
  const existing = await tenant.customer.findUnique({ where: { email } });
  if (existing) throw new Error("Email ya registrado");

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const customer = await tenant.customer.create({
    data: { email, password: hashed, name }
  });

  const token = jwt.sign({ sub: customer.id, store: dbName, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { customer: { id: customer.id, email: customer.email, name: customer.name }, token };
}

export async function loginCustomer(dbName, { email, password }) {
  const tenant = getPrismaClientForStore(dbName);
  const customer = await tenant.customer.findUnique({ where: { email } });
  if (!customer) throw new Error("Credenciales inválidas");

  const ok = await bcrypt.compare(password, customer.password);
  if (!ok) throw new Error("Credenciales inválidas");

  const token = jwt.sign({ sub: customer.id, store: dbName, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { customer: { id: customer.id, email: customer.email, name: customer.name }, token };
}

export function verifyTenantToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}