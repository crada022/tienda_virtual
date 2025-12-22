import prisma from "../../config/db.js"; // BD PLATFORM
import { getPrismaClientForStore } from "../../utils/database.js";

/**
 * Verifica tienda y propietario
 */
const assertStoreAndOwner = async (storeId, userId) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  if (!store) throw { status: 404, message: "La tienda no existe" };
  if (!store.active) throw { status: 403, message: "La tienda no está activa" };
  if (store.ownerId !== userId)
    throw { status: 403, message: "No tienes permiso para administrar esta tienda" };

  return store;
};

// =============================
// Obtener productos (PÚBLICO)
// =============================
export const getProducts = async (req, res) => {
  const { storeId } = req.params;

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.active)
      return res.status(404).json({ error: "La tienda no existe o está inactiva" });

    const tenantDB = await getPrismaClientForStore(storeId);

    const products = await tenantDB.product.findMany({
      include: { category: true },
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

// =============================
// Obtener un producto (PÚBLICO)
// =============================
export const getProduct = async (req, res) => {
  const { storeId, productId } = req.params;

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.active)
      return res.status(404).json({ error: "La tienda no existe o está inactiva" });

    const tenantDB = await getPrismaClientForStore(storeId);

    const product = await tenantDB.product.findUnique({
      where: { id: Number(productId) },
      include: { category: true },
    });

    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener producto" });
  }
};

// =============================
// Crear producto (ADMIN)
// =============================
export const createProduct = async (req, res) => {
  const { storeId } = req.params;
  const { name, description, price, stock, image, categoryId } = req.body;
  const userId = req.user?.id;

  try {
    if (!userId)
      return res.status(401).json({ error: "No autenticado" });

    if (!name || isNaN(Number(price)))
      return res.status(400).json({ error: "Nombre y precio válidos son requeridos" });

    await assertStoreAndOwner(storeId, userId);
    const tenantDB = await getPrismaClientForStore(storeId);

    if (categoryId) {
      const category = await tenantDB.category.findUnique({
        where: { id: categoryId },
      });
      if (!category)
        return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const product = await tenantDB.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        stock: Number(stock) || 0,
        image: image?.trim() || null,
        categoryId: categoryId || null,
        storeId,
      },
      include: { category: true },
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// =============================
// Actualizar producto (ADMIN)
// =============================
export const updateProduct = async (req, res) => {
  const { storeId, productId } = req.params;
  const { name, description, price, stock, image, categoryId } = req.body;
  const userId = req.user?.id;

  try {
    if (!userId)
      return res.status(401).json({ error: "No autenticado" });

    await assertStoreAndOwner(storeId, userId);
    const tenantDB = await getPrismaClientForStore(storeId);

    const data = {};

    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (price !== undefined) {
      if (isNaN(Number(price)))
        return res.status(400).json({ error: "Precio inválido" });
      data.price = Number(price);
    }
    if (stock !== undefined) data.stock = Number(stock);
    if (image !== undefined) data.image = image?.trim() || null;

    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await tenantDB.category.findUnique({
          where: { id: categoryId },
        });
        if (!category)
          return res.status(404).json({ error: "Categoría no encontrada" });
        data.categoryId = categoryId;
      } else {
        data.categoryId = null;
      }
    }

    const product = await tenantDB.product.update({
      where: { id: Number(productId) },
      data,
      include: { category: true },
    });

    res.json(product);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Error actualizando producto",
    });
  }
};

// =============================
// Eliminar producto (ADMIN)
// =============================
export const deleteProduct = async (req, res) => {
  const { storeId, productId } = req.params;
  const userId = req.user?.id;

  try {
    if (!userId)
      return res.status(401).json({ error: "No autenticado" });

    await assertStoreAndOwner(storeId, userId);
    const tenantDB = await getPrismaClientForStore(storeId);

    const exists = await tenantDB.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!exists)
      return res.status(404).json({ error: "Producto no encontrado" });

    await tenantDB.product.delete({
      where: { id: Number(productId) },
    });

    res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Error eliminando producto",
    });
  }
};
