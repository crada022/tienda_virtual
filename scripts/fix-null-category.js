import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { categoryId: null },
    select: { id: true, storeId: true }
  });

  if (!products.length) {
    console.log("No hay productos con categoryId NULL.");
    return;
  }

  const byStore = products.reduce((acc, p) => {
    (acc[p.storeId] = acc[p.storeId] || []).push(p.id);
    return acc;
  }, {});

  for (const storeId of Object.keys(byStore)) {
    // crear o recuperar categoría por defecto
    let category = await prisma.category.findFirst({
      where: { storeId, name: "Uncategorized" }
    });
    if (!category) {
      category = await prisma.category.create({
        data: {
          storeId,
          name: "Uncategorized",
          description: "Categoría por defecto para productos sin categoría"
        }
      });
      console.log(`Creada categoría por defecto ${category.id} para store ${storeId}`);
    } else {
      console.log(`Usando categoría existente ${category.id} para store ${storeId}`);
    }

    // actualizar productos de la tienda sin categoría
    const res = await prisma.product.updateMany({
      where: { storeId, categoryId: null },
      data: { categoryId: category.id }
    });
    console.log(`Actualizados ${res.count} productos de la tienda ${storeId}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });