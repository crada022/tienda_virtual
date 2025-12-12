export function applyDiscount(price, discount) {
  if (!discount) return { price, discountedPrice: null };
  if (!discount.active) return { price, discountedPrice: null };
  const now = new Date();
  if (discount.startsAt && new Date(discount.startsAt) > now) return { price, discountedPrice: null };
  if (discount.endsAt && new Date(discount.endsAt) < now) return { price, discountedPrice: null };

  let discountedPrice = price;
  if (discount.type === "PERCENT") {
    discountedPrice = Math.max(0, price * (1 - Number(discount.value) / 100));
  } else {
    discountedPrice = Math.max(0, price - Number(discount.value));
  }
  return { price, discountedPrice };
}