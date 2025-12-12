import prisma from "../../config/db.js";

export const createOrderFromCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  });
};

export const getOrdersByUser = async (userId) => {
  return prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" }
  });
};

export const getOrderById = async (orderId, userId) => {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { product: true } } },
  });
};

export const createOrderFromItems = async (userId, items) => {
  // items: [{ productId, quantity, price }]
  if (!items || !items.length) throw new Error("No items provided");

  const total = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0);

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        total,
        items: {
          create: items.map(it => ({ productId: it.productId, quantity: it.quantity, price: it.price }))
        }
      },
      include: { items: true }
    });

    return order;
  });
};
