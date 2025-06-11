'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, Timestamp, orderBy, query, doc, updateDoc, writeBatch } from 'firebase/firestore';
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
  // Campos calculados (no están en la BD)
  calculatedRemainingInstallments?: number;
  calculatedStatus?: 'active' | 'completed';
  nextPaymentDate?: Date;
  progressPercentage?: number;
  fortnightsPassed?: number;
}

const LoanHistory: React.FC = () => {
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Función para calcular cuántas quincenas han pasado desde una fecha
  const calculateFortnightsPassed = (startDate: Date): number => {
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 15); // Cada 15 días es una quincena
  };

  // Función para calcular la próxima fecha de pago (siguiente quincena)
  const calculateNextPaymentDate = (startDate: Date, fortnightsPassed: number): Date => {
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setDate(nextPaymentDate.getDate() + ((fortnightsPassed + 1) * 15));
    return nextPaymentDate;
  };

  // Función para calcular datos automáticamente
  const calculateLoanData = (loan: LoanData): LoanData => {
    const startDate = loan.date.toDate();
    const fortnightsPassed = calculateFortnightsPassed(startDate);
    
    const calculatedRemainingInstallments = Math.max(0, loan.installments - fortnightsPassed);
    const calculatedStatus: 'active' | 'completed' = calculatedRemainingInstallments > 0 ? 'active' : 'completed';
    const nextPaymentDate = calculatedStatus === 'active' ? calculateNextPaymentDate(startDate, fortnightsPassed) : null;
    const progressPercentage = Math.min(100, Math.round((fortnightsPassed / loan.installments) * 100));

    return {
      ...loan,
      calculatedRemainingInstallments,
      calculatedStatus,
      nextPaymentDate: nextPaymentDate || undefined,
      progressPercentage,
      fortnightsPassed
    };
  };
  // Función para cargar préstamos desde Firebase
  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      // Crear una consulta ordenada por fecha descendente (más recientes primero)
      const loansQuery = query(collection(db, 'loanEmployee'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(loansQuery);
      
      const loansList = querySnapshot.docs.map((doc) => {
        const loanData = {
          id: doc.id,
          ...doc.data(),
        } as LoanData;
        
        // Calcular datos automáticamente
        return calculateLoanData(loanData);
      });
      
      setLoans(loansList);
      setFilteredLoans(loansList); // Inicializar los préstamos filtrados
      setError(null);
    } catch (error) {
      console.error('Error al cargar los préstamos:', error);
      setError('Error al cargar la lista de préstamos. Por favor, intente de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar los préstamos en la base de datos
  const updateLoanStatuses = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const batch = writeBatch(db);
      let updatedCount = 0;

      for (const loan of loans) {
        const calculatedData = calculateLoanData(loan);
        
        // Solo actualizar si hay cambios
        if (
          calculatedData.calculatedRemainingInstallments !== loan.remainingInstallments ||
          calculatedData.calculatedStatus !== loan.status
        ) {
          const loanRef = doc(db, 'loanEmployee', loan.id);
          batch.update(loanRef, {
            remainingInstallments: calculatedData.calculatedRemainingInstallments,
            status: calculatedData.calculatedStatus
          });
          updatedCount++;
        }
      }      if (updatedCount > 0) {
        await batch.commit();
        setSuccessMessage(`Se actualizaron ${updatedCount} préstamos exitosamente.`);
        // Recargar los datos
        await fetchLoans();
      } else {
        setSuccessMessage('Todos los préstamos ya están actualizados.');
      }

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error al actualizar préstamos:', error);
      setError('Error al actualizar los préstamos. Por favor, intente de nuevo.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Función para filtrar préstamos por nombre de empleado
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredLoans(loans);
    } else {
      const filtered = loans.filter(loan =>
        loan.employeeName.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredLoans(filtered);
    }
  };

  // Función para limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
    setFilteredLoans(loans);
  };  useEffect(() => {
    fetchLoans();
  }, []);

  // Efecto para filtrar cuando cambie la lista de préstamos
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLoans(loans);
    } else {
      const filtered = loans.filter(loan =>
        loan.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLoans(filtered);
    }
  }, [loans, searchTerm]);

  // Función para formatear la fecha desde Timestamp
  const formatDate = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para formatear fechas normales
  const formatDateNormal = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para determinar si un préstamo está próximo a completarse (2 cuotas o menos)
  const isNearCompletion = (loan: LoanData): boolean => {
    const remaining = loan.calculatedRemainingInstallments ?? loan.remainingInstallments;
    return remaining <= 2 && remaining > 0;
  };

  // Función para obtener el color de progreso
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };
  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-800">Historial de Préstamos a Empleados</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 flex-col sm:flex-row gap-3 w-full lg:w-auto mt-8">
          {/* Buscador */}
          <div className="relative flex-1 lg:flex-initial">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre de empleado..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Botón de actualizar */}
          <button
            onClick={updateLoanStatuses}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Actualizando...
              </>
            ) : (
              'Actualizar Estados'
            )}
          </button>
        </div>
      </div>

      {/* Mostrar información de búsqueda */}
      {searchTerm && (
        <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              Mostrando {filteredLoans.length} de {loans.length} préstamos para "{searchTerm}"
            </p>
            {filteredLoans.length === 0 && (
              <button
                onClick={clearSearch}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>
      )}      {/* Alertas para préstamos próximos a completarse */}
      {filteredLoans.filter(isNearCompletion).length > 0 && (
        <div className="mb-4 p-4 rounded-md bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Préstamos próximos a completarse
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {filteredLoans.filter(isNearCompletion).map((loan) => (
                    <li key={loan.id}>
                      {loan.employeeName} - {loan.calculatedRemainingInstallments ?? loan.remainingInstallments} cuotas restantes
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-800">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded-md bg-green-100 text-green-800">
          {successMessage}
        </div>
      )}
        {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-blue-700 ml-3">Cargando préstamos...</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="flex justify-center py-12">
          <p className="text-blue-700">No hay préstamos registrados.</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <p className="text-blue-700 mb-2">No se encontraron préstamos con ese criterio de búsqueda.</p>
            <button
              onClick={clearSearch}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Mostrar todos los préstamos
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-blue-300 rounded-lg overflow-hidden">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Fecha</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Empleado</th>
                <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Monto Préstamo</th>
                <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Progreso</th>
                <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Cuotas</th>
                <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Monto por Cuota</th>
                <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Próximo Pago</th>
                <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Estado</th>
              </tr>
            </thead>            <tbody>
              {filteredLoans.map((loan) => {
                const currentRemainingInstallments = loan.calculatedRemainingInstallments ?? loan.remainingInstallments;
                const currentStatus = loan.calculatedStatus ?? loan.status;
                const progressPercentage = loan.progressPercentage ?? 0;
                const isOutdated = loan.calculatedRemainingInstallments !== loan.remainingInstallments || loan.calculatedStatus !== loan.status;
                
                return (
                  <tr key={loan.id} className={`hover:bg-blue-50 transition-colors ${isOutdated ? 'bg-yellow-50' : ''}`}>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                      {loan.date ? formatDate(loan.date) : 'Sin fecha'}
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                      <div className="flex items-center">
                        {loan.employeeName}
                        {isNearCompletion(loan) && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            ¡Próximo a completar!
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">
                      {formatCurrency(loan.loanAmount)}
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                      <div className="flex flex-col items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage)}`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-center">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {loan.installments} total
                        </span>
                        <span className={`text-xs ${isOutdated ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                          {currentRemainingInstallments} restantes
                          {isOutdated && loan.fortnightsPassed && (
                            <div className="text-xs text-gray-500 mt-1">
                              ({loan.fortnightsPassed} quincenas transcurridas)
                            </div>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">
                      {formatCurrency(loan.installmentAmount)}
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-center">
                      {currentStatus === 'active' && loan.nextPaymentDate ? (
                        <span className="text-xs">
                          {formatDateNormal(loan.nextPaymentDate)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 border-b border-blue-200 text-sm text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            currentStatus === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {currentStatus === 'active' ? 'Activo' : 'Completado'}
                        </span>
                        {isOutdated && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Requiere actualización
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
        {/* Resumen estadístico */}
      {loans.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Total Préstamos</div>
              <div className="text-xl font-bold text-blue-600">{loans.length}</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Préstamos Activos</div>
              <div className="text-xl font-bold text-green-600">
                {loans.filter(loan => (loan.calculatedStatus ?? loan.status) === 'active').length}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Préstamos Completados</div>
              <div className="text-xl font-bold text-blue-600">
                {loans.filter(loan => (loan.calculatedStatus ?? loan.status) === 'completed').length}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Deuda Pendiente</div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(
                  loans
                    .filter(loan => (loan.calculatedStatus ?? loan.status) === 'active')
                    .reduce((sum, loan) => {
                      const remainingInstallments = loan.calculatedRemainingInstallments ?? loan.remainingInstallments;
                      return sum + (loan.installmentAmount * remainingInstallments);
                    }, 0)
                )}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Total Histórico</div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(loans.reduce((sum, loan) => sum + loan.loanAmount, 0))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanHistory;
