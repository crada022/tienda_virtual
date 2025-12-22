import { platformPrisma } from "../../config/db.js";
import { getPrismaClientForStore } from "../../utils/database.js";

export async function getDashboardStats(req, res) {
  try {
    const user = req.user || req.userPayload;

    if (!user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const userId = user.sub || user.id;

    // 1️⃣ Tiendas del usuario (PLATFORM DB)
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

    // 2️⃣ Recorrer tiendas TENANT
    for (const store of stores) {
      if (!store.dbName) continue;

      let tenantDB;

      try {
        // ✅ usar dbName, NO store.id
        tenantDB = await getPrismaClientForStore(store.dbName);

        // Ventas totales
        const total = await tenantDB.sale.aggregate({
          _sum: { total: true }
        });

        totalSales += total._sum.total || 0;

        // Ventas del mes
        const monthly = await tenantDB.sale.aggregate({
          _sum: { total: true },
          where: {
            createdAt: { gte: firstDayOfMonth }
          }
        });

        monthlySales += monthly._sum.total || 0;

      } catch (tenantErr) {
        console.error(
          `[DashboardStats] Error en tienda ${store.slug || store.id}`,
          tenantErr
        );
        // ⛔ NO romper el dashboard por una tienda
        continue;
      } finally {
        if (tenantDB) {
          await tenantDB.$disconnect();
        }
      }
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
    console.error("[getDashboardStats] FATAL", err);
    return res.status(500).json({
      error: "Error obteniendo estadísticas"
    });
  }
}
