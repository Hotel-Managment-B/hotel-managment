"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/Index";

interface ToiletriesSpentItem {
  date: { seconds: number };
  item: string;
  quantity: number;
  room: number;
  notes: string;
}

interface ToiletriesSpentListProps {
  refresh: boolean;
}

const ToiletriesSpentList: React.FC<ToiletriesSpentListProps> = ({
  refresh,
}) => {
  const [spentItems, setSpentItems] = useState<ToiletriesSpentItem[]>([]);
  const [modalContent, setModalContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSpentItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "toiletriesSpent"));
        const items = querySnapshot.docs.map(
          (doc) => doc.data() as ToiletriesSpentItem
        );
        setSpentItems(items);
      } catch (error) {
        console.error(
          "Error al obtener los datos de la colección toiletriesSpent:",
          error
        );
      }
    };
    fetchSpentItems();
  }, [refresh]);

  const handleOpenModal = (notes: string) => {
    setModalContent(notes);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalContent("");
  };
  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">
        Historial de Gastos de Artículos de Aseo
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-blue-300 rounded-lg overflow-hidden">          <thead className="bg-blue-100">
            <tr>
              <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Fecha</th>
              <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Artículo</th>
              <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Cantidad</th>
              <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Habitación</th>
              <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Notas</th>
            </tr>
          </thead>
          <tbody>
            {spentItems.map((item, index) => (
              <tr key={index} className="hover:bg-blue-50 transition-colors">
                <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                  {new Date(item.date.seconds * 1000).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </td>
                <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                  {item.item}
                </td>
                <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-center">
                  {item.quantity}
                </td>
                <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-center">
                  Habitación {item.room}
                </td>
                <td className="py-3 px-4 border-b border-blue-200 text-sm text-center">
                  <button
                    onClick={() => handleOpenModal(item.notes)}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Ver Notas
                  </button>
                </td>              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl border-2 border-blue-200 w-11/12 sm:w-2/3 md:w-1/2 max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-blue-900">Notas</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-800 p-3 bg-blue-50 rounded-md">{modalContent}</p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToiletriesSpentList;
