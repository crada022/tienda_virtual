import { platformPrisma } from "../../config/db.js";
import { getPrismaClientForStore } from "../../utils/database.js";

/**
 * GET /api/dashboard/stats
 * Devuelve estadísticas generales para el usuario loggeado
 */
export async function getDashboardStats(req, res) {
  try {
    const user = req.user || req.userPayload;

    if (!user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const userId = user.sub || user.id;

    // 1️⃣ Obtener tiendas del usuario
    const stores = await platformPrisma.store.findMany({
      where: { ownerId: userId }
    });

    const totalStores = stores.length;
    const activeStores = stores.filter(s => s.active).length;

    let totalSales = 0;
    let monthlySales = 0;

    const now = new Date();
    const firstDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    // 2️⃣ Recorrer tiendas (TENANT)
    for (const store of stores) {
      if (!store.dbName) continue;

      const tenantDB = await getPrismaClientForStore(store.id);

      // Ventas totales
      const total = await tenantDB.sale.aggregate({
        _sum: { total: true }
      });

      totalSales += total._sum.total || 0;

      // Ventas del mes actual
      const monthly = await tenantDB.sale.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: firstDayOfMonth }
        }
      });

      monthlySales += monthly._sum.total || 0;
    }

    const monthlyGrowth =
      totalSales > 0
        ? Number(((monthlySales / totalSales) * 100).toFixed(2))
        : 0;

    return res.json({
      totalStores,
      activeStores,
      totalSales,
      monthlySales,
      monthlyGrowth
    });

  } catch (err) {
    console.error("[getDashboardStats]", err);
    return res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
}
