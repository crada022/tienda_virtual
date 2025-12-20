import prisma from "../../config/db.js";
import { Pool } from "pg";
import { createDatabaseForStore } from "../../utils/createDatabase.js";

/**
 * ===============================
 * ELIMINAR BASE DE DATOS TENANT
 * ===============================
 */
export async function deleteStoreDatabase(dbName) {
  if (!/^[a-z0-9_]+$/.test(dbName)) {
    throw new Error("Nombre de base de datos inválido");
  }

  const rawUrl = new URL(process.env.DATABASE_URL);
  rawUrl.search = "";
  rawUrl.pathname = "/postgres";

  const pool = new Pool({ connectionString: rawUrl.toString() });

  try {
    const client = await pool.connect();

    await client.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName]
    );

    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    client.release();
  } finally {
    await pool.end();
  }
}

/**
 * ===============================
 * CREAR TIENDA CON IA (BASE)
 * ===============================
 * - Crea registro Store
 * - Crea DB tenant
 * - NO usa localStorage (backend)
 */
export async function createStoreWithAI(req, res) {
  try {
    const { name, ...rest } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "El nombre de la tienda es requerido"
      });
    }

    const existing = await prisma.store.findFirst({
      where: { name: name.trim() }
    });

    if (existing) {
      return res.status(409).json({
        message: "Ya existe una tienda con ese nombre"
      });
    }

    const dbName =
      "store_" +
      name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        dbName,
        ...rest
      }
    });

    try {
      await createDatabaseForStore(dbName);
    } catch (dbErr) {
      console.error("[createStoreWithAI] Error creando DB tenant", dbErr);

      // rollback
      await prisma.store
        .delete({ where: { id: store.id } })
        .catch(() => {});

      return res.status(500).json({
        message: "Error creando la base de datos de la tienda"
      });
    }

    return res.status(201).json({
      message: "Tienda creada correctamente",
      store
    });
  } catch (err) {
    console.error("[createStoreWithAI]", err);
    return res.status(500).json({
      message: "Error creando tienda con IA",
      detail: err.message
    });
  }
}
