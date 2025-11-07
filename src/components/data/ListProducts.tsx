"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/Index";
import RegisterProducts from "./RegisterProducts";
import { FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductAdded = () => {
    fetchProducts();
    closeModal();
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("¿Seguro que desea eliminar este registro?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "products", id));
        setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id));
        toast.success("Registro eliminado exitosamente.");
      } catch (error) {
        console.error("Error eliminando el registro: ", error);
        toast.error("Ocurrió un error al eliminar el registro.");
      }
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const checkIfCodeExists = async (code: string, currentId: string) => {
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.some(
      (doc) => doc.id !== currentId && (doc.data() as Product).code === code
    );
  };

  const handleProductUpdate = async (updatedData: Product) => {
    try {
      if (updatedData.id) {
        const productRef = doc(db, "products", updatedData.id);
        await updateDoc(productRef, {
          productName: updatedData.productName,
          totalValue: updatedData.totalValue,
          quantity: updatedData.quantity,
          unitPurchaseValue: updatedData.unitPurchaseValue,
          unitSaleValue: updatedData.unitSaleValue,
          date: updatedData.date,
        });
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === updatedData.id ? updatedData : product
          )
        );
        closeModal();
      }
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center min-h-screen mt-12 px-4">
      {isLoading ? (
        <p className="text-blue-700 text-lg">Cargando inventario...</p>
      ) : products.length === 0 ? (
        <p className="text-blue-700 text-lg">No has cargado productos al inventario.</p>
      ) : (
        <>
          <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
          </div>          <div className="w-full overflow-x-auto">            <table className="min-w-full bg-white border border-blue-300 rounded-lg overflow-hidden">
              <thead className="bg-blue-100">
                <tr>
                  <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Fecha</th>
                  <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Código</th>
                  <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Nombre del Producto</th>
                  <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Cantidad</th>
                  <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Valor Total</th>
                  <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Valor Unitario de Compra</th>
                  <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Valor Unitario de Venta</th>
                  <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                      {product.date || "N/A"}
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">{product.code}</td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                      {product.productName}
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-center">
                      {product.quantity}
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">
                      ${product.totalValue?.toLocaleString("es-ES")}
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">
                      ${product.unitPurchaseValue?.toLocaleString("es-ES")}
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">
                      ${product.unitSaleValue?.toLocaleString("es-ES")}
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleEdit(product)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(product.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-blue-100 bg-opacity-50 pt-22 overflow-y-auto max-h-screen">
          <div className="bg-blue-100 p-6 rounded-md shadow-md w-full max-w-lg relative">
            <button
              onClick={closeModal}
              className="mt-4 ml-8 md:ml-0 mb-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Cerrar
            </button>
            <RegisterProducts
              onProductAdded={handleProductAdded}
              onProductUpdated={handleProductUpdate} // Pasar la función de actualización
              initialData={selectedProduct} // Pasar datos del producto seleccionado
              title={selectedProduct ? "Actualizar Producto Mini Bar" : "Registrar Producto en el Mini Bar"}
              buttonText={selectedProduct ? "Actualizar Producto" : "Registrar Producto"}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProducts;