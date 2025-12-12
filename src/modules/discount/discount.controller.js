import prisma from "../../config/db.js";
import getPrismaClientForStore from "../../utils/database.js";

export const createDiscount = async (req, res) => {
  const { storeId } = req.params; // opcional si guardas en tenant
  const { code, type, value, startsAt, endsAt, usesLimit, combinable, appliesTo, productIds } = req.body;

  try {
    // crear en tenant DB
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return res.status(404).json({ error: "Tienda no encontrada" });

    const tenant = getPrismaClientForStore(store.dbName);

    const discount = await tenant.discount.create({
      data: {
        code,
        type,
        value: Number(value),
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        usesLimit: usesLimit ?? null,
        combinable: !!combinable,
        appliesTo,
        products: productIds?.length
          ? { create: productIds.map(pid => ({ productId: Number(pid) })) }
          : undefined
      }
    });

    res.status(201).json(discount);
  } catch (err) {
    console.error("createDiscount error", err);
    res.status(500).json({ error: "Error creando descuento", detail: err.message });
  }
};

// Listar descuentos públicos/activo
export const listActiveDiscounts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return res.status(404).json({ error: "Tienda no encontrada" });

    const tenant = getPrismaClientForStore(store.dbName);
    const now = new Date();

    const discounts = await tenant.discount.findMany({
      where: {
        active: true,
        AND: [
          { startsAt: { lte: now } } || {},
          { endsAt: { gte: now } } || {}
        ]
      }
    });

    res.json(discounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando descuentos" });
  }
};