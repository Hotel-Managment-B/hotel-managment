'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/Index';

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

const ToiletriesSpentList: React.FC<ToiletriesSpentListProps> = ({ refresh }) => {
  const [spentItems, setSpentItems] = useState<ToiletriesSpentItem[]>([]);
  const [modalContent, setModalContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSpentItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'toiletriesSpent'));
        const items = querySnapshot.docs.map(doc => doc.data() as ToiletriesSpentItem);
        setSpentItems(items);
      } catch (error) {
        console.error('Error al obtener los datos de la colección toiletriesSpent:', error);
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
    setModalContent('');
  };

  return (
    <div className="bg-white p-8 shadow-lg rounded-lg mt-4 md:mt-8">
        <div className='flex justify-center items-center'>
        <h1 className="text-sm md:text-lg font-bold text-blue-800 mb-4">Historial de Gastos de Artículos de Aseo</h1>
        </div>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2 bg-blue-100">Fecha</th>
            <th className="border border-gray-300 px-4 py-2 bg-blue-100">Artículo</th>
            <th className="border border-gray-300 px-4 py-2 bg-blue-100">Cantidad</th>
            <th className="border border-gray-300 px-4 py-2 bg-blue-100">Habitación</th>
            <th className="border border-gray-300 px-4 py-2 bg-blue-100">Notas</th>
          </tr>
        </thead>
        <tbody>
          {spentItems.map((item, index) => (
            <tr key={index}>
              <td className="border border-gray-300 px-4 py-2">{new Date(item.date.seconds * 1000).toLocaleDateString()}</td>
              <td className="border border-gray-300 px-4 py-2">{item.item}</td>
              <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
              <td className="border border-gray-300 px-4 py-2">Habitación {item.room}</td>
              <td className="border border-gray-300 px-4 py-2 flex justify-center">
                <button
                  onClick={() => handleOpenModal(item.notes)}
                  className="bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700"
                >
                  Ver Notas
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-2xl border border-blue-200">
            <h2 className="text-xl font-bold mb-4">Notas</h2>
            <p>{modalContent}</p>
            <button
              onClick={handleCloseModal}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToiletriesSpentList;
