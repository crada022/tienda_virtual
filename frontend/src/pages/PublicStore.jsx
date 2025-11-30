import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStorePublic, getProductsPublic } from "../api/storesApi";
import "../styles/publicStore.css";
import PublicNavBar from "../components/PublicNavBar";

export default function PublicStore() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function load() {
      const s = await getStorePublic(storeId);
      const p = await getProductsPublic(storeId);
      setStore(s);
      setProducts(p);
    }
    load();
  }, [storeId]);

  if (!store) return <div className="loader"></div>;

 return (
  <div className="public-store">
    
    <PublicNavBar />   {/* ← AQUÍ */}

    {/* Banner */}
    <header className="store-hero">
      <div className="overlay"></div>
      <div className="hero-content">
        <h1>{store.name}</h1>
        <p>{store.description || "Bienvenido a nuestra tienda"}</p>
      </div>
    </header>

    {/* Contenido */}
    <section className="products-section">
      <h2>Productos</h2>

      <div className="products-grid">
        {products.map((p) => (
          <div key={p.id} className="product-card">
            <img src={p.imageUrl} alt={p.name} />
            <h3>{p.name}</h3>
            <p className="price">${p.price}</p>
            <button className="btn-add">Agregar al carrito</button>
          </div>
        ))}
      </div>
    </section>
  </div>
);

}
