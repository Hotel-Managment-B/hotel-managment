'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, Timestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/Index';
import { formatCurrency } from '../../utils/FormatCurrency';

interface LoanData {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Timestamp;
  salary: number;
  loanAmount: number;
  installments: number;
  installmentAmount: number;
  status: 'active' | 'completed';
  remainingInstallments: number;
}

const LoanHistory: React.FC = () => {
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setIsLoading(true);
        // Crear una consulta ordenada por fecha descendente (más recientes primero)
        const loansQuery = query(collection(db, 'loanEmployee'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(loansQuery);
        
        const loansList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LoanData[];
        
        setLoans(loansList);
        setError(null);
      } catch (error) {
        console.error('Error al cargar los préstamos:', error);
        setError('Error al cargar la lista de préstamos. Por favor, intente de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, []);

  // Función para formatear la fecha desde Timestamp
  const formatDate = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Historial de Préstamos a Empleados</h2>
      
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-800">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center">
          <p className="text-blue-700">Cargando préstamos...</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="flex justify-center">
          <p className="text-blue-700">No hay préstamos registrados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-blue-300 rounded-lg overflow-hidden">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Fecha</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Empleado</th>
                <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Monto Préstamo</th>
                <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Cuotas</th>
                <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Monto por Cuota</th>
                <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                    {loan.date ? formatDate(loan.date) : 'Sin fecha'}
                  </td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                    {loan.employeeName}
                  </td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">
                    {formatCurrency(loan.loanAmount)}
                  </td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-center">
                    {loan.installments} ({loan.remainingInstallments} restantes)
                  </td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">
                    {formatCurrency(loan.installmentAmount)}
                  </td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-center">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        loan.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {loan.status === 'active' ? 'Activo' : 'Completado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LoanHistory;
