import { useAuth } from "./store/useAuth";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import CreateStore from "./pages/CreateStore";
import Login from "./pages/Login";
import StoresList from "./pages/StoresList";
import ManageProducts from "./pages/ManageProducts";
import NavBar from "./components/NavBar";
import Checkout from "./pages/Checkout";
import PublicStore from "./pages/PublicStore";
import StoreProducts from "./pages/StoreProducts";
import ProductDetail from "./pages/ProductDetail";
import StoreCart from "./pages/StoreCart";
import StoreCheckout from "./pages/StoreCheckout";
import StoreAccount from "./pages/StoreAccount";
import StoreProfile from "./pages/StoreProfile";
import StoreOrders from "./pages/StoreOrders";
import EditStore from "./pages/EditStore";
import Orders from "./pages/Orders";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import PublicReviews from "./pages/PublicReviews";
import StoreReviews from "./pages/StoreReviews";

function ProtectedLayout() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/" />;

  return (
    <>
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}

function App() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas / auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={token ? <Navigate to="/stores/create" /> : <Navigate to="/login" />} />

        {/* RUTAS PÚBLICAS DE TIENDAS (SPA routes) */}
        <Route path="/stores/:storeId/reviews" element={<StoreReviews />} />
        <Route path="/store/:storeId/reviews" element={<PublicReviews />} />
        <Route path="/stores/:storeId" element={<PublicStore />} />
        <Route path="/stores/:storeId/products" element={<StoreProducts />} />
        <Route path="/stores/:storeId/products/:productId" element={<ProductDetail />} />
        <Route path="/stores/:storeId/cart" element={<StoreCart />} />
        <Route path="/stores/:storeId/checkout" element={<StoreCheckout />} />
        {/* Rutas públicas de cuenta separadas: perfil y pedidos */}
        <Route path="/stores/:storeId/account" element={<StoreProfile />} />
        <Route path="/stores/:storeId/orders" element={<StoreOrders />} />
          
          <Route path="/cart/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />  
        {/* Layout protegido (NavBar + main) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stores/:storeId/edit" element={<EditStore />} />
          <Route path="/stores/create" element={<CreateStore />} />
          <Route path="/stores/list" element={<StoresList />} />
          <Route path="/stores/:storeId/manage-products" element={<ManageProducts />} />
          
          <Route path="/account" element={<Account />} />
          {/* si entras al root estando autenticado, redirige dentro del layout */}
          <Route path="/" element={<Navigate to="/stores/create" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
