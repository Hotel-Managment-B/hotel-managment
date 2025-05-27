"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, getFirestore, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { app } from "../../firebase/Index";
import { FaTimes } from "react-icons/fa";
import { formatCurrency } from "../../utils/FormatCurrency";

interface ToiletriesPurchaseProps {
  onPurchaseSaved: () => void;
}

const ToiletriesPurchase: React.FC<ToiletriesPurchaseProps> = ({ onPurchaseSaved }) => {
  const [rows, setRows] = useState([
    { description: "", quantity: "", total: "" },
  ]);
  const [toiletries, setToiletries] = useState<string[]>([]);
  const [bankAccounts, setBankAccounts] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  useEffect(() => {
    const fetchToiletries = async () => {
      const db = getFirestore(app);
      const toiletriesCollection = collection(db, "toiletries");
      const snapshot = await getDocs(toiletriesCollection);
      const data = snapshot.docs.map((doc) => doc.data().name);
      setToiletries(data);
    };
    fetchToiletries();
  }, []);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      const db = getFirestore(app);
      const querySnapshot = await getDocs(collection(db, "bankAccount"));
      const accounts = querySnapshot.docs.map((doc) => doc.data().accountName);
      setBankAccounts(accounts);
    };

    fetchBankAccounts();
  }, []);

  const addRow = () => {
    setRows([...rows, { description: "", quantity: "", total: "" }]);
  };

  const handleInputChange = (
    index: number,
    field: keyof (typeof rows)[0],
    value: string
  ) => {
    const updatedRows = [...rows];
    updatedRows[index][field] =
      field === "total" ? formatCurrency(value) : value;
    setRows(updatedRows);
  };

  const removeRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  const calculateTotalSum = () => {
    return rows.reduce((sum, row) => {
      const numericValue = parseFloat(row.total.replace(/[^0-9]/g, "")) || 0;
      return sum + numericValue;
    }, 0);
  };

  const handleSavePurchase = async () => {
    if (!selectedAccount) {
      alert('Por favor, seleccione una cuenta.');
      return;
    }

    for (const row of rows) {
      if (!row.description || !row.quantity || !row.total) {
        alert('Por favor, complete todos los campos: producto, cantidad y total.');
        return;
      }
    }

    const db = getFirestore(app);

    try {
      // Crear el registro principal en la colección toiletriesPurchase
      const purchaseRef = await addDoc(collection(db, 'toiletriesPurchase'), {
        date: serverTimestamp(),
        paymentMethod: selectedAccount, // Método de pago seleccionado
        total: calculateTotalSum(), // Total calculado
      });

      // Crear la subcolección details
      const detailsRef = collection(purchaseRef, 'details');
      for (const row of rows) {
        await addDoc(detailsRef, {
          product: row.description, // Producto seleccionado
          quantity: row.quantity, // Cantidad
          total: row.total, // Total
        });

        // Actualizar la cantidad en la colección toiletries
        const toiletriesQuerySnapshot = await getDocs(
          collection(db, 'toiletries')
        );
        const matchingDoc = toiletriesQuerySnapshot.docs.find(
          (doc) => doc.data().name === row.description
        );

        if (matchingDoc) {
          const toiletriesDocRef = doc(db, 'toiletries', matchingDoc.id);
          await updateDoc(toiletriesDocRef, {
            quantity: increment(Number(row.quantity)),
          });
        }
      }

      // Actualizar el campo initialAmount en la colección bankAccount
      const bankAccountQuerySnapshot = await getDocs(
        collection(db, 'bankAccount')
      );
      const matchingAccountDoc = bankAccountQuerySnapshot.docs.find(
        (doc) => doc.data().accountName === selectedAccount
      );

      if (matchingAccountDoc) {
        const bankAccountDocRef = doc(db, 'bankAccount', matchingAccountDoc.id);
        await updateDoc(bankAccountDocRef, {
          initialAmount: increment(-calculateTotalSum()),
        });
      }

      alert('Compra guardada exitosamente');
      onPurchaseSaved(); // Llamar a la función para actualizar la lista
    } catch (error) {
      console.error('Error al guardar la compra:', error);
      alert('Hubo un error al guardar la compra');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid grid-cols-1 border-2 border-blue-200 shadow-2xl  p-2 rounded-lg max-w-7xl mt-16">
        <h1 className="text-lg font-semibold m-4 text-blue-900 ">
          Compra de Artículos de Aseo
        </h1>
        <div className="p-4 bg-white rounded-md max-w-full shadow-2xl border-2 border-blue-200 mt-4 mb-4">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-[3fr_2fr_2fr_auto] gap-4 mb-4 items-center"
            >
              <select
                value={row.description}
                onChange={(e) =>
                  handleInputChange(index, "description", e.target.value)
                }
                className="p-2 border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full"
              >
                <option value="">Seleccione un Producto</option>
                {toiletries.map((toiletry, idx) => (
                  <option key={idx} value={toiletry}>
                    {toiletry}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Cantidad"
                value={row.quantity}
                onChange={(e) =>
                  handleInputChange(index, "quantity", e.target.value)
                }
                className="p-2 border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full"
              />

              <input
                type="text"
                placeholder="Total"
                value={row.total}
                onChange={(e) =>
                  handleInputChange(index, "total", e.target.value)
                }
                className="p-2 border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full"
              />

              <button
                onClick={() => removeRow(index)}
                className="w-8 h-8 rounded-full  text-red-600 hover:text-red-800 flex items-center justify-center"
              >
                <FaTimes size={12} />
              </button>
            </div>
          ))}

          <button
            onClick={addRow}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Agregar Fila
          </button>
        </div>
        <div className=" shadow-2xl border-2 border-blue-200 p-4 rounded-md mt-4 mb-4">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="p-2 border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full"
          >
            <option value="">Seleccione una cuenta</option>
            {bankAccounts.map((account, idx) => (
              <option key={idx} value={account}>
                {account}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-center items-center shadow-2xl border-2 border-blue-200 p-4 rounded-md mt-4 mb-4">
          <p className="text-lg font-bold text-blue-900 mt-4">
            Total: {formatCurrency(calculateTotalSum())}
          </p>
          <button
            onClick={handleSavePurchase}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Guardar Compra
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToiletriesPurchase;
