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
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
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
    setIsPurchaseModalOpen(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="flex flex-col gap-6">
        <div className="w-full overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-800 text-center flex-1">
              Historial de Compras del Mini Bar
            </h2>
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap ml-4"
            >
              Compras mini bar
            </button>
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

      {/* Modal para Compras Mini Bar */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-200 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-blue-200 p-4 sm:p-6 flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-900">Compras Mini Bar</h3>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <AddPurchase />
            </div>
          </div>
        </div>
      )}

      {/* Modal para Detalles de Compra */}
      {/* Modal para Detalles de Compra */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl border-2 border-blue-200 w-11/12 sm:w-2/3 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-blue-900">Detalles de la Compra</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-3 bg-blue-100 p-3 rounded-md">
              <span className="font-bold text-blue-900 text-sm">Descripción</span>
              <span className="font-bold text-blue-900 text-sm">Cantidad</span>
              <span className="font-bold text-blue-900 text-sm">Subtotal</span>
              <span className="font-bold text-blue-900 text-sm">Precio Unitario</span>
            </div>
            <div className="mt-2 divide-y divide-blue-200">
              {selectedDetails?.map((detail, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 py-3 hover:bg-blue-50 transition-colors">
                  <span className="text-sm text-gray-800">{detail.description}</span>
                  <span className="text-sm text-gray-800">{detail.quantity}</span>
                  <span className="text-sm text-gray-800">{formatCurrency(detail.subtotal)}</span>
                  <span className="text-sm text-gray-800">{formatCurrency(detail.unitPrice)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setIsModalOpen(false)}
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

export default MiniBarList;
