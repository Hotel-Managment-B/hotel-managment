"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase/Index";
import RegisterToiletries from "./RegisterToiletries";
import { FaTrash } from "react-icons/fa";

export interface Toiletry {
  id: string;
  code: string;
  name: string;
  quantity: number;
  purchaseValue: number;
}

const ListToiletries = () => {
  const [toiletries, setToiletries] = useState<Toiletry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchToiletries = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "toiletries"));
        const toiletriesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Toiletry[];
        setToiletries(toiletriesList);
      } catch (error) {
        console.error("Error al obtener los productos de aseo: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchToiletries();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Seguro que deseas eliminar este producto?"
    );
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "toiletries", id));
        setToiletries((prevToiletries) =>
          prevToiletries.filter((toiletry) => toiletry.id !== id)
        );
        alert("Producto eliminado exitosamente.");
      } catch (error) {
        console.error("Error al eliminar el producto: ", error);
        alert("Ocurrió un error al eliminar el producto.");
      }
    }
  };

  const handleProductAdded = (newProduct: Toiletry) => {
    setToiletries((prevToiletries) => [newProduct, ...prevToiletries]);
  };

  const filteredToiletries = toiletries.filter(
    (toiletry) =>
      toiletry.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toiletry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col sm:flex-row items-start min-h-screen mt-12 px-4 gap-4">
      <div className="sm:w-1/3 w-full">
        <RegisterToiletries onProductAdded={handleProductAdded} />
      </div>
      <div className="sm:w-2/3 w-full">
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-2">
          Productos de Aseo
        </h2>
        <div className="w-full flex justify-start mb-6">
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 sm:w-1/3 px-3 py-2 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {isLoading ? (
          <p className="text-blue-700 text-lg">Cargando datos...</p>
        ) : filteredToiletries.length === 0 ? (
          <p className="text-blue-700 text-lg">No hay datos para mostrar.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse border border-blue-400 text-sm sm:text-base">
              <thead>
                <tr className="bg-blue-200">
                  <th className="border border-blue-400 px-4 py-2">Código</th>
                  <th className="border border-blue-400 px-4 py-2">
                    Nombre del Producto
                  </th>
                  <th className="border border-blue-400 px-4 py-2">Cantidad</th>
                  <th className="border border-blue-400 px-4 py-2">
                    Valor de la Compra
                  </th>
                  <th className="border border-blue-400 px-4 py-2">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {filteredToiletries.map((toiletry) => (
                  <tr key={toiletry.id} className="text-center">
                    <td className="border border-blue-400 px-4 py-2">
                      {toiletry.code}
                    </td>
                    <td className="border border-blue-400 px-4 py-2">
                      {toiletry.name}
                    </td>
                    <td className="border border-blue-400 px-4 py-2">
                      {toiletry.quantity}
                    </td>
                    <td className="border border-blue-400 px-4 py-2">
                      ${toiletry.purchaseValue.toLocaleString("es-ES")}
                    </td>
                    <td className="border border-blue-400 px-4 py-2">
                      <button
                        onClick={() => handleDelete(toiletry.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListToiletries;
