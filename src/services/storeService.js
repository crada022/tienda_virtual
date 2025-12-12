// Antes (ejemplo que falla):
// const existe = await prisma.store.findUnique({ where: { existe: storeName } });

// Reemplazar por una consulta válida. Opción A: si tienes un campo único (p. ej. slug o id):
const existing = await prisma.store.findUnique({ where: { slug: storeSlug } });

// Opción B: si "name" no es unique, usa findFirst:
const existingByName = await prisma.store.findFirst({ where: { name: storeName } });