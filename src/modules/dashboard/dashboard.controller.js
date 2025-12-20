// src/modules/dashboard/dashboard.controller.js
import platformPrisma from "../../config/db.js"; // Prisma para la base de plataforma
import getPrismaClientForStore from "../../utils/database.js";

/**
 * GET /api/dashboard/stats
 * Devuelve estadísticas generales para el usuario loggeado
 */
export async function getDashboardStats(req, res) {
  try {
    const user = req.user || req.userPayload;

    if (!user) return res.status(401).json({ error: "No autorizado" });

    const userId = user.sub || user.id;

    // 1️⃣ Obtener todas las tiendas del usuario
    const stores = await platformPrisma.store.findMany({
      where: { ownerId: userId },
    });

    const totalStores = stores.length;
    const activeStores = stores.filter(s => s.isActive).length;

    let totalSales = 0;
    let monthlySales = 0;

    // 2️⃣ Calcular ventas totales por tienda
    for (const store of stores) {
      const tenantDB = getPrismaClientForStore(store.dbName);

      // Suma de todas las ventas de cada tienda
      const sales = await tenantDB.sale.aggregate({
        _sum: { total: true }, // asumiendo que cada venta tiene un campo "total"
      });
      totalSales += sales._sum.total || 0;

      // Ventas del último mes
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthly = await tenantDB.sale.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: firstDayOfMonth } },
      });
      monthlySales += monthly._sum.total || 0;
    }

    const monthlyGrowth = totalSales > 0 ? ((monthlySales / totalSales) * 100).toFixed(2) : 0;

    return res.json({
      totalStores,
      activeStores,
      totalSales,
      monthlyGrowth,
    });
  } catch (err) {
    console.error("[getDashboardStats]", err);
    return res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
}
