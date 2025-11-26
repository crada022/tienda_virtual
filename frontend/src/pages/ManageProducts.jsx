import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";  // Para acceder al ID de la tienda
import { getProducts, addProduct, updateProduct, deleteProduct } from "../api/services/productService";
import AddToCartButton from "./AddToCartButton";
function ManageProducts() {
  const { storeId } = useParams();  // Obtener el ID de la tienda desde la URL
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "" });
  const [loading, setLoading] = useState(true);

  // Obtener los productos de la tienda
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await getProducts(storeId);
        setProducts(result);
      } catch (err) {
        console.error("Error al cargar los productos:", err);
        alert("Error cargando los productos");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [storeId]);

  // Manejo de cambios en los inputs del formulario
  const handleChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  // Agregar un nuevo producto
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const product = await addProduct(storeId, newProduct);
      setProducts([...products, product]); // Añadir el producto a la lista
      setNewProduct({ name: "", price: "", description: "" }); // Limpiar el formulario
    } catch (err) {
      console.error("Error al agregar producto:", err);
      alert("Error al agregar producto");
    }
  };

  // Eliminar un producto
  const handleDeleteProduct = async (productId) => {
    if (!productId) {
      console.error("handleDeleteProduct: productId faltante");
      return;
    }
    try {
      await deleteProduct(storeId, productId); // asegura pasar storeId también
      setProducts(products.filter((product) => product.id !== productId)); // Eliminar el producto de la lista
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Gestionar Productos de la Tienda</h2>
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <>
          <h3>Productos</h3>
          <ul>
            {products.map((product) => (
              <li key={product.id}>
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <p>Precio: ${product.price}</p>
                <button onClick={() => handleDeleteProduct(product.id)}>Eliminar</button>
                <AddToCartButton productId={product.id} />
              </li>
            ))}
          </ul>

          <h3>Agregar Producto</h3>
          <form onSubmit={handleAddProduct}>
            <input
              name="name"
              placeholder="Nombre del producto"
              value={newProduct.name}
              onChange={handleChange}
              required
            />
            <input
              name="price"
              type="number"
              placeholder="Precio"
              value={newProduct.price}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              placeholder="Descripción"
              value={newProduct.description}
              onChange={handleChange}
              required
            />
            <button type="submit">Agregar Producto</button>
          </form>
        </>
      )}
    </div>
  );
}

export default ManageProducts;
