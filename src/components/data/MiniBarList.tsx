'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc } from 'firebase/firestore';
import { app } from '../../firebase/Index';
import { getFirestore } from 'firebase/firestore';
import { formatCurrency } from '../../utils/FormatCurrency';
import { useRouter } from 'next/navigation';
import AddPurchase from './AddPurchase';

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

  const handlePurchaseSaved = () => {
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
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-full sm:w-1/2">
          <AddPurchase />
        </div>
        <div className="w-full sm:w-2/3 overflow-x-auto">
          <div className="flex justify-center items-center">
            <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">
              Historial de Compras del Mini Bar
            </h2>
          </div>

          <table className="min-w-full bg-white border border-blue-300 rounded-lg overflow-hidden">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Fecha</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Método de Pago</th>
                <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Total</th>
                <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                    {new Date(purchase.date?.seconds * 1000).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">{purchase.paymentMethod}</td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">{formatCurrency(purchase.total)}</td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-center">
                    <button
                      onClick={() => fetchDetails(purchase.id)}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md shadow-2xl border-2 border-blue-200 w-11/12 sm:w-2/3 max-h-3/4 overflow-y-auto">
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
