'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../../firebase/Index';
import { FaTimes } from 'react-icons/fa';
import { formatCurrency } from '../../utils/FormatCurrency';

const ToiletriesPurchase = () => {
  const [rows, setRows] = useState([{ description: '', quantity: '', total: '' }]);
  const [toiletries, setToiletries] = useState<string[]>([]);

  useEffect(() => {
    const fetchToiletries = async () => {
      const db = getFirestore(app);
      const toiletriesCollection = collection(db, 'toiletries');
      const snapshot = await getDocs(toiletriesCollection);
      const data = snapshot.docs.map(doc => doc.data().name);
      setToiletries(data);
    };
    fetchToiletries();
  }, []);

  const addRow = () => {
    setRows([...rows, { description: '', quantity: '', total: '' }]);
  };

  const handleInputChange = (index: number, field: keyof typeof rows[0], value: string) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = field === 'total' ? formatCurrency(value) : value;
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-blue-800 p-2 rounded-lg mt-16">
        <div className="p-4 bg-white rounded-md max-w-full shadow-2xl border-2 border-blue-200 mr-0 md:mr-4">
      <h1 className="text-lg font-semibold mb-4 text-blue-900">
        Compra de Artículos de Aseo
      </h1>

      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-4 gap-4 mb-4 items-center">
          <select
            value={row.description}
            onChange={(e) => handleInputChange(index, 'description', e.target.value)}
            className="p-2 border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full"
          >
            <option value="">Seleccione una opción</option>
            {toiletries.map((toiletry, idx) => (
              <option key={idx} value={toiletry}>{toiletry}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Cantidad"
            value={row.quantity}
            onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
            className="p-2 border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full"
          />

          <input
            type="text"
            placeholder="Total"
            value={row.total}
            onChange={(e) => handleInputChange(index, 'total', e.target.value)}
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
    <div className="flex justify-center items-center shadow-2xl border-2 border-blue-200 p-4 rounded-md">
        <p className="text-lg font-bold text-blue-900 mt-4">Total: {formatCurrency(calculateTotalSum())}</p>
    </div>
    </div>
  );
};

export default ToiletriesPurchase;
