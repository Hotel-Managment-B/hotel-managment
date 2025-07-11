"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/Index";
import { FaExclamationTriangle } from "react-icons/fa";

interface Product {
  id: string;
  code: string;
  productName: string;
  quantity: number;
}

interface StockAlertContextType {
  showAlert: boolean;
  lowStockProducts: Product[];
  closeAlert: () => void;
}

const StockAlertContext = createContext<StockAlertContextType | undefined>(undefined);

export const useStockAlert = () => {
  const context = useContext(StockAlertContext);
  if (!context) {
    throw new Error("useStockAlert must be used within a StockAlertProvider");
  }
  return context;
};

interface StockAlertProviderProps {
  children: React.ReactNode;
}

export const StockAlertProvider: React.FC<StockAlertProviderProps> = ({ children }) => {
  const [showAlert, setShowAlert] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  const checkProductStock = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Product));
      
      const lowStock = productsList.filter(product => product.quantity <= 0);
      if (lowStock.length > 0) {
        setLowStockProducts(lowStock);
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error checking product stock: ", error);
    }
  };

  const closeAlert = () => {
    setShowAlert(false);
    setLowStockProducts([]);
  };

  useEffect(() => {
    // Verificar stock inicial
    checkProductStock();
    
    // Configurar verificación automática cada 60 minutos
    const intervalId = setInterval(() => {
      checkProductStock();
    }, 60 * 60 * 1000); // 60 minutos
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <StockAlertContext.Provider value={{ showAlert, lowStockProducts, closeAlert }}>
      {children}
      {/* Popup global de alerta de stock */}
      {showAlert && (
        <div className="fixed inset-0 flex items-center justify-center bg-white-50 bg-opacity-50 z-[9999]">
          <div className="bg-white border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="text-red-500 text-2xl" />
              </div>
              <div className="ml-3 w-full">
                <h3 className="text-lg font-semibold text-red-800 mb-3">
                  ⚠️ Alerta de Inventario
                </h3>
                <div className="text-sm text-gray-700 mb-4">
                  <p className="font-medium mb-2">Los siguientes productos tienen stock agotado:</p>
                  <div className="max-h-40 overflow-y-auto">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="mb-2 p-2 bg-red-50 rounded border-l-2 border-red-300">
                        <p className="font-medium text-red-700">{product.productName}</p>
                        <p className="text-sm text-gray-600">
                          Código: {product.code} | Cantidad disponible: {product.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={closeAlert}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </StockAlertContext.Provider>
  );
};
