import { PrismaClient } from "@prisma/client";
import xss from "xss";

const prisma = new PrismaClient();

/**
 * Helper: recalcula rating promedio para product/store
 * Ajusta nombres de tablas/columnas según tu esquema.
 */
async function recalcAverage(target) {
  // target = { productId } o { storeId }
  if (target.productId) {
    const productId = target.productId;
    const agg = await prisma.review.aggregate({
      where: { productId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { id: true }
    });
    const avg = agg._avg.rating ?? 0;
    const count = agg._count.id ?? 0;
    // Actualiza Product si existe
    try {
      await prisma.product.update({
        where: { id: productId },
        data: { rating: avg, ratingCount: count }
      });
    } catch (e) {
      // Si no existe Product, ignorar
    }
  } else if (target.storeId) {
    const storeId = target.storeId;
    const agg = await prisma.review.aggregate({
      where: { storeId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { id: true }
    });
    const avg = agg._avg.rating ?? 0;
    const count = agg._count.id ?? 0;
    try {
      await prisma.store.update({
        where: { id: storeId },
        data: { rating: avg, ratingCount: count }
      });
    } catch (e) {}
  }
}

export const createReview = async (req, res) => {
  try {
    const authorId = req.user.id; // según tu auth middleware
    const { rating, comment, productId, storeId, reviewedUserId } = req.body;

    // Sanitizar comentario
    const safeComment = comment ? xss(comment) : null;

    // Determinar tipo
    let type;
    if (productId) type = "PRODUCT";
    else if (storeId) type = "STORE";
    else type = "USER";

    // No permitir self-review (ejemplo)
    if (reviewedUserId && reviewedUserId === authorId) {
      return res.status(400).json({ error: "No puedes reseñarte a ti mismo" });
    }

    // Evitar duplicados: 1 review por usuario por objetivo
    const dupWhere = {
      authorId,
      ...(productId ? { productId } : {}),
      ...(storeId ? { storeId } : {}),
      ...(reviewedUserId ? { reviewedUserId } : {})
    };

    const existing = await prisma.review.findFirst({ where: dupWhere });
    if (existing) {
      return res.status(409).json({ error: "Ya has dejado una review para este objetivo. Usa editar si quieres cambiarla." });
    }

    // Si quieres validar que usuario compró el producto para permitir review,
    // valida aquí consultando tu tabla de orders. (si no, dejar verified=false)
    const newReview = await prisma.review.create({
      data: {
        rating,
        comment: safeComment,
        authorId,
        productId: productId ?? null,
        storeId: storeId ?? null,
        reviewedUserId: reviewedUserId ?? null,
        type,
        status: "APPROVED", // o "PENDING" si quieres moderación previa
        verified: false
      }
    });

    // recalcular promedio si aplica
    if (productId) await recalcAverage({ productId });
    if (storeId) await recalcAverage({ storeId });

    return res.status(201).json({ review: newReview });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error creando review" });
  }
};

export const getReviewsForProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 100);
    const skip = (page - 1) * limit;

    const where = { productId, status: "APPROVED" };

    // filtros opcionales
    if (req.query.rating) where.rating = parseInt(req.query.rating, 10);

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { /* include author info if you want */ }
      })
    ]);

    return res.json({ total, page, limit, reviews });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener reviews" });
  }
};

export const getReviewsForStore = async (req, res) => {
  try {
    const storeId = req.params.storeId;
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 100);
    const skip = (page - 1) * limit;

    const where = { storeId, status: "APPROVED" };

    if (req.query.rating) where.rating = parseInt(req.query.rating, 10);

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      })
    ]);

    return res.json({ total, page, limit, reviews });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener reviews" });
  }
};

export const getReviewsForUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 100);
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { reviewedUserId: userId },
        // también si quieres reviews hechas por el usuario:
        // { authorId: userId }
      ],
      status: "APPROVED"
    };

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      })
    ]);

    return res.json({ total, page, limit, reviews });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener reviews" });
  }
};

/* Opcional: actualizar review (solo autor o admin) */
export const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({ where: { id }});
    if (!review) return res.status(404).json({ error: "Review no encontrada" });

    // permiso: autor o admin (asume req.user.role)
    if (review.authorId !== userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: rating ?? review.rating,
        comment: comment ? xss(comment) : review.comment
      }
    });

    // recalcular promedio si aplica
    if (updated.productId) await recalcAverage({ productId: updated.productId });
    if (updated.storeId) await recalcAverage({ storeId: updated.storeId });

    return res.json({ review: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error actualizando review" });
  }
};

/* Opcional: eliminar review (autor o admin) */
export const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const review = await prisma.review.findUnique({ where: { id }});
    if (!review) return res.status(404).json({ error: "Review no encontrada" });

    if (review.authorId !== userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "No autorizado" });
    }

    await prisma.review.delete({ where: { id } });

    if (review.productId) await recalcAverage({ productId: review.productId });
    if (review.storeId) await recalcAverage({ storeId: review.storeId });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error eliminando review" });
  }
};
