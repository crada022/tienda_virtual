import { createContext, useContext, useState } from "react";

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [currentStoreId, setCurrentStoreId] = useState(null);

  return (
    <StoreContext.Provider value={{ currentStoreId, setCurrentStoreId }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreContext debe usarse dentro de <StoreProvider>");
  return ctx;
}
