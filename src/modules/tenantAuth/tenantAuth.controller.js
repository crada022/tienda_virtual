import prisma from "../../config/db.js";
import getPrismaClientForStore from "../../utils/database.js";
import { registerCustomer, loginCustomer, verifyTenantToken } from "./tenantAuth.service.js";

export async function postRegister(req, res) {
  try {
    const { storeId } = req.params;
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan campos: email y password requeridos" });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return res.status(404).json({ error: "Tienda no encontrada" });

    const result = await registerCustomer(store.dbName, { email, password, name });
    return res.status(201).json(result);
  } catch (err) {
    console.error("tenantAuth.postRegister error:", err);
    const status = err.message && err.message.toLowerCase().includes("ya registrado") ? 400 : 500;
    return res.status(status).json({ error: err.message });
  }
}

export async function postLogin(req, res) {
  try {
    const { storeId } = req.params;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan campos: email y password requeridos" });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return res.status(404).json({ error: "Tienda no encontrada" });

    const result = await loginCustomer(store.dbName, { email, password });
    return res.json(result);
  } catch (err) {
    console.error("tenantAuth.postLogin error:", err);
    return res.status(400).json({ error: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const auth = req.headers.authorization?.split(" ")[1];
    if (!auth) return res.status(401).json({ error: "No autorizado" });

    const payload = verifyTenantToken(auth);
    if (!payload) return res.status(401).json({ error: "Token inválido" });

    if (!payload.store) return res.status(400).json({ error: "Token de tienda inválido" });

    // usar el cliente prisma del tenant
    const tenant = getPrismaClientForStore(payload.store);
    if (!tenant) return res.status(500).json({ error: "No se pudo obtener conexión al tenant" });

    try {
      // asegurar que el modelo existe y traer customer
      const customer = await tenant.customer.findUnique({ where: { id: payload.sub } });
      if (!customer) return res.status(404).json({ error: "Cliente no encontrado" });
      return res.json({ customer: { id: customer.id, email: customer.email, name: customer.name, createdAt: customer.createdAt } });
    } catch (err) {
      console.error("tenantAuth.getMe tenant DB error:", err);
      return res.status(500).json({ error: "Error leyendo datos del tenant", detail: err.message });
    }
  } catch (err) {
    console.error("tenantAuth.getMe error:", err);
    return res.status(500).json({ error: err.message });
  }
}