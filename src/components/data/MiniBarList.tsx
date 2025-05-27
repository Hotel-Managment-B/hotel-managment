'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc } from 'firebase/firestore';
import { app } from '../../firebase/Index';
import { getFirestore } from 'firebase/firestore';
import { formatCurrency } from '../../utils/FormatCurrency';
import { useRouter } from 'next/navigation';

interface MiniBarPurchase {
  id: string;
  date: { seconds: number };
  paymentMethod: string;
  total: string;
}

const MiniBarList = () => {
  const [purchases, setPurchases] = useState<MiniBarPurchase[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<{ description: string; quantity: number; subtotal: string; unitPrice: string }[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPurchases = async () => {
      const db = getFirestore(app);
      const querySnapshot = await getDocs(collection(db, 'miniBarPurchases'));
      const purchasesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        date: doc.data().date,
        paymentMethod: doc.data().paymentMethod,
        total: doc.data().total,
      }));
      setPurchases(purchasesData);
    };

    fetchPurchases();
  }, []);

  const fetchDetails = async (purchaseId: string) => {
    const db = getFirestore(app);
    const detailsRef = collection(doc(db, 'miniBarPurchases', purchaseId), 'details');
    const querySnapshot = await getDocs(detailsRef);
    const detailsData = querySnapshot.docs.map(doc => ({
      description: doc.data().description,
      quantity: doc.data().quantity,
      subtotal: doc.data().subtotal,
      unitPrice: doc.data().unitPrice,
    }));
    setSelectedDetails(detailsData);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 mt-12">
        <h2 className="text-lg font-bold text-center text-blue-900">Lista de Compras del Mini Bar</h2>
        <button
          onClick={() => router.push('/minibar-purchase')}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Comprar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border border-gray-300 text-sm sm:text-base">
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-gray-300 px-4 py-2">Fecha</th>
              <th className="border border-gray-300 px-4 py-2">Método de Pago</th>
              <th className="border border-gray-300 px-4 py-2">Total</th>
              <th className="border border-gray-300 px-4 py-2">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id} className="text-center">
                <td className="border border-gray-300 px-4 py-2">{new Date(purchase.date?.seconds * 1000).toLocaleDateString()}</td>
                <td className="border border-gray-300 px-4 py-2">{purchase.paymentMethod}</td>
                <td className="border border-gray-300 px-4 py-2">{formatCurrency(purchase.total)}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    onClick={() => fetchDetails(purchase.id)}
                    className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md shadow-md w-11/12 sm:w-2/3 max-h-3/4 overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Detalles</h3>
            <div className="grid grid-cols-4 gap-4">
              <span className="font-bold">Descripción</span>
              <span className="font-bold">Cantidad</span>
              <span className="font-bold">Subtotal</span>
              <span className="font-bold">Precio Unitario</span>
            </div>
            <div className="mt-4">
              {selectedDetails?.map((detail, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 mb-2">
                  <span>{detail.description}</span>
                  <span>{detail.quantity}</span>
                  <span>{detail.subtotal}</span>
                  <span>{detail.unitPrice}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniBarList;
