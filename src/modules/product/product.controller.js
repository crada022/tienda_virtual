import prisma from "../../config/db.js";

// Función para verificar si la tienda existe
const checkStoreExists = async (storeId) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });
  return store;
};

// Obtener productos de una tienda específica
export const getProducts = async (req, res) => {
  const { storeId } = req.params;

  try {
    const products = await prisma.product.findMany({
      where: { storeId }, // usar el campo escalar storeId
    });

    if (products.length === 0) {
      return res.status(404).json({ error: "No se encontraron productos en esta tienda" });
    }

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener productos", detail: err.message });
  }
};

// Obtener un producto específico de una tienda
export const getProduct = async (req, res) => {
  const { storeId, productId } = req.params;
  const id = parseInt(productId, 10);

  try {
    const product = await prisma.product.findFirst({
      where: { id, storeId }, // findFirst para filtrar por id y storeId
    });

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el producto", detail: err.message });
  }
};

// Crear un nuevo producto para una tienda
export const createProduct = async (req, res) => {
  const { storeId } = req.params;
  const { name, description, price } = req.body;

  if (!name || !description || price == null) {
    return res.status(400).json({ error: "Nombre, descripción y precio son requeridos" });
  }

  try {
    const store = await checkStoreExists(storeId);
    if (!store) {
      return res.status(404).json({ error: "La tienda no existe" });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        storeId, // usar scalar storeId
      },
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear producto", detail: err.message });
  }
};

// Actualizar un producto específico dentro de una tienda
export const updateProduct = async (req, res) => {
  const { storeId, productId } = req.params;
  const id = parseInt(productId, 10);
  const { name, description, price } = req.body;

  if (!name || !description || price == null) {
    return res.status(400).json({ error: "Nombre, descripción y precio son requeridos" });
  }

  try {
    const store = await checkStoreExists(storeId);
    if (!store) return res.status(404).json({ error: "La tienda no existe" });

    const productExists = await prisma.product.findFirst({
      where: { id, storeId },
    });

    if (!productExists) return res.status(404).json({ error: "Producto no encontrado" });

    const updatedProduct = await prisma.product.update({
      where: { id }, // actualizar por id (único)
      data: { name, description, price },
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el producto", detail: err.message });
  }
};

// Eliminar un producto específico dentro de una tienda
export const deleteProduct = async (req, res) => {
  const { storeId, productId } = req.params;
  const id = parseInt(productId, 10);

  try {
    const store = await checkStoreExists(storeId);
    if (!store) return res.status(404).json({ error: "La tienda no existe" });

    const productExists = await prisma.product.findFirst({
      where: { id, storeId },
    });

    if (!productExists) return res.status(404).json({ error: "Producto no encontrado" });

    await prisma.product.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el producto", detail: err.message });
  }
};
