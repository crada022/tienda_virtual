import "./styles/publicStore.css";
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
import StoreAuthModal from "./components/StoreAuthModal";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import Index from "./pages/index";

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
       <Route path="/" element={<Index />} />
  {/* Auth */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />



  {/* ⭐ NUEVA RUTA PÚBLICA POR SLUG */}
   <Route path="/store/:slug" element={<PublicStore />} />
   <Route path="/store/:slug/products" element={<StoreProducts />} />
    <Route path="/store/:slug/products/:productId" element={<ProductDetail />} />
    <Route path="/store/:slug/cart" element={<StoreCart />} />
    <Route path="/store/:slug/checkout" element={<StoreCheckout />} />
    <Route path="/store/:slug/reviews" element={<StoreReviews />} />
    <Route path="/store/:slug/account" element={<StoreProfile />} />
    <Route path="/store/:slug/orders" element={<StoreOrders />} />
    <Route path="/store/:slug/checkout/success" element={<CheckoutSuccess />} />
    <Route path="/store/:slug/checkout/cancel" element={<CheckoutCancel />} />   
  
  {/* Layout protegido */}
  <Route element={<ProtectedLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/stores/create" element={<CreateStore />} />
    <Route path="/stores/list" element={<StoresList />} />
    <Route path="/stores/:storeId/manage-products" element={<ManageProducts />} />
    <Route path="/stores/:storeId/edit" element={<EditStore />} />
    <Route path="/account" element={<Account />} />
  </Route>
</Routes>
<StoreAuthModal />
    </BrowserRouter>
  );
  
}

export default App;
