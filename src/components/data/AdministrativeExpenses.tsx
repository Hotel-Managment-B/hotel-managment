"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, updateDoc, doc, increment, getDocs } from 'firebase/firestore';
import { db } from "../../firebase/Index";
import { formatCurrency } from '../../utils/FormatCurrency';
import AdministrativeExpensesList from "./AdministrativeExpensesList";

const AdministrativeExpenses = () => {
  const [date, setDate] = useState("");
  const [concept, setConcept] = useState("");
  const [value, setValue] = useState("");
  const [bank, setBank] = useState("");
  const [bankAccounts, setBankAccounts] = useState<string[]>([]);
  const [refreshList, setRefreshList] = useState(false);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bankAccount"));
        const accounts = querySnapshot.docs.map((doc: any) => doc.data().accountName);
        setBankAccounts(accounts);
      } catch (error) {
        console.error("Error al obtener las cuentas bancarias: ", error);
      }
    };
    fetchBankAccounts();
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
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
    if (!date || !concept || !value || !bank) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    try {
      await addDoc(collection(db, 'administrativeExpenses'), {
        date: serverTimestamp(),
        concept,
        value,
        bank,
      });
      alert('Gasto registrado exitosamente.');

      // Resetear los campos después de registrar
      setDate('');
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
      <div className="flex justify-center items-center mt-4">
        <h1 className="text-sm md:text-lg font-bold text-blue-800">
          Registrar Gastos Administrativos y Otros
        </h1>
      </div>
      <div className="bg-white p-8 shadow-2xl border border-blue-200 rounded-2xl m-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="mb-4 col-span-4 md:col-span-1">
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

          <div className="mb-4 col-span-4 md:col-span-1">
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

          <div className="mb-4 col-span-4 md:col-span-1">
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
          <div className="col-span-4 flex justify-center items-center">
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
      <div className="m-4">
        <AdministrativeExpensesList refresh={refreshList} />
      </div>
    </>
  );
};

export default AdministrativeExpenses;
