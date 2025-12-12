import prisma from "../../config/db.js"; // BD GLOBAL
import getPrismaClientForStore from "../../utils/database.js";

// Verificar si la tienda existe en la BD global
const checkStore = async (storeId) => {
  return prisma.store.findUnique({ where: { id: storeId } });
};

// =============================
// Obtener productos del tenant
// =============================
export const getProducts = async (req, res) => {
  const { storeId } = req.params;

  try {
    const store = await checkStore(storeId);
    if (!store) return res.status(404).json({ error: "La tienda no existe" });

    // conectar al tenant DB
    const tenantDB = getPrismaClientForStore(store.dbName);

    const products = await tenantDB.product.findMany({
      include: { category: true }, // incluir categoría
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener productos", detail: err.message });
  }
};

// =============================
// Obtener un producto
// =============================
export const getProduct = async (req, res) => {
  const { storeId, productId } = req.params;

  try {
    const store = await checkStore(storeId);
    if (!store) return res.status(404).json({ error: "La tienda no existe" });

    const tenantDB = getPrismaClientForStore(store.dbName);

    const product = await tenantDB.product.findUnique({
      where: { id: Number(productId) },
      include: { category: true }, // incluir categoría
    });

    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener producto", detail: err.message });
  }
};

// =============================
// Crear producto
// =============================
export const createProduct = async (req, res) => {
  const { storeId } = req.params;
  const { name, description, price, stock, image, categoryId } = req.body;
  console.log("USER AUTH:", req.user);  // <---- DEBUG

  const userId = req.user?.id;  // <-- viene del middleware requireAuth

  try {
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const store = await checkStore(storeId);
    if (!store) return res.status(404).json({ error: "La tienda no existe" });

    // 🔥 RESTRICCIÓN IMPORTANTE
    if (store.ownerId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para administrar esta tienda" });
    }

    if (!name || !price) {
      return res.status(400).json({ error: "nombre y precio requeridos" });
    }

    const tenantDB = getPrismaClientForStore(store.dbName);

    // validar que la categoría existe (si se proporciona)
    if (categoryId) {
      const category = await tenantDB.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
    }

    const newProduct = await tenantDB.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        stock: Number(stock) || 0,
        image: image?.trim() || null,
        categoryId: categoryId || null, // relacionar con categoría
      },
      include: { category: true },
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear producto", detail: err.message });
  }
};

// =============================
// Actualizar producto
// =============================
export const updateProduct = async (req, res) => {
  const { storeId, productId } = req.params;
  const { name, description, price, stock, image, categoryId } = req.body;
  const userId = req.user?.id;

  try {
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const store = await checkStore(storeId);
    if (!store) return res.status(404).json({ error: "La tienda no existe" });

    if (store.ownerId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para administrar esta tienda" });
    }

    const tenantDB = getPrismaClientForStore(store.dbName);

    // validar que la categoría existe (si se proporciona)
    if (categoryId) {
      const category = await tenantDB.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
    }

    const updated = await tenantDB.product.update({
      where: { id: Number(productId) },
      data: {
        name: name?.trim(),
        description: description?.trim() || null,
        price: Number(price),
        stock: Number(stock),
        image: image?.trim(),
        categoryId: categoryId || null,
      },
      include: { category: true },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar producto", detail: err.message });
  }
};

// =============================
// Eliminar producto
// =============================
export const deleteProduct = async (req, res) => {
  const { storeId, productId } = req.params;
  const userId = req.user?.id;

  try {
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const store = await checkStore(storeId);
    if (!store) return res.status(404).json({ error: "La tienda no existe" });

    if (store.ownerId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para administrar esta tienda" });
    }

    const tenantDB = getPrismaClientForStore(store.dbName);

    await tenantDB.product.delete({
      where: { id: Number(productId) },
    });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar producto", detail: err.message });
  }
};
