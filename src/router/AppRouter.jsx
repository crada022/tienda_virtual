import { BrowserRouter, Routes, Route } from "react-router-dom";
import CreateStore from "../pages/CreateStore";
import StoresList from "../pages/StoresList";
import PublicStore from "../pages/PublicStore";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/create-store" element={<CreateStore />} />
        <Route path="/stores" element={<StoresList />} />

        {/* Vista pública automática */}
        <Route path="/store/:storeId" element={<PublicStore />} />

        {/* Home temporal */}
        <Route path="/" element={<StoresList />} />
      </Routes>
    </BrowserRouter>
  );
}
