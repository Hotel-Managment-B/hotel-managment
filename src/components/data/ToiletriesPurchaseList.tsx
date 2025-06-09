"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, query, orderBy } from "firebase/firestore";
import { app } from "../../firebase/Index";
import { getFirestore } from "firebase/firestore";
import { formatCurrency } from "../../utils/FormatCurrency";
import ToiletriesPurchase from "./ToiletriesPurchase";

interface Purchase {
  id: string;
  date: { seconds: number };
  paymentMethod: string;
  total: string;
}

const ToiletriesPurchaseList = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<
    { product: string; quantity: number; total: string }[] | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPurchases = async () => {
      const db = getFirestore(app);
      const purchasesQuery = query(
        collection(db, "toiletriesPurchase"),
        orderBy("date", "asc")
      );
      const querySnapshot = await getDocs(purchasesQuery);
      const purchasesData = querySnapshot.docs.map((doc) => ({
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
    const detailsRef = collection(
      doc(db, "toiletriesPurchase", purchaseId),
      "details"
    );
    const querySnapshot = await getDocs(detailsRef);
    const detailsData = querySnapshot.docs.map((doc) => ({
      product: doc.data().product,
      quantity: doc.data().quantity,
      total: doc.data().total,
    }));
    setSelectedDetails(detailsData);
    setIsModalOpen(true);
  };

  const handlePurchaseSaved = () => {
    const fetchPurchases = async () => {
      const db = getFirestore(app);
      const purchasesQuery = query(
        collection(db, "toiletriesPurchase"),
        orderBy("date", "asc")
      );
      const querySnapshot = await getDocs(purchasesQuery);
      const purchasesData = querySnapshot.docs.map((doc) => ({
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
    <div className="p-4 bg-white rounded-md">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <ToiletriesPurchase onPurchaseSaved={handlePurchaseSaved} />
        </div>
        <div className="w-full sm:w-2/3 overflow-x-auto">
          <div className="flex justify-center items-center">
            <h2 className="text-sm md:text-lg font-bold mb-4 text-center text-blue-900 mt-4 w-full bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg">
              Historial de Compras de Artículos de Aseo
            </h2>
          </div>

          <table className="table-auto w-full border-collapse border border-gray-300 text-sm sm:text-base">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-gray-300 px-4 py-2">Fecha</th>
                <th className="border border-gray-300 px-4 py-2">
                  Método de Pago
                </th>
                <th className="border border-gray-300 px-4 py-2">Total</th>
                <th className="border border-gray-300 px-4 py-2">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="text-center">
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(
                      purchase.date?.seconds * 1000
                    ).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {purchase.paymentMethod}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {formatCurrency(purchase.total)}
                  </td>
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md shadow-md w-11/12 sm:w-2/3 max-h-3/4 overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Detalles</h3>
            <div className="grid grid-cols-3 gap-4">
              <span className="font-bold">Producto</span>
              <span className="font-bold">Cantidad</span>
              <span className="font-bold">Total</span>
            </div>
            <div className="mt-4">
              {selectedDetails?.map((detail, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 mb-2">
                  <span>{detail.product}</span>
                  <span>{detail.quantity}</span>
                  <span>{detail.total}</span>
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

export default ToiletriesPurchaseList;
