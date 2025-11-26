import prisma from "../../config/db.js";
import { createStoreSchema, updateStoreSchema } from "./store.validation.js";

const generateDomain = (name) => {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return `${slug}-${Date.now()}.com`;
};

// =========================
// CREATE STORE
// =========================
export const createStore = async (req, res) => {
  try {
    const { error } = createStoreSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, address, phone, email, description } = req.body;

    const domain = generateDomain(name);

    const store = await prisma.store.create({
      data: {
        name,
        address,
        phone,
        email,
        description,
        domain,
        ownerId: req.user.id, // ← AUTOMÁTICO POR TOKEN
      },
    });

    res.status(201).json({ message: "Store created successfully", store });

  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};


// =========================
// GET STORES (paginated)
// =========================
export const getStores = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", active } = req.query;

    const skip = (page - 1) * limit;

  const where = {
  ownerId: req.user.id,
  name: { contains: search, mode: "insensitive" }
};


    if (active !== undefined) {
      where.active = active === "true";
    }

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
// GET STORE BY ID
// =========================
export const getStoreById = async (req, res) => {
  try {
    const store = await prisma.store.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });

    if (store.ownerId !== req.user.id)
  return res.status(403).json({ error: "Unauthorized" });


    res.json(store);

  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};


// =========================
// UPDATE STORE
// =========================
export const updateStore = async (req, res) => {
  try {
    const { error } = updateStoreSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const store = await prisma.store.updateMany({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      },
      data: req.body
    });

    if (store.count === 0)
      return res.status(404).json({ error: "Store not found" });

    const updatedStore = await prisma.store.findUnique({
      where: { id: req.params.id }
    });

    res.json({ message: "Store updated successfully", store: updatedStore });

  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};


// =========================
// SOFT DELETE
// =========================
export const deleteStore = async (req, res) => {
  try {
    const store = await prisma.store.updateMany({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      },
      data: { active: false }
    });

    if (store.count === 0)
      return res.status(404).json({ error: "Store not found" });

    res.json({ message: "Store deleted (soft delete)" });

  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
