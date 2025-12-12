import OpenAI from "openai";
import prisma from "../../config/db.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Función auxiliar: construye clausula WHERE segura basada en filtros
function buildProductWhereClause(storeId, filters = {}) {
  const where = { storeId };

  if (filters.ids && Array.isArray(filters.ids) && filters.ids.length) {
    where.id = { in: filters.ids };
    // si se piden ids explícitos, respetar solo esos (ya filtrado por storeId)
    return where;
  }

  if (filters.search && typeof filters.search === "string" && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q } },           // quitar mode:"insensitive" por compatibilidad
      { description: { contains: q } },
    ];
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {};
    if (filters.minPrice != null) where.price.gte = Number(filters.minPrice);
    if (filters.maxPrice != null) where.price.lte = Number(filters.maxPrice);
  }

  if (filters.inStock === true) {
    where.stock = { gt: 0 };
  } else if (filters.inStock === false) {
    where.stock = { equals: 0 };
  }

  return where;
}

async function getFilteredProductsForStore(storeId, filters = {}) {
  const take = Number(filters.take ?? 8);
  const where = buildProductWhereClause(storeId, filters);

  // debug: mostrar filtros aplicados
  console.debug("[chat] getFilteredProductsForStore - storeId:", storeId, "filters:", filters, "where:", JSON.stringify(where));

  let products = await prisma.product.findMany({
    where,
    take,
    orderBy: filters.orderBy ? filters.orderBy : { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      image: true,
      category: true,
      createdAt: true,
      stock: true
    }
  });

  // Si no encuentra nada y había un filtro de búsqueda, intentar una búsqueda secundaria más laxa
  if ((!products || products.length === 0) && filters.search) {
    console.debug("[chat] No se encontraron productos con la búsqueda estricta. Intentando búsqueda laxa en la tienda.");
    const q = filters.search.trim();
    products = await prisma.product.findMany({
      where: {
        storeId,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ]
      },
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        image: true,
        category: true,
        createdAt: true,
        stock: true
      }
    });
  }

  // Si aún no hay resultados, loguear conteo total de productos de la tienda (ayuda a depurar)
  if (!products || products.length === 0) {
    const total = await prisma.product.count({ where: { storeId } }).catch(() => null);
    console.warn(`[chat] No products found for store ${storeId} with filters ${JSON.stringify(filters)}. Total products in store: ${total}`);
  }

  // mapear `image` a `imageUrl` para compatibilidad con frontend
  return (products || []).map(p => ({
    ...p,
    imageUrl: p.image ?? null
  }));
}

// resumen seguro y limitado para incluir en el prompt del sistema
function summarizeProductsForPrompt(products = [], limit = 10) {
  return products.slice(0, limit).map(p =>
    `• [id:${p.id}] ${p.name} — precio: ${p.price ?? 0} — stock: ${p.stock ?? 0}` +
    (p.description ? ` — ${p.description}` : "")
  ).join("\n");
}

export async function buildStoreContext(storeId, user = null, filters = null) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return null;

  // obtener productos aplicando filtros estrictos
  const products = await getFilteredProductsForStore(storeId, filters || { take: 8 });

  const productList = summarizeProductsForPrompt(products, 20);
  const productCount = products.length;

  const userInfo = user ? `Usuario conectado: ${user.name ?? user.email ?? user.id}.` : "";

  // Build compact JSON of products (solo campos relevantes) para que la IA consulte datos reales
  const productsJson = JSON.stringify(
    (products || []).slice(0, 100).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price ?? null,
      stock: p.stock ?? null,
      category: p.category ?? null,
      description: p.description ?? null
    }))
  );

  // Prompt del sistema robusto y específico
  const system = `Eres el asistente virtual de la tienda "${store.name}".
Descripción de la tienda: ${store.description || "sin descripción"}.
${userInfo}

INSTRUCCIONES CLAVE (LEE Y SIGUE AL PIE DE LA LETRA):
1) FUENTE ÚNICA: Para cualquier consulta sobre productos, precios, stock o categorías usa SÓLO la variable DATA_JSON incluida más abajo. No busques en Internet, no supongas ni inventes datos.
2) FORMATO ESTRICTO:
   - Si el usuario pide listar productos o pedir varios resultados responde ÚNICAMENTE con JSON válido: un array de objetos con estos campos: { id, name, price, stock, category, description }. Nada de texto adicional.
   - Si el usuario pide detalles de un producto responde ÚNICAMENTE con JSON: { id, name, price, stock, category, description }.
   - Si la respuesta debe ser textual (p.ej. política de la tienda, saludo breve), responde en español, máximo 2 frases.
3) SUSTITUCIÓN Y FALLOS:
   
   - No proporciones enlaces, precios aproximados, ni inventes alternativas.
4) LENGUAJE Y TONO: Responde en español, claro y conciso.
5) LÍMITES: Usa DATA_JSON tal cual; si se solicita más detalle que no esté ahí, devuelve la frase de fallo indicada.

PRODUCTOS_RESUMEN (humano):
${productList || "— Sin productos —"}

DATA_JSON: ${productsJson}
FIN_DE_DATOS`;

  return { store, system, products };
}

// Nuevo helper: arma contexto y envía a la IA, garantiza que se use el system prompt
export async function sendStoreChat(storeId, userMessages = [], user = null, filters = null, model = process.env.OPENAI_MODEL || "gpt-3.5-turbo") {
  const ctx = await buildStoreContext(storeId, user, filters);
  if (!ctx) throw new Error("Tienda no encontrada");

  const messages = Array.isArray(userMessages) ? userMessages : [{ role: "user", content: String(userMessages) }];

  // asegurar que incluimos el system prompt
  const finalMessages = [{ role: "system", content: ctx.system }, ...messages];

  return askOpenAI(finalMessages, model);
}

export async function askOpenAI(messages = [], model = process.env.OPENAI_MODEL || "gpt-3.5-turbo", systemMessage = null) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY no configurada");

  const finalMessages = [];

  // Si ya pasaron un system en messages, no lo duplicamos.
  const hasSystemInMessages = Array.isArray(messages) && messages.some(m => m.role === "system");
  if (systemMessage && !hasSystemInMessages) finalMessages.push({ role: "system", content: systemMessage });

  finalMessages.push(...messages);

  const resp = await openai.chat.completions.create({
    model,
    messages: finalMessages,
    max_tokens: 600,
    temperature: 0, // temperatura baja para respuestas deterministas
    top_p: 1
  });

  return resp?.choices?.[0]?.message?.content ?? "";
}