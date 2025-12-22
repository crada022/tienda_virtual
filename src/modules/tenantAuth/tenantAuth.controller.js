import prisma from "../../config/db.js";
import { getPrismaClientForStore } from "../../utils/database.js";
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
    const { email, password, name } = req.body;
    const store = req.store; // 🔥 viene de resolveStore

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    if (!store) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }

    const result = await registerCustomer(store.id, {
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
    const { email, password } = req.body;
    const store = req.store; // 🔥 viene de resolveStore

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    if (!store) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }

    const result = await loginCustomer(store.id, {
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

    if (
      !payload ||
      payload.type !== "CUSTOMER" ||
      !payload.sub ||
      !payload.storeId
    ) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const tenantDB = await getPrismaClientForStore(payload.storeId);

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
