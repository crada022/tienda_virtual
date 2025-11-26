import prisma from "../../config/db.js";

export const createProduct = async (req, res) => {
  try {
    const { error } = createProductSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { storeId } = req.body;

    // Validar que la tienda exista y sea del usuario
    const store = await prisma.store.findUnique({ where: { id: storeId } });

    if (!store) return res.status(404).json({ error: "Store not found" });
    if (store.ownerId !== req.user.id)
      return res.status(403).json({ error: "Not allowed for this store" });

    const product = await prisma.product.create({
      data: req.body,
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: "Error obteniendo productos" });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) }
    });

    return product
      ? res.json(product)
      : res.status(404).json({ error: "Producto no encontrado" });

  } catch (error) {
    return res.status(500).json({ error: "Error obteniendo producto" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.price) data.price = Number(data.price);
    if (data.stock) data.stock = Number(data.stock);

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data
    });

    return res.json({ message: "Producto actualizado", product });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error actualizando producto" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await prisma.product.findUnique({
      where: { id: Number(id) }
    });

    if (!exists) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await prisma.product.delete({
      where: { id: Number(id) }
    });

    return res.json({ message: "Producto eliminado" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error eliminando producto" });
  }
};
