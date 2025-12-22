import { getPrismaClientForStore } from "../../utils/database.js";
import xss from "xss";

/* =========================
   Helpers
========================= */
function getTenantUser(req) {
  const payload = req.userPayload || req.user;
  return {
    userId: payload?.sub || payload?.id || null
  };
}

/* =========================
   CREATE REVIEW (TENANT)
========================= */
export const createReview = async (req, res) => {
  try {
    const { rating, comment, productId } = req.body;
    const { storeId } = req.params;
    const { userId } = getTenantUser(req);

    if (!storeId) {
      return res.status(400).json({ error: "storeId requerido" });
    }

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating inválido" });
    }

    const tenantDB = await getPrismaClientForStore(storeId);
    const safeComment = comment ? xss(comment) : null;

    // ❌ evitar múltiples reviews
    const exists = await tenantDB.review.findFirst({
      where: {
        reviewerId: userId,
        productId: productId || null
      }
    });

    if (exists) {
      return res.status(409).json({ error: "Ya has dejado una reseña" });
    }

    const review = await tenantDB.review.create({
      data: {
        rating,
        comment: safeComment,
        reviewerId: userId,
        productId: productId || null
      }
    });

    return res.status(201).json(review);

  } catch (err) {
    console.error("[createReview]", err);
    return res.status(500).json({ error: "Error creando review" });
  }
};

/* =========================
   GET REVIEWS (PUBLIC)
========================= */
export const getStoreReviews = async (req, res) => {
  try {
    const { storeId } = req.params;

    const tenantDB = await getPrismaClientForStore(storeId);

    const reviews = await tenantDB.review.findMany({
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
        userName: r.customer?.name || "Cliente"
      }))
    );
  } catch (err) {
    console.error("[getStoreReviews]", err);
    res.status(500).json({ error: "Error obteniendo reviews" });
  }
};

/* =========================
   DELETE REVIEW
========================= */
export const deleteReview = async (req, res) => {
  try {
    const { storeId, id } = req.params;

    const tenantDB = await getPrismaClientForStore(storeId);

    await tenantDB.review.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Review eliminada" });
  } catch (err) {
    console.error("[deleteReview]", err);
    res.status(500).json({ error: "Error eliminando review" });
  }
};
