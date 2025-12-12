import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";

// Añadir decode para depuración (temporal)
export function extractUserFromHeader(req) {
  const auth = req.headers?.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth || null;
  if (!token) {
    console.debug("[auth.middleware.extractUserFromHeader] no token en header");
    return null;
  }

  // Mostrar payload sin verificar (solo debug)
  try {
    const decoded = jwt.decode(token);
    console.debug("[auth.middleware] jwt.decode(payload):", decoded);
  } catch (e) {
    console.debug("[auth.middleware] jwt.decode error:", e);
  }

  if (!process.env.JWT_SECRET) {
    console.error("[auth.middleware.extractUserFromHeader] JWT_SECRET no definido");
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.debug("[auth.middleware.extractUserFromHeader] token verificado, payload:", { sub: payload.sub, email: payload.email, role: payload.role });
    return payload;
  } catch (err) {
    console.error("[auth.middleware.extractUserFromHeader] token verify error:", err?.message || err);
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const auth = req.headers?.authorization || null;
  console.debug("[auth.middleware.requireAuth] Authorization header:", auth ? `Bearer ${auth.slice(-20)}` : null);
  if (!auth) return res.status(401).json({ error: "No autorizado" });

  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (!process.env.JWT_SECRET) {
    console.error("[auth.middleware.requireAuth] JWT_SECRET no definido");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Normalizar: asegurar campo id para compatibilidad con handlers que esperan req.user.id
    if (!payload.id && payload.sub) payload.id = payload.sub;
    // Intentar convertir id a número si es posible
    if (payload.id && typeof payload.id === "string") {
      if (/^\d+$/.test(payload.id)) {
        payload.id = Number(payload.id);
      } else if (payload.email) {
        try {
          const user = await prisma.user.findUnique({ where: { email: payload.email } });
          if (user) payload.id = user.id;
        } catch (e) {
          console.error("[auth.middleware.requireAuth] error buscando usuario por email:", e.message || e);
        }
      }
    }
    // Compatibilidad: exponer payload en varios sitios que usan el proyecto
    req.userPayload = payload;
    req.user = payload;
    res.locals.user = payload;
    console.debug("[auth.middleware.requireAuth] usuario autenticado:", { sub: payload.sub, email: payload.email });
    return next();
  } catch (err) {
    console.error("[auth.middleware.requireAuth] token verify error:", err?.message || err);
    return res.status(401).json({ error: "No autorizado" });
  }
}

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Si no hay header, no bloquear: rutas públicas deben seguir funcionando
  if (!authHeader) return next();

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.id && payload.sub) payload.id = payload.sub;
    // convertir id a number si aplica
    if (payload.id && typeof payload.id === "string") {
      if (/^\d+$/.test(payload.id)) payload.id = Number(payload.id);
      else if (payload.email) {
        try {
          const user = await prisma.user.findUnique({ where: { email: payload.email } });
          if (user) payload.id = user.id;
        } catch (e) {
          console.error("[auth.middleware.authMiddleware] lookup user by email error:", e.message || e);
        }
      }
    }
    req.userPayload = payload;
    req.user = payload;
    res.locals.user = payload;
  } catch (err) {
    // Token inválido: no bloquear rutas públicas, solo loguear
    console.error("[auth.middleware.authMiddleware] token verify error:", err?.message || err);
    // opcional: borrar campos previos
    req.userPayload = undefined;
    req.user = undefined;
    res.locals.user = undefined;
  }
  return next();
};

export const isAdmin = (req, res, next) => {
  const payload = req.userPayload || extractUserFromHeader(req);
  const role = payload?.role || (payload?.roles && payload.roles[0]);
  if (!role) return res.status(403).json({ error: "Requiere rol admin" });
  if (String(role).toLowerCase() !== "admin") return res.status(403).json({ error: "Requiere rol admin" });
  return next();
};
