import getPrismaClientForStore from "../../utils/database.js";

/**
 * Crear producto (tenant DB)
 */
export const createProduct = async (dbName, data) => {
  const tenantDB = getPrismaClientForStore(dbName);

  return tenantDB.product.create({
    data,
    include: { category: true },
  });
};

/**
 * Obtener todos los productos de una tienda
 */
export const getProducts = async (dbName) => {
  const tenantDB = getPrismaClientForStore(dbName);

  return tenantDB.product.findMany({
    include: { category: true },
  });
};

/**
 * Obtener un producto por ID
 */
export const getProductById = async (dbName, id) => {
  const tenantDB = getPrismaClientForStore(dbName);

  return tenantDB.product.findUnique({
    where: { id: Number(id) },
    include: { category: true },
  });
};

/**
 * Actualizar producto
 */
export const updateProduct = async (dbName, id, data) => {
  const tenantDB = getPrismaClientForStore(dbName);

  return tenantDB.product.update({
    where: { id: Number(id) },
    data,
    include: { category: true },
  });
};

/**
 * Eliminar producto
 */
export const deleteProduct = async (dbName, id) => {
  const tenantDB = getPrismaClientForStore(dbName);

  return tenantDB.product.delete({
    where: { id: Number(id) },
  });
};
