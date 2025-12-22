/**
 * =========================
 * CREAR ORDEN DESDE CARRITO
 * =========================
 */
export const createOrderFromCart = async (req, customerId) => {
  const prisma = req.tenantPrisma;
  if (!prisma) throw new Error("Tenant prisma not resolved");

  const cart = await prisma.cart.findUnique({
    where: { customerId },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerId,
        total,
        status: "PENDING",
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          }))
        }
      },
      include: {
        items: { include: { product: true } }
      }
    });

    // Vaciar carrito
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return order;
  });
};

/**
 * =========================
 * LISTAR ÓRDENES DEL CUSTOMER
 * =========================
 */
export const getOrdersByCustomer = async (req, customerId) => {
  const prisma = req.tenantPrisma;
  if (!prisma) throw new Error("Tenant prisma not resolved");

  return prisma.order.findMany({
    where: { customerId },
    include: {
      items: { include: { product: true } }
    },
    orderBy: { createdAt: "desc" }
  });
};

/**
 * =========================
 * OBTENER ORDEN POR ID
 * =========================
 */
export const getOrderById = async (req, orderId, customerId) => {
  const prisma = req.tenantPrisma;
  if (!prisma) throw new Error("Tenant prisma not resolved");

  return prisma.order.findFirst({
    where: {
      id: Number(orderId),
      customerId
    },
    include: {
      items: { include: { product: true } }
    }
  });
};

/**
 * =========================
 * CREAR ORDEN DESDE ITEMS
 * =========================
 * Checkout rápido / Buy now
 */
export const createOrderFromItems = async (req, customerId, items) => {
  const prisma = req.tenantPrisma;
  if (!prisma) throw new Error("Tenant prisma not resolved");

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No items provided");
  }

  // 1️⃣ Obtener productos reales desde DB
  const products = await prisma.product.findMany({
    where: {
      id: { in: items.map(i => i.productId) }
    }
  });

  if (products.length !== items.length) {
    throw new Error("Some products not found");
  }

  // 2️⃣ Calcular total REAL
  const total = items.reduce((sum, it) => {
    const product = products.find(p => p.id === it.productId);
    return sum + product.price * Number(it.quantity || 1);
  }, 0);

  // 3️⃣ Crear orden
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerId,
        total,
        status: "PENDING",
        items: {
          create: items.map(it => {
            const product = products.find(p => p.id === it.productId);
            return {
              productId: it.productId,
              quantity: Number(it.quantity || 1),
              price: product.price
            };
          })
        }
      },
      include: {
        items: { include: { product: true } }
      }
    });

    return order;
  });
};


/**
 * =========================
 * ACTUALIZAR ESTADO (ADMIN TIENDA)
 * =========================
 */
export const updateOrderStatusByStore = async (req, orderId, status) => {
  const prisma = req.tenantPrisma;
  if (!prisma) throw new Error("Tenant prisma not resolved");

  return prisma.order.update({
    where: { id: Number(orderId) },
    data: { status }
  });
};
