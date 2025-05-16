"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/Index";
import RegisterProducts from "./RegisterProducts";

interface Product {
  id: string;
  date?: string;
  code: string;
  productName: string;
  quantity: number;
  totalValue: number;
  unitPurchaseValue: number;
  unitSaleValue: number;
}

const ListProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
        .sort((a, b) => (a.date || "").localeCompare(b.date || "")); // Sort by date to ensure order of saving
      setProducts(productsList);
    } catch (error) {
      console.error("Error fetching products: ", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductAdded = () => {
    fetchProducts();
    closeModal();
  };

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center min-h-screen mt-12 px-4">
      <h2 className="text-3xl font-bold text-center text-blue-900 mb-6">Inventario</h2>
      <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={openModal}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Registrar Productos
        </button>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse border border-blue-400 text-sm sm:text-base">
          <thead>
            <tr className="bg-blue-200">
              <th className="border border-blue-400 px-4 py-2">Fecha</th>
              <th className="border border-blue-400 px-4 py-2">Código</th>
              <th className="border border-blue-400 px-4 py-2">Nombre del Producto</th>
              <th className="border border-blue-400 px-4 py-2">Cantidad</th>
              <th className="border border-blue-400 px-4 py-2">Valor Total</th>
              <th className="border border-blue-400 px-4 py-2">Valor Unitario de Compra</th>
              <th className="border border-blue-400 px-4 py-2">Valor Unitario de Venta</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="text-center">
                <td className="border border-blue-400 px-4 py-2">
                  {product.date || "N/A"}
                </td>
                <td className="border border-blue-400 px-4 py-2">{product.code}</td>
                <td className="border border-blue-400 px-4 py-2">
                  {product.productName}
                </td>
                <td className="border border-blue-400 px-4 py-2">
                  {product.quantity}
                </td>
                <td className="border border-blue-400 px-4 py-2">
                  ${product.totalValue?.toLocaleString("es-ES")}
                </td>
                <td className="border border-blue-400 px-4 py-2">
                  ${product.unitPurchaseValue?.toLocaleString("es-ES")}
                </td>
                <td className="border border-blue-400 px-4 py-2">
                  ${product.unitSaleValue?.toLocaleString("es-ES")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-blue-100 bg-opacity-50">
          <div className="bg-blue-100 p-6 rounded-md shadow-md w-full max-w-lg relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 h-6 w-6 mt-4 text-2xl"
            >
              &times;
            </button>
            <RegisterProducts onProductAdded={handleProductAdded} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProducts;
