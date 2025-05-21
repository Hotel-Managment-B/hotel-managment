"use client";

import React, { useState } from "react";
import { formatCurrency } from "../../utils/FormatCurrency";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase/Index";

const BankAccount = () => {
  const [formData, setFormData] = useState({
    accountName: "",
    accountType: "Ahorros",
    accountNumber: "",
    initialAmount: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => {
      const updatedValue = name === "initialAmount" ? formatCurrency(value) : value;
      return {
        ...prevFormData,
        [name]: updatedValue,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "bankAccount"), {
        accountName: formData.accountName,
        accountType: formData.accountType,
        accountNumber: formData.accountNumber,
        initialAmount: parseFloat(formData.initialAmount.replace(/[^0-9]/g, "")),
      });
      setMessage("Registro exitoso.");
      setFormData({
        accountName: "",
        accountType: "Ahorros",
        accountNumber: "",
        initialAmount: "",
      });
    } catch (error) {
      console.error("Error al registrar la cuenta bancaria: ", error);
      setMessage("Error al agregar la cuenta bancaria.");
    }
  };

  return (
    <div className="flex flex-col items-center mt-4 sm:mt-12 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded-lg shadow-2xl border-2 border-blue-200 mt-4 space-y-4">
              <h2 className="text-3xl font-bold text-center text-blue-900 mb-4">Registrar Cuenta</h2>
        <div>
          <label htmlFor="accountName" className="block text-sm font-bold text-blue-900">
            Nombre de la Cuenta
          </label>
          <input
            type="text"
            id="accountName"
            name="accountName"
            value={formData.accountName}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            placeholder="Ingresa el nombre de la cuenta"
            required
          />
        </div>
        <div>
          <label htmlFor="accountType" className="block text-sm font-bold text-blue-900">
            Tipo de Cuenta
          </label>
          <select
            id="accountType"
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            required
          >
            <option value="Ahorros">Ahorros</option>
            <option value="Corriente">Corriente</option>
            <option value="Caja">Caja</option>
          </select>
        </div>
        <div>
          <label htmlFor="accountNumber" className="block text-sm font-bold text-blue-900">
            Número de Cuenta
          </label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            placeholder="Ingresa el número de cuenta"
            required
          />
        </div>
        <div>
          <label htmlFor="initialAmount" className="block text-sm font-bold text-blue-900">
            Monto Inicial
          </label>
          <input
            type="text"
            id="initialAmount"
            name="initialAmount"
            value={formData.initialAmount}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            placeholder="Ingresa el monto inicial"
            required
          />
          {message && (
            <p className={`mt-2 text-sm ${message === "Registro exitoso." ? "text-blue-800" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
        <div className="flex justify-center">
            <button
          type="submit"
          className="w-64 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Registrar Cuenta
        </button>
        </div>
      </form>
    </div>
  );
};

export default BankAccount;
