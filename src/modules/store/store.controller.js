// src/modules/store/store.controller.js

import prisma from "../../config/db.js";  // BD GLOBAL
import { createStoreSchema, updateStoreSchema } from "./store.validation.js";
import { createDatabaseForStore } from "../../utils/createDatabase.js";
import getPrismaClientForStore from "../../utils/database.js";

// =========================
// Helper para generar DB
// =========================
const generateDBName = (storeName) =>
  "store_" + storeName.toLowerCase().replace(/\s+/g, "_");

// =========================
// CREATE STORE (GLOBAL DB + Tenant DB)
// =========================
export const createStore = async (req, res) => {
  try {
    const { error } = createStoreSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, address, phone, email, description } = req.body;

    // GENERAR NOMBRE DE BASE DE DATOS
    const dbName = generateDBName(name);

    // 1️⃣ Crear registro en DB GLOBAL
    const store = await prisma.store.create({
      data: {
        name,
        address,
        phone,
        email,
        description,
        dbName,
        ownerId: req.user.id
      },
    });

    // 2️⃣ Crear la base del tenant + migraciones
    await createDatabaseForStore(dbName);

    res.status(201).json({
      message: "Store and tenant database created successfully",
      store
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

// =========================
// GET STORES (paginated FROM GLOBAL)
// =========================
export const getStores = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      ownerId: req.user.id,
      name: { contains: search, mode: "insensitive" }
    };

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: "desc" }
      }),
      prisma.store.count({ where })
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
      stores
    });

  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

// =========================
// GET STORE BY ID (FROM GLOBAL)
// =========================
export const getStoreById = async (req, res) => {
  try {
    const store = await prisma.store.findFirst({
      where: { id: req.params.id, ownerId: req.user.id }
    });

    if (!store) return res.status(404).json({ error: "Store not found" });

    res.json(store);

  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

// =========================
// UPDATE STORE (GLOBAL)
// =========================
export const updateStore = async (req, res) => {
  try {
    const { error } = updateStoreSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const updated = await prisma.store.updateMany({
      where: { id: req.params.id, ownerId: req.user.id },
      data: req.body
    });

    if (updated.count === 0)
      return res.status(404).json({ error: "Store not found" });

    const updatedStore = await prisma.store.findUnique({
      where: { id: req.params.id }
    });

    res.json({
      message: "Store updated successfully",
      store: updatedStore
    });

  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

// =========================
// DELETE STORE (GLOBAL)
// =========================
export const deleteStore = async (req, res) => {
  try {
    const deleted = await prisma.store.updateMany({
      where: { id: req.params.id, ownerId: req.user.id },
      data: { active: false }
    });

    if (deleted.count === 0)
      return res.status(404).json({ error: "Store not found" });

    res.json({ message: "Store deleted (soft delete)" });

  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
export const getStorePublic = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        products: true
      }
    });

    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });

    return res.json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo tienda" });
  }
};
export async function getStoreProductsPublic(req, res) {
  try {
    const { id } = req.params;

    const products = await prisma.product.findMany({
      where: { storeId: id }
    });

    return res.json(products); // 👈 aunque esté vacío, devuelve []
  } catch (error) {
    console.error("Error obteniendo productos públicos", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
export const generateStoreStyle = (req, res) => {
  try {
    // Lógica temporal para probar
    return res.json({ message: "generateStoreStyle funciona correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando estilos de tienda" });
  }
};
