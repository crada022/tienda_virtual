export async function getStorePublic(id) {
  const res = await fetch(`http://localhost:4000/api/stores/public/${id}`);
  return await res.json();
}

export async function getProductsPublic(id) {
  const res = await fetch(`http://localhost:4000/api/stores/public/${id}/products`);
  return await res.json();
}
