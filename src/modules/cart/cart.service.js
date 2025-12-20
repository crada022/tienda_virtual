
export const getCartByCustomer = async (prisma, customerId) => {
  return prisma.cart.findUnique({
    where: { customerId },
    include: {
      items: { include: { product: true } }
    }
  });
};

/** Crear carrito si no existe */
export const createCartIfNotExists = async (prisma, customerId) => {
  let cart = await prisma.cart.findUnique({ where: { customerId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { customerId } });
  }
  return cart;
};

/** Agregar item al carrito */
export const addItemToCart = async (prisma, customerId, productId, quantity = 1) => {
  const cart = await createCartIfNotExists(prisma, customerId);

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId }
  });

  if (existingItem) {
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity }
    });
  }

  return prisma.cartItem.create({
    data: { cartId: cart.id, productId, quantity }
  });
};

/** Actualizar cantidad de un item */
export const updateCartItem = async (prisma, itemId, quantity) => {
  return prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
};

/** Eliminar item */
export const removeCartItem = async (prisma, itemId) => {
  return prisma.cartItem.delete({ where: { id: itemId } });
};

/** Vaciar carrito de un customer */
export const clearCustomerCart = async (prisma, customerId) => {
  const cart = await prisma.cart.findUnique({ where: { customerId } });
  if (!cart) return;
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
};
