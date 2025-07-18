"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, updateDoc, doc, increment, getDocs } from 'firebase/firestore';
import { db } from "../../firebase/Index";
import { formatCurrency } from '../../utils/FormatCurrency';

const AdministrativeExpenses = () => {  const [date, setDate] = useState("");
  const [expenseType, setExpenseType] = useState(""); // Nuevo estado para tipo de gasto
  const [concept, setConcept] = useState("");
  const [value, setValue] = useState("");
  const [bank, setBank] = useState("");
  const [bankAccounts, setBankAccounts] = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]); // Nuevo estado para tipos de gastos
  const [refreshList, setRefreshList] = useState(false);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bankAccount"));
        const accounts = querySnapshot.docs.map((doc) => doc.data().accountName);
        setBankAccounts(accounts);
      } catch (error) {
        console.error("Error al obtener las cuentas bancarias: ", error);
      }
    };

    const fetchExpenseTypes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "administrativeExpenses"));
        const types = querySnapshot.docs
          .map((doc) => doc.data().expenseType)
          .filter((type) => type && type.trim() !== "") // Filtrar valores vacíos o nulos
          .filter((type, index, self) => self.indexOf(type) === index); // Eliminar duplicados
        setExpenseTypes(types);
      } catch (error) {
        console.error("Error al obtener los tipos de gastos: ", error);
      }
    };

    fetchBankAccounts();
    fetchExpenseTypes();
  }, []);
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleExpenseTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpenseType(e.target.value);
  };

  const handleConceptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConcept(e.target.value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, ''); // Eliminar caracteres no numéricos
    const formattedValue = formatCurrency(rawValue);
    setValue(formattedValue);
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBank(e.target.value);
  };
  const handleRegisterExpense = async () => {
    if (!date || !expenseType || !concept || !value || !bank) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    try {
      await addDoc(collection(db, 'administrativeExpenses'), {
        date: serverTimestamp(),
        expenseType,
        concept,
        value,
        bank,
      });
      alert('Gasto registrado exitosamente.');

      // Actualizar la lista de tipos de gastos si se agregó uno nuevo
      if (!expenseTypes.includes(expenseType)) {
        setExpenseTypes([...expenseTypes, expenseType]);
      }

      // Resetear los campos después de registrar
      setDate('');
      setExpenseType('');
      setConcept('');
      setValue('');
      setBank('');

      // Activar la actualización de la lista
      setRefreshList(!refreshList);
    } catch (error) {
      console.error('Error al registrar el gasto:', error);
      alert('Hubo un error al registrar el gasto.');
    }
  };

  const handleUpdateBankAccount = async () => {
    if (!bank || !value) {
      alert('Por favor, seleccione un banco y complete el valor.');
      return;
    }

    try {
      const bankQuery = query(collection(db, 'bankAccount'), where('accountName', '==', bank));
      const querySnapshot = await getDocs(bankQuery);

      if (!querySnapshot.empty) {
        const bankDoc = querySnapshot.docs[0];
        const bankRef = doc(db, 'bankAccount', bankDoc.id);

        // Convertir el valor a un número correctamente
        const numericValue = parseInt(value.replace(/[^\d]/g, ''), 10);

        await updateDoc(bankRef, {
          initialAmount: increment(-numericValue),
        });

        alert('Monto descontado exitosamente de la cuenta bancaria.');
      } else {
        alert('No se encontró la cuenta bancaria especificada.');
      }
    } catch (error) {
      console.error('Error al actualizar la cuenta bancaria:', error);
      alert('Hubo un error al actualizar la cuenta bancaria.');
    }
  };

  return (
    <>
      <div className="flex justify-center items-center mt-4 w-full bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg shadow-lg">
        <h1 className="text-sm md:text-lg font-bold text-blue-800">
          Registrar Gastos Administrativos y Otros
        </h1>
      </div>
      
      {/* Contenedor principal con flex para centrado */}
      <div className="flex justify-center w-full px-4 my-8">
        {/* Contenedor del formulario con ancho máximo */}
        <div className="bg-white p-6 md:p-8 shadow-2xl border border-blue-200 rounded-2xl w-full max-w-md">
          <div className="grid grid-cols-1 gap-4">
            <div className="mb-4">
              <label
                htmlFor="dateInput"
                className="block text-sm font-medium text-blue-900"
              >
                Fecha
              </label>
              <input
                id="dateInput"
                type="date"
                value={date}
                onChange={handleDateChange}
                className="h-8 mt-1 block w-full shadow-sm rounded-md border border-blue-300 focus:ring-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="expenseTypeInput"
                className="block text-sm font-medium text-blue-900"
              >
                Tipo de Gasto
              </label>
              <div className="relative">
                <input
                  id="expenseTypeInput"
                  type="text"
                  value={expenseType}
                  onChange={handleExpenseTypeChange}
                  list="expenseTypesList"
                  placeholder="Escriba o seleccione un tipo de gasto"
                  className="h-8 mt-1 block w-full shadow-sm rounded-md border text-center border-blue-300 focus:ring-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <datalist id="expenseTypesList">
                  {expenseTypes.map((type, index) => (
                    <option key={index} value={type} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="conceptInput"
                className="block text-sm font-medium text-blue-900"
              >
                Concepto
              </label>
              <input
                id="conceptInput"
                type="text"
                value={concept}
                onChange={handleConceptChange}
                className="h-8 mt-1 block w-full shadow-sm rounded-md border text-center border-blue-300 focus:ring-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="valueInput"
                className="block text-sm font-medium text-blue-900"
              >
                Valor
              </label>
              <input
                id="valueInput"
                type="text"
                value={value}
                onChange={handleValueChange}
                className="h-8 mt-1 block w-full shadow-sm rounded-md border text-center border-blue-300 focus:ring-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="bankSelect"
                className="block text-sm font-medium text-blue-900"
              >
                Cuenta de Banco
              </label>
              <select
                id="bankSelect"
                value={bank}
                onChange={handleBankChange}
                className="h-8 mt-1 block w-full shadow-sm rounded-md border text-center border-blue-300 focus:ring-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option className="w-full" value="">Seleccione una Cuenta..</option>
                {bankAccounts.map((account, index) => (
                  <option key={index} value={account}>
                    {account}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-center items-center">
              <button
                onClick={async () => {
                  await handleRegisterExpense();
                  await handleUpdateBankAccount();
                }}
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
              >
                Registrar Gasto
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdministrativeExpenses;
