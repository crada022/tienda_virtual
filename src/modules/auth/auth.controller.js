import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import { extractUserFromHeader } from "./auth.middleware.js";

export async function getMe(req, res) {
  try {
    const payload = req.userPayload || extractUserFromHeader(req);
    if (!payload) return res.status(401).json({ message: "No autorizado" });

    // intentar obtener id desde payload (sub, id, userId, uid)
    const id = payload.sub || payload.id || payload.userId || payload.uid;
    const email = payload.email;

    let user = null;
    if (id) {
      user = await prisma.user.findUnique({ where: { id } });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // devolver campos seguros
    const safe = { id: user.id, name: user.name, email: user.email, role: user.role };
    return res.json(safe);
  } catch (e) {
    console.error("[auth.getMe]", e);
    return res.status(500).json({ message: "Error interno" });
  }
}

export async function updateMe(req, res) {
  try {
    const payload = req.userPayload || extractUserFromHeader(req);
    if (!payload) return res.status(401).json({ message: "No autorizado" });

    const id = payload.sub || payload.id || payload.userId || payload.uid;
    const emailPayload = payload.email;

    const { name, email } = req.body || {};
    if (!id && !emailPayload) return res.status(400).json({ message: "Identificador no disponible" });

    const where = id ? { id } : { email: emailPayload };
    const updated = await prisma.user.update({
      where,
      data: { name: name ?? undefined, email: email ?? undefined }
    });

    const safe = { id: updated.id, name: updated.name, email: updated.email, role: updated.role };
    return res.json(safe);
  } catch (e) {
    console.error("[auth.updateMe]", e);
    return res.status(500).json({ message: "Error actualizando perfil" });
  }
}

export async function changePassword(req, res) {
  try {
    const payload = req.userPayload || extractUserFromHeader(req);
    if (!payload) return res.status(401).json({ message: "No autorizado" });

    const id = payload.sub || payload.id || payload.userId || payload.uid;
    const emailPayload = payload.email;

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Campos incompletos" });
    if (newPassword.length < 6) return res.status(400).json({ message: "La nueva contraseña es muy corta" });

    const where = id ? { id } : { email: emailPayload };
    const user = await prisma.user.findUnique({ where });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // comparar contraseña actual (si backend guarda hash en user.password)
    if (!user.password) return res.status(400).json({ message: "No es posible cambiar contraseña" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: "Contraseña actual incorrecta" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where, data: { password: hashed } });

    return res.json({ message: "Contraseña cambiada" });
  } catch (e) {
    console.error("[auth.changePassword]", e);
    return res.status(500).json({ message: "Error cambiando contraseña" });
  }
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email y contraseña requeridos" });
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "Usuario ya existe" });

    const hashed = await bcrypt.hash(password, 10);

    // Intentar crear usuario forzando rol 'admin' con varias variantes para evitar errores de enum
    const roleCandidates = ["ADMIN", "Admin", "admin"];
    let user = null;
    let created = false;

    for (const r of roleCandidates) {
      try {
        user = await prisma.user.create({
          data: { name: name || null, email, password: hashed, role: r }
        });
        created = true;
        break;
      } catch (err) {
        // Si no es error de validación de enum, relanzar
        if (!err?.message?.includes("Invalid value for argument `role`") && err?.name !== "PrismaClientValidationError") {
          console.error("[auth.register] error creando con role", r, err);
          throw err;
        }
        // si es error por enum, probar siguiente candidato
        console.warn(`[auth.register] role '${r}' inválido, probando siguiente.`);
      }
    }

    // Si no se pudo crear con ningún role candidato, crear sin campo role (usar default DB)
    if (!created) {
      user = await prisma.user.create({
        data: { name: name || null, email, password: hashed }
      });
      console.warn("[auth.register] creado sin especificar role, se usó valor por defecto en DB.");
    }

    const secret = process.env.JWT_SECRET;
    const token = secret
      ? jwt.sign({ sub: user.id, email: user.email, name: user.name }, secret, { expiresIn: "7d" })
      : null;

    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("[auth.register] error:", err?.message || err);
    const body = process.env.NODE_ENV === "production" ? { message: "Error creando usuario" } : { message: err?.message || String(err) };
    return res.status(500).json(body);
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email y contraseña requeridos" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    if (!user.password) return res.status(400).json({ message: "Usuario sin contraseña configurada" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Credenciales inválidas" });

    const secret = process.env.JWT_SECRET;
    const token = secret ? jwt.sign({ sub: user.id, email: user.email, name: user.name }, secret, { expiresIn: "7d" }) : null;

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("[auth.login] error:", err?.message || err);
    return res.status(500).json({ message: err?.message || "Error autenticando usuario" });
  }
}