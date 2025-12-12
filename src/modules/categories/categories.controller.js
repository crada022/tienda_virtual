import prisma from "../../config/db.js"; // BD GLOBAL
import getPrismaClientForStore from "../../utils/database.js";
/**
 * Helper: validar existencia de la tienda en la BD global
 */
const checkStore = async (storeId) => {
  return prisma.store.findUnique({ where: { id: storeId } });
};

/**
 * GET /api/stores/:storeId/categories
 */
export async function getCategories(req, res) {
  try {
    const { storeId } = req.params;
    const store = await checkStore(storeId);
    if (!store) return res.status(404).json({ error: "Tienda no encontrada" });

    const tenantDB = getPrismaClientForStore(store.dbName);
    const categories = await tenantDB.category.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
    });

    return res.json({ categories });
  } catch (err) {
    console.error("[getCategories] error:", err);
    return res.status(500).json({ error: "Error obteniendo categorías", detail: err.message });
  }
}

/**
 * POST /api/stores/:storeId/categories
 */
export async function createCategory(req, res) {
  try {
    const { storeId } = req.params;
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Nombre requerido" });

    const store = await checkStore(storeId);
    if (!store) return res.status(404).json({ error: "Tienda no encontrada" });

    const tenantDB = getPrismaClientForStore(store.dbName);
    const category = await tenantDB.category.create({
      data: { storeId, name: name.trim(), description: description?.trim() || null },
    });

    return res.status(201).json({ category });
  } catch (err) {
    console.error("[createCategory] error:", err);
    if (err?.code === "P2002") return res.status(400).json({ error: "La categoría ya existe en esta tienda" });
    return res.status(500).json({ error: "Error creando categoría", detail: err.message });
  }
}

/**
 * PUT /api/stores/:storeId/categories/:categoryId
 */
export async function updateCategory(req, res) {
  try {
    const { storeId, categoryId } = req.params;
    const { name, description } = req.body;

    const store = await checkStore(storeId);
    if (!store) return res.status(404).json({ error: "Tienda no encontrada" });

    const tenantDB = getPrismaClientForStore(store.dbName);

    const result = await tenantDB.category.updateMany({
      where: { id: categoryId, storeId },
      data: {
        name: name?.trim(),
        description: description?.trim() || null,
      },
    });

    if (result.count === 0) return res.status(404).json({ error: "Categoría no encontrada" });

    const updated = await tenantDB.category.findUnique({ where: { id: categoryId } });
    return res.json({ category: updated });
  } catch (err) {
    console.error("[updateCategory] error:", err);
    return res.status(500).json({ error: "Error actualizando categoría", detail: err.message });
  }
}

/**
 * DELETE /api/stores/:storeId/categories/:categoryId
 */
export async function deleteCategory(req, res) {
  try {
    const { storeId, categoryId } = req.params;

    const store = await checkStore(storeId);
    if (!store) return res.status(404).json({ error: "Tienda no encontrada" });

    const tenantDB = getPrismaClientForStore(store.dbName);
    const result = await tenantDB.category.deleteMany({
      where: { id: categoryId, storeId },
    });

    if (result.count === 0) return res.status(404).json({ error: "Categoría no encontrada" });

    return res.json({ message: "Categoría eliminada" });
  } catch (err) {
    console.error("[deleteCategory] error:", err);
    return res.status(500).json({ error: "Error eliminando categoría", detail: err.message });
  }
}