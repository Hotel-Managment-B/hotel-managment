'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/Index';
import { formatCurrency } from '../../utils/FormatCurrency';

interface Employee {
  id: string;
  fullName: string;
  idNumber: string;
  salary?: string; // Añadimos el campo salary
}

interface LoanData {
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

const LoanEmployee: React.FC = () => {
  // Estados para los campos del formulario
  const [date, setDate] = useState<string>(getCurrentDate());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [salary, setSalary] = useState<string>('');
  const [displaySalary, setDisplaySalary] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [displayLoanAmount, setDisplayLoanAmount] = useState<string>('');
  const [installments, setInstallments] = useState<string>('');
  const [installmentAmount, setInstallmentAmount] = useState<string>('');
  const [displayInstallmentAmount, setDisplayInstallmentAmount] = useState<string>('');
  const [displayPaymentPerInstallment, setDisplayPaymentPerInstallment] = useState<string>('');
  
  // Estado para la lista de empleados
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  // Obtener la fecha actual en formato YYYY-MM-DD para el campo de fecha
  function getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Cargar la lista de empleados al iniciar
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'employee'));
        const employeeList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          fullName: doc.data().fullName,
          idNumber: doc.data().idNumber,
          salary: doc.data().salary || '',
        })) as Employee[];
        
        setEmployees(employeeList);
      } catch (error) {
        console.error('Error al cargar los empleados:', error);
        setMessage({ text: 'Error al cargar la lista de empleados', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Calcular monto de cuota cuando cambian préstamo o número de cuotas
  useEffect(() => {
    if (loanAmount && installments && Number(loanAmount) > 0 && Number(installments) > 0) {
      const calculatedAmount = Math.round(Number(loanAmount) / Number(installments));
      setInstallmentAmount(calculatedAmount.toString());
      setDisplayInstallmentAmount(formatCurrency(calculatedAmount));
      
      // Calcular total a pagar por quincena (salario - cuota)
      if (salary && Number(salary) > 0) {
        const paymentPerInstallment = Number(salary) - calculatedAmount;
        setDisplayPaymentPerInstallment(formatCurrency(paymentPerInstallment));
      } else {
        setDisplayPaymentPerInstallment('');
      }
    } else {
      setInstallmentAmount('');
      setDisplayInstallmentAmount('');
      setDisplayPaymentPerInstallment('');
    }
  }, [loanAmount, installments, salary]);

  // Manejar cambios en los campos
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeId = e.target.value;
    setSelectedEmployee(employeeId);
    
    // Si se seleccionó un empleado, buscar su salario
    if (employeeId) {
      const selectedEmp = employees.find(emp => emp.id === employeeId);
      if (selectedEmp && selectedEmp.salary) {
        // Actualizar el salario
        setSalary(selectedEmp.salary);
        setDisplaySalary(formatCurrency(Number(selectedEmp.salary)));
        
        // Actualizar el total a pagar por quincena si hay un monto de cuota calculado
        if (installmentAmount && Number(installmentAmount) > 0) {
          const paymentPerInstallment = Number(selectedEmp.salary) - Number(installmentAmount);
          setDisplayPaymentPerInstallment(formatCurrency(paymentPerInstallment));
        }
      } else {
        // Si el empleado no tiene salario registrado, limpiar el campo
        setSalary('');
        setDisplaySalary('');
        setDisplayPaymentPerInstallment('');
      }
    } else {
      // Si no hay empleado seleccionado, limpiar el campo de salario
      setSalary('');
      setDisplaySalary('');
      setDisplayPaymentPerInstallment('');
    }
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setSalary(value);
    if (value) {
      setDisplaySalary(formatCurrency(Number(value)));
      
      // Actualizar total a pagar por quincena si ya hay un monto de cuota calculado
      if (installmentAmount && Number(installmentAmount) > 0) {
        const paymentPerInstallment = Number(value) - Number(installmentAmount);
        setDisplayPaymentPerInstallment(formatCurrency(paymentPerInstallment));
      }
    } else {
      setDisplaySalary('');
      setDisplayPaymentPerInstallment('');
    }
  };

  const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setLoanAmount(value);
    if (value) {
      setDisplayLoanAmount(formatCurrency(Number(value)));
    } else {
      setDisplayLoanAmount('');
    }
  };

  const handleInstallmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setInstallments(value);
  };

  // Validar el formulario
  const validateForm = (): boolean => {
    if (!date) {
      setMessage({ text: 'Por favor, seleccione una fecha', type: 'error' });
      return false;
    }
    if (!selectedEmployee) {
      setMessage({ text: 'Por favor, seleccione un empleado', type: 'error' });
      return false;
    }
    if (!salary || Number(salary) <= 0) {
      setMessage({ text: 'Por favor, ingrese un salario válido', type: 'error' });
      return false;
    }
    if (!loanAmount || Number(loanAmount) <= 0) {
      setMessage({ text: 'Por favor, ingrese un monto de préstamo válido', type: 'error' });
      return false;
    }
    if (!installments || Number(installments) <= 0) {
      setMessage({ text: 'Por favor, ingrese un número de cuotas válido', type: 'error' });
      return false;
    }
    if (!installmentAmount || Number(installmentAmount) <= 0) {
      setMessage({ text: 'Por favor, verifique el monto de la cuota', type: 'error' });
      return false;
    }
    return true;
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar mensajes anteriores
    setMessage({ text: '', type: '' });
    
    // Validar el formulario
    if (!validateForm()) return;
    
    try {
      // Encontrar el nombre del empleado seleccionado
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) {
        setMessage({ text: 'Empleado no encontrado', type: 'error' });
        return;
      }      // Crear objeto de préstamo      // Extraer directamente los componentes de la fecha del string del input (YYYY-MM-DD)
      const [year, month, day] = date.split('-').map(Number);
      
      // En lugar de crear un Date, usamos directamente el constructor de Timestamp
      // Creamos un timestamp para las 12:00:00 del día seleccionado en UTC
      // Convertimos a segundos desde época Unix
      const dateInSeconds = Math.floor(new Date(year, month - 1, day, 12, 0, 0, 0).getTime() / 1000);
      const timestampDate = new Timestamp(dateInSeconds, 0);
      
      
      const loanData: LoanData = {
        employeeId: selectedEmployee,
        employeeName: employee.fullName,
        date: timestampDate,
        salary: Number(salary),
        loanAmount: Number(loanAmount),
        installments: Number(installments),
        installmentAmount: Number(installmentAmount),
        status: 'active',
        remainingInstallments: Number(installments)
      };
        // Guardar en Firestore
      await addDoc(collection(db, 'loanEmployee'), loanData);
      
      // Mostrar mensaje de éxito
      setMessage({ text: 'Préstamo registrado con éxito', type: 'success' });
      
      // Limpiar el formulario
      setSelectedEmployee('');
      setSalary('');
      setDisplaySalary('');
      setLoanAmount('');
      setDisplayLoanAmount('');
      setInstallments('');
      setInstallmentAmount('');
      setDisplayInstallmentAmount('');
      setDisplayPaymentPerInstallment('');
      
    } catch (error) {
      console.error('Error al registrar el préstamo:', error);
      setMessage({ text: 'Error al registrar el préstamo', type: 'error' });
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Registrar Préstamo a Empleado</h2>
      
      {message.text && (
        <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-blue-300 p-4 rounded-lg">
          {/* Fecha */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-blue-900 mb-1">
              Fecha
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Selección de Empleado */}
          <div>
            <label htmlFor="employee" className="block text-sm font-medium text-blue-900 mb-1">
              Empleado
            </label>
            <select
              id="employee"
              value={selectedEmployee}
              onChange={handleEmployeeChange}
              className="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione un empleado</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} - {employee.idNumber}
                </option>
              ))}
            </select>
          </div>
            {/* Salario */}
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-blue-900 mb-1">
              Salario Quincenal ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="text"
                id="salary"
                value={displaySalary || ''}
                onChange={handleSalaryChange}
                placeholder="0"
                readOnly
                className="w-full p-2 pl-8 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          {/* Monto del Préstamo */}
          <div>
            <label htmlFor="loanAmount" className="block text-sm font-medium text-blue-900 mb-1">
              Monto del Préstamo ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="text"
                id="loanAmount"
                value={displayLoanAmount || ''}
                onChange={handleLoanAmountChange}
                placeholder="0"
                className="w-full p-2 pl-8 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          {/* Número de Cuotas */}
          <div>
            <label htmlFor="installments" className="block text-sm font-medium text-blue-900 mb-1">
              Número de Cuotas Quincenales
            </label>
            <input
              type="text"
              id="installments"
              value={installments}
              onChange={handleInstallmentsChange}
              placeholder="Ej: 12"
              className="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Monto por Cuota */}
          <div>
            <label htmlFor="installmentAmount" className="block text-sm font-medium text-blue-900 mb-1">
              Monto por Cuota ($)
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="text"
                id="installmentAmount"
                value={displayInstallmentAmount || ''}
                className="w-full p-2 pl-8 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                readOnly
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Este valor se calcula automáticamente</p>
          </div>
          
          {/* Total a pagar por quincena */}
          <div>
            <label htmlFor="paymentPerInstallment" className="block text-sm font-medium text-blue-900 mb-1">
              Total a pagar al empleado por las próximas {installments || '0'} quincenas ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="text"
                id="paymentPerInstallment"
                value={displayPaymentPerInstallment || ''}
                className="w-full p-2 pl-8 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                readOnly
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Salario quincenal menos monto por cuota</p>
          </div>
        </div>
        
        {/* Botón de envío */}
        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Registrar Préstamo
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanEmployee;
