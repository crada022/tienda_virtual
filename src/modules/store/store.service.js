import prisma from "../../config/db.js";
import { exec } from "child_process";
import { Pool } from "pg";
import { createDatabaseForStore } from "../../utils/createDatabase.js";

/**
 * Elimina de forma segura una base de datos tenant:
 * - Conecta a la DB administrativa (postgres)
 * - Termina conexiones activas hacia la DB objetivo
 * - Ejecuta DROP DATABASE IF EXISTS "dbName"
 */
export async function deleteStoreDatabase(dbName) {
  // Validación básica del nombre para evitar inyección
  if (!/^[a-z0-9_]+$/.test(dbName)) {
    throw new Error("Nombre de base de datos inválido");
  }

  // Construir connection string sin query params (evita ?schema=public que rompe psql)
  const rawUrl = new URL(process.env.DATABASE_URL);
  rawUrl.search = ""; // elimina query params como schema
  rawUrl.pathname = "/postgres"; // conectamos a la DB administrativa
  const connectionString = rawUrl.toString();

  const pool = new Pool({ connectionString });

  try {
    const client = await pool.connect();

    // Terminar cualquier conexión activa a la DB objetivo
    await client.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName]
    );

    // DROP (dbName está validada y segura)
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    client.release();
  } catch (err) {
    throw new Error(`Error eliminando DB: ${err.message}`);
  } finally {
    await pool.end();
  }
}

export async function createStoreWithAI(req, res) {
  try {
    const { name, ...rest } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre de la tienda es requerido" });

    // Buscar por name con findFirst (name probablemente no es unique)
    const existing = await prisma.store.findFirst({ where: { name } });
    if (existing) return res.status(409).json({ message: "Ya existe una tienda con ese nombre" });

    // generar dbName seguro
    const dbName = "store_" + name.toLowerCase().replace(/\s+/g, "_");

    // crear registro en la BD principal
    const store = await prisma.store.create({
      data: {
        name,
        dbName,
        ...rest
      }
    });

    // crear DB del tenant (si tu util lo maneja)
    try {
      await createDatabaseForStore(dbName);
    } catch (dbErr) {
      console.error("[createStoreWithAI] error creando DB tenant, borrando registro creado", dbErr);
      // intentar borrar el registro principal si falla la creación de la DB tenant
      await prisma.store.delete({ where: { id: store.id } }).catch(() => {});
      return res.status(500).json({ message: "Error creando base de datos para la tienda" });
    }

    return res.status(201).json(store);
  } catch (err) {
    console.error("[createStoreWithAI]", err);
    return res.status(500).json({ message: "Error creando tienda con IA", detail: err.message });
  }
}
