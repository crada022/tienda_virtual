import { Routes, Route } from "react-router-dom";
import PublicStore from "../pages/PublicStore";

export default function PublicRouter() {
  return (
    <Routes>
      <Route path="/store/:storeId" element={<PublicStore />} />
    </Routes>
  );
}
