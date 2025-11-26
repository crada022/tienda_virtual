import { useEffect, useState } from "react";
import { Link } from "react-router-dom";  // Importamos el componente Link para la navegación
import { getStores } from "../api/services/storeService"; // Necesitarás un servicio para obtener las tiendas

function StoresList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const result = await getStores();  // Llamamos al servicio para obtener las tiendas
        console.log(result);  // Verifica el resultado de la API en la consola

        // Accede al array de tiendas desde 'result.stores'
        setStores(result.stores); // Aquí estamos extrayendo el array de tiendas
      } catch (err) {
        console.error(err);
        alert("Error cargando las tiendas");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Mis Tiendas</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <ul>
          {stores.length > 0 ? (
            stores.map((store) => (
              <li key={store.id}>
                {/* Enlace a la página de gestión de productos de la tienda */}
                <Link to={`/stores/${store.id}/manage-products`}>
                  <h3>{store.name}</h3>
                </Link>
                <p>{store.address}</p>
                <p>{store.description}</p>
              </li>
            ))
          ) : (
            <p>No se encontraron tiendas.</p>
          )}
        </ul>
      )}
    </div>
  );
}

export default StoresList;
