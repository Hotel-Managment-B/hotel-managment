'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/Index';

interface AdministrativeExpense {
  date: { seconds: number };
  concept: string;
  value: string;
  bank: string;
}

interface AdministrativeExpensesListProps {
  refresh: boolean;
}

const AdministrativeExpensesList: React.FC<AdministrativeExpensesListProps> = ({ refresh }) => {
  const [expenses, setExpenses] = useState<AdministrativeExpense[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const expensesQuery = query(collection(db, 'administrativeExpenses'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(expensesQuery);
        const expensesData = querySnapshot.docs.map(doc => doc.data() as AdministrativeExpense);
        setExpenses(expensesData);
      } catch (error) {
        console.error('Error al obtener los gastos administrativos:', error);
      }
    };
    fetchExpenses();
  }, [refresh]);

  return (
    <>
    <div className="text-center mt-8">
        <h1 className="text-sm md:text-lg font-bold text-blue-800">Historial de Gastos Administrativos</h1>
    </div>
    <div className="bg-white p-8 shadow-lg rounded-lg">
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-blue-100 px-4 py-2">Fecha</th>
            <th className="border border-gray-300 bg-blue-100 px-4 py-2">Concepto</th>
            <th className="border border-gray-300 bg-blue-100 px-4 py-2">Valor</th>
            <th className="border border-gray-300 bg-blue-100 px-4 py-2">Banco</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense, index) => (
            <tr key={index}>
              <td className="border border-gray-300 px-4 py-2">{new Date(expense.date.seconds * 1000).toLocaleDateString()}</td>
              <td className="border border-gray-300 px-4 py-2">{expense.concept}</td>
              <td className="border border-gray-300 px-4 py-2">{expense.value}</td>
              <td className="border border-gray-300 px-4 py-2">{expense.bank}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
    
  );
};

export default AdministrativeExpensesList;
