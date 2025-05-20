"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../../firebase/Index";
import { formatCurrency } from "../../utils/FormatCurrency";
import { Toiletry } from "./ListToiletries";

interface RegisterToiletriesProps {
  onProductAdded: (newProduct: Toiletry) => void;
}

const RegisterToiletries: React.FC<RegisterToiletriesProps> = ({ onProductAdded }) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    purchaseValue: "",
    quantity: "",
    accountName: "",
  });
  const [accounts, setAccounts] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bankAccount"));
        const accountNames = querySnapshot.docs.map((doc) => doc.data().accountName);
        setAccounts(accountNames);
      } catch (error) {
        console.error("Error al obtener las cuentas bancarias: ", error);
      }
    };

    fetchAccounts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => {
      const updatedValue = name === "purchaseValue" ? formatCurrency(value) : value;
      return {
        ...prevFormData,
        [name]: updatedValue,
      };
    });
  };

  const checkIfCodeExists = async (code: string): Promise<boolean> => {
    try {
      const q = query(collection(db, "toiletries"), where("code", "==", code));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty; // Retorna true si el código ya existe
    } catch (error) {
      console.error("Error al verificar el código del producto:", error);
      return false; // En caso de error, asumimos que no existe
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const codeExists = await checkIfCodeExists(formData.code);
      if (codeExists) {
        setMessage("El código del producto ya existe. Por favor, utiliza otro código.");
        return;
      }

      const newProduct = {
        code: formData.code,
        name: formData.name,
        purchaseValue: parseFloat(formData.purchaseValue.replace(/[^0-9]/g, "")),
        quantity: parseInt(formData.quantity, 10),
        accountName: formData.accountName,
      };
      const docRef = await addDoc(collection(db, "toiletries"), newProduct);
      onProductAdded({ id: docRef.id, ...newProduct });
      setMessage("Producto de aseo registrado exitosamente.");
      setFormData({
        code: "",
        name: "",
        purchaseValue: "",
        quantity: "",
        accountName: "",
      });
    } catch (error) {
      console.error("Error al registrar el producto de aseo: ", error);
      setMessage("Ocurrió un error al registrar el producto de aseo.");
    }
  };

  return (
    <div className="flex flex-col items-center mt-2 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded-lg shadow-md border-2 border-blue-300 space-y-4">
        <h2 className="text-2xl font-bold text-center text-blue-900 mb-2">Registrar Producto de Aseo</h2>
        <div>
          <label htmlFor="code" className="block text-sm font-bold text-blue-900">
            Código
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            placeholder="Ingresa el código"
            required
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-blue-900">
            Nombre
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            placeholder="Ingresa el nombre"
            required
          />
        </div>
        <div>
          <label htmlFor="purchaseValue" className="block text-sm font-bold text-blue-900">
            Valor de la Compra
          </label>
          <input
            type="text"
            id="purchaseValue"
            name="purchaseValue"
            value={formData.purchaseValue}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            placeholder="Ingresa el valor de la compra"
            required
          />
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-bold text-blue-900">
            Cantidad
          </label>
          <input
            type="text"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            placeholder="Ingresa la cantidad"
            required
          />
        </div>
        <div>
          <label htmlFor="accountName" className="block text-sm font-bold text-blue-900">
            Cuenta Bancaria
          </label>
          <select
            id="accountName"
            name="accountName"
            value={formData.accountName}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            required
          >
            <option value="">Selecciona una cuenta</option>
            {accounts.map((account, index) => (
              <option key={index} value={account}>
                {account}
              </option>
            ))}
          </select>
          {message && (
            <p className={`mt-2 text-sm ${message.includes("exitosamente") ? "text-blue-800" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
        <div className="flex justify-center">
            <button
          type="submit"
          className="w-64 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Registrar Producto
        </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterToiletries;
