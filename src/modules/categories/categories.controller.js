import { platformPrisma } from "../../config/db.js";
import { getPrismaClientForStore } from "../../utils/database.js";

/**
 * Validar tienda en BD plataforma
 */
async function getStoreOr404(storeId) {
  const store = await platformPrisma.store.findUnique({
    where: { id: storeId }
  });

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  if (!store.dbName) {
    throw new Error("STORE_WITHOUT_DBNAME");
  }

  return store;
}

/**
 * Validar permisos: owner o admin
 */
function canManageStore(req, store) {
  const user = req.user;
  if (!user) return false;

  const userId = user.sub || user.id;
  const role = (user.role || "").toLowerCase();

  if (role === "admin") return true;
  if (userId && userId === store.ownerId) return true;

  return false;
}

/**
 * GET /api/stores/:storeId/categories
 * Público
 */
export async function getCategories(req, res) {
  try {
    const { storeId } = req.params;

    await getStoreOr404(storeId);
    const tenantDB = await getPrismaClientForStore(storeId);

    const categories = await tenantDB.category.findMany({
      where: { storeId },
      orderBy: { name: "asc" }
    });

    res.json(categories);
  } catch (err) {
    console.error("[getCategories]", err);
    if (err.message === "STORE_NOT_FOUND") {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }
    return res.status(500).json({ error: "Error obteniendo categorías" });
  }
}

/**
 * POST /api/stores/:storeId/categories
 * Owner / Admin
 */
export async function createCategory(req, res) {
  try {
    const { storeId } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Nombre de categoría requerido" });
    }

    const store = await getStoreOr404(storeId);

    if (!canManageStore(req, store)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const tenantDB = await getPrismaClientForStore(storeId);

    const category = await tenantDB.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        storeId
      }
    });

    res.status(201).json(category);
  } catch (err) {
    console.error("[createCategory]", err);
    if (err.message === "STORE_NOT_FOUND") {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "La categoría ya existe" });
    }
    return res.status(500).json({ error: "Error creando categoría" });
  }
}

/**
 * PUT /api/stores/:storeId/categories/:categoryId
 * Owner / Admin
 */
export async function updateCategory(req, res) {
  try {
    const { storeId, categoryId } = req.params;
    const { name, description } = req.body;

    const store = await getStoreOr404(storeId);

    if (!canManageStore(req, store)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const tenantDB = await getPrismaClientForStore(storeId);

    const updated = await tenantDB.category.update({
      where: { id: Number(categoryId) },
      data: {
        name: name?.trim(),
        description: description?.trim() || null
      }
    });

    res.json(updated);
  } catch (err) {
    console.error("[updateCategory]", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    return res.status(500).json({ error: "Error actualizando categoría" });
  }
}

/**
 * DELETE /api/stores/:storeId/categories/:categoryId
 * Owner / Admin
 */
export async function deleteCategory(req, res) {
  try {
    const { storeId, categoryId } = req.params;

    const store = await getStoreOr404(storeId);

    if (!canManageStore(req, store)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const tenantDB = await getPrismaClientForStore(storeId);

    await tenantDB.category.delete({
      where: { id: Number(categoryId) }
    });

    res.json({ message: "Categoría eliminada" });
  } catch (err) {
    console.error("[deleteCategory]", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    return res.status(500).json({ error: "Error eliminando categoría" });
  }
}
