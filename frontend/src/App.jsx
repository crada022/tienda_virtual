import { useAuth } from "./store/useAuth";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateStore from "./pages/CreateStore";
import Login from "./pages/Login";
import StoresList from "./pages/StoresList";
import ManageProducts from "./pages/ManageProducts";  // Página para gestionar productos
import NavBar from "./components/NavBar";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

function App() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={token ? <Navigate to="/stores/create" /> : <Login />} />
          <Route path="/stores/create" element={token ? <CreateStore /> : <Navigate to="/" />} />
          <Route path="/stores/list" element={token ? <StoresList /> : <Navigate to="/" />} />
          <Route path="/stores/:storeId/manage-products" element={token ? <ManageProducts /> : <Navigate to="/" />} /> {/* Ruta para gestionar productos */}
          {/* Rutas de carrito */}
          <Route path="/cart" element={token ? <Cart /> : <Navigate to="/" />} />
          <Route path="/cart/checkout" element={token ? <Checkout /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
