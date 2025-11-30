// src/modules/ai/ai.service.js
export const createStoreFromTemplate = async (template) => {
  try {
    // Procesamos la plantilla seleccionada y generamos la tienda
    const storeData = {
      name: template.storeName,
      products: template.products, // Productos generados en la plantilla
      layout: template.layout,     // Estructura de la tienda
    };

    // Guarda la tienda en la base de datos
    // Por ejemplo:
    // const store = new Store(storeData);
    // await store.save();

    return storeData;
  } catch (error) {
    console.error("Error al crear la tienda desde plantilla:", error);
    throw new Error("Error al crear la tienda");
  }
};
