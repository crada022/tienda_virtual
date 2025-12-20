import prisma from "../../config/db.js";
import getPrismaClientForStore from "../../utils/database.js";
import {
  registerCustomer,
  loginCustomer,
  verifyTenantToken
} from "./tenantAuth.service.js";

/**
 * =======================
 * REGISTER CUSTOMER
 * =======================
 */
export async function postRegister(req, res) {
  try {
    const { storeId } = req.params;
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }

    const result = await registerCustomer(store.dbName, {
      email: email.toLowerCase().trim(),
      password,
      name: name?.trim() || null
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("[tenantAuth.postRegister]", err);
    res.status(400).json({ error: err.message || "Error registrando cliente" });
  }
}

/**
 * =======================
 * LOGIN CUSTOMER
 * =======================
 */
export async function postLogin(req, res) {
  try {
    const { storeId } = req.params;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }

    const result = await loginCustomer(store.dbName, {
      email: email.toLowerCase().trim(),
      password
    });

    res.json(result);
  } catch (err) {
    console.error("[tenantAuth.postLogin]", err);
    res.status(401).json({ error: err.message || "Credenciales inválidas" });
  }
}

/**
 * =======================
 * GET ME (CUSTOMER)
 * =======================
 */
export async function getMe(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyTenantToken(token);

    // ✅ VALIDACIÓN CORRECTA
    if (
      !payload ||
      payload.type !== "CUSTOMER" ||
      !payload.sub ||
      !payload.storeId
    ) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const tenantDB = getPrismaClientForStore(payload.storeId);

    const customer = await tenantDB.customer.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    if (!customer) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ customer });
  } catch (err) {
    console.error("[tenantAuth.getMe]", err);
    res.status(500).json({ error: "Error obteniendo cliente" });
  }
}
