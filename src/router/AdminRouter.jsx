import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import StoresList from "../pages/StoresList";
import CreateStore from "../pages/CreateStore";
import ManageProducts from "../pages/ManageProducts";
import { useAuth } from "../store/useAuth";

export default function AdminRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      {isAuthenticated && (
        <>
          <Route path="/stores" element={<StoresList />} />
          <Route path="/stores/create" element={<CreateStore />} />
          <Route path="/stores/:id/products" element={<ManageProducts />} />
        </>
      )}
      {!isAuthenticated && <Route path="*" element={<Navigate to="/" />} />}
    </Routes>
  );
}
