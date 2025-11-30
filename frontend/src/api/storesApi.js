
export async function getStorePublic(id) {
  const res = await fetch(`http://localhost:4000/api/stores/public/${id}`);
  if (!res.ok) throw new Error("Error obteniendo tienda");
  return await res.json();
}

export async function getProductsPublic(id) {
  const res = await fetch(`http://localhost:4000/api/stores/public/${id}/products`);
  if (!res.ok) throw new Error("Error obteniendo productos");
  return await res.json();
}
