import prisma from "../../config/db.js"; // BD global
import getPrismaClientForStore from "../../utils/database.js";
import xss from "xss";

/**
 * Helper: obtener customerId y storeId del token
 */
function getTenantUser(req) {
  const payload = req.userPayload || req.user;
  return {
    userId: payload?.sub || payload?.id || null,
    storeId: payload?.storeId || null
  };
}

/**
 * =========================
 * Crear review
 * =========================
 */
export const createReview = async (req, res) => {
  try {
    const reviewerId = getTenantUser(req).userId;
    const { rating, comment, productId, storeId, reviewedUserId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating inválido" });
    }

    const safeComment = comment ? xss(comment) : null;

    // =========================
    // REVIEW DE PRODUCTO (TENANT)
    // =========================
    if (productId) {
      if (!storeId) return res.status(400).json({ error: "storeId requerido para review de producto" });

      const tenantDB = getPrismaClientForStore(storeId);

      const existing = await tenantDB.review.findFirst({
        where: { reviewerId, productId }
      });

      if (existing) return res.status(409).json({ error: "Ya has reseñado este producto" });

      const review = await tenantDB.review.create({
        data: { rating, comment: safeComment, reviewerId, productId }
      });

      return res.status(201).json({ review });
    }

    // =========================
    // REVIEW DE STORE (GLOBAL)
    // =========================
    if (storeId) {
      const existing = await prisma.review.findFirst({ where: { reviewerId, storeId } });
      if (existing) return res.status(409).json({ error: "Ya has reseñado esta tienda" });

      const review = await prisma.review.create({
        data: { rating, comment: safeComment, reviewerId, storeId }
      });

      return res.status(201).json({ review });
    }

    // =========================
    // REVIEW DE USUARIO (GLOBAL)
    // =========================
    if (reviewedUserId) {
      if (reviewedUserId === reviewerId) return res.status(400).json({ error: "No puedes reseñarte a ti mismo" });

      const existing = await prisma.review.findFirst({ where: { reviewerId, reviewedUserId } });
      if (existing) return res.status(409).json({ error: "Ya has reseñado este usuario" });

      const review = await prisma.review.create({
        data: { rating, comment: safeComment, reviewerId, reviewedUserId }
      });

      return res.status(201).json({ review });
    }

    return res.status(400).json({ error: "Tipo de review no válido" });

  } catch (err) {
    console.error("[createReview]", err);
    return res.status(500).json({ error: "Error creando review" });
  }
};

/**
 * =========================
 * Obtener reviews (por store, producto o usuario)
 * =========================
 */
export async function getReviews(req, res) {
  try {
    const prisma = req.tenantPrisma;
    if (!prisma) {
      return res.status(500).json({ error: "Tenant prisma not resolved" });
    }

    const { storeId, productId } = req.query;

    const where = {};

    if (productId) where.productId = Number(productId);

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { name: true }
        }
      }
    });

    res.json(
      reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        userName: r.customer?.name || "Usuario"
      }))
    );
  } catch (err) {
    console.error("[getReviews]", err);
    res.status(500).json({ error: "Error obteniendo reviews" });
  }
}


/**
 * =========================
 * Actualizar review
 * =========================
 */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, storeId } = req.body;
    const tenantDB = storeId ? getPrismaClientForStore(storeId) : prisma;

    const review = await tenantDB.review.update({
      where: { id: Number(id) },
      data: { rating, comment }
    });

    res.json(review);

  } catch (err) {
    console.error("[updateReview]", err);
    res.status(500).json({ error: "Error actualizando review" });
  }
};

/**
 * =========================
 * Eliminar review
 * =========================
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.body; // opcional para producto
    const tenantDB = storeId ? getPrismaClientForStore(storeId) : prisma;

    const review = await tenantDB.review.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Review eliminada", review });

  } catch (err) {
    console.error("[deleteReview]", err);
    res.status(500).json({ error: "Error eliminando review" });
  }
};
