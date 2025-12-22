import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { platformPrisma } from "../../config/db.js";
import { extractUserFromHeader } from "./auth.middleware.js";

/**
 * Helpers
 */
function getUserFromPayload(payload) {
  return payload?.sub || payload?.id || payload?.userId || payload?.uid || null;
}

/**
 * =========================
 * GET /api/auth/me
 * =========================
 */
export async function getMe(req, res) {
  try {
    const payload = req.userPayload || extractUserFromHeader(req);
    if (!payload) return res.status(401).json({ message: "No autorizado" });

    const userId = getUserFromPayload(payload);
    if (!userId) return res.status(401).json({ message: "Token inválido" });

    const user = await platformPrisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json(user);
  } catch (error) {
    console.error("[auth.getMe]", error);
    return res.status(500).json({ message: "Error interno" });
  }
}

/**
 * =========================
 * PUT /api/auth/me
 * =========================
 */
export async function updateMe(req, res) {
  try {
    const payload = req.userPayload || extractUserFromHeader(req);
    if (!payload) return res.status(401).json({ message: "No autorizado" });

    const userId = getUserFromPayload(payload);
    if (!userId) return res.status(401).json({ message: "Token inválido" });

    const { name, email } = req.body || {};

    const updated = await platformPrisma.user.update({
      where: { id: userId },
      data: {
        name: name ?? undefined,
        email: email ?? undefined
      },
      select: { id: true, name: true, email: true, role: true }
    });

    return res.json(updated);
  } catch (error) {
    console.error("[auth.updateMe]", error);
    return res.status(500).json({ message: "Error actualizando perfil" });
  }
}

/**
 * =========================
 * PUT /api/auth/change-password
 * =========================
 */
export async function changePassword(req, res) {
  try {
    const payload = req.userPayload || extractUserFromHeader(req);
    if (!payload) return res.status(401).json({ message: "No autorizado" });

    const userId = getUserFromPayload(payload);
    if (!userId) return res.status(401).json({ message: "Token inválido" });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Campos incompletos" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "La nueva contraseña es muy corta" });
    }

    const user = await platformPrisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.password) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Contraseña actual incorrecta" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await platformPrisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    });

    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("[auth.changePassword]", error);
    return res.status(500).json({ message: "Error cambiando contraseña" });
  }
}

/**
 * =========================
 * POST /api/auth/register
 * (CREADOR DE TIENDAS)
 * =========================
 */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña requeridos" });
    }

    const exists = await platformPrisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: "Usuario ya existe" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // 👑 Usuario de plataforma (creador de tiendas)
    const user = await platformPrisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashed,
        role: "ADMIN"
      }
    });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("[auth.register]", error);
    return res.status(500).json({ message: "Error creando usuario" });
  }
}

/**
 * =========================
 * POST /api/auth/login
 * =========================
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña requeridos" });
    }

    const user = await platformPrisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("[auth.login]", error);
    return res.status(500).json({ message: "Error autenticando usuario" });
  }
}
