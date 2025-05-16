"use client";

import React, { useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/Index";
import { formatCurrency } from "../../utils/FormatCurrency";

const RegisterProducts = () => {
  const [formData, setFormData] = useState({
    code: "",
    productName: "",
    totalValue: "",
    quantity: "",
    unitPurchaseValue: "",
    unitSaleValue: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "totalValue" || name === "unitPurchaseValue" || name === "unitSaleValue") {
      formattedValue = formatCurrency(value);
    }

    setFormData((prevFormData) => {
      const updatedFormData = { ...prevFormData, [name]: formattedValue };

      // Trigger calculation for unit purchase value if totalValue or quantity changes
      if (name === "totalValue" || name === "quantity") {
        const totalValue = parseFloat(updatedFormData.totalValue.replace(/[^0-9]/g, ""));
        const quantity = parseFloat(updatedFormData.quantity.replace(/[^0-9]/g, ""));

        if (!isNaN(totalValue) && !isNaN(quantity) && quantity > 0) {
          const unitValue = Math.floor(totalValue / quantity); // Correct division without decimals
          updatedFormData.unitPurchaseValue = formatCurrency(unitValue.toString());
        } else {
          updatedFormData.unitPurchaseValue = "$0"; // Default value if invalid
        }
      }

      return updatedFormData;
    });
  };

  const checkIfCodeExists = async (code: string): Promise<boolean> => {
    try {
      const q = query(collection(db, "products"), where("code", "==", code));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty; // Retorna true si el código ya existe
    } catch (error) {
      console.error("Error al verificar el código del producto:", error);
      return false; // En caso de error, asumimos que no existe
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { code, productName, totalValue, quantity, unitPurchaseValue, unitSaleValue } = formData;

    if (!code || !productName || !totalValue || !quantity || !unitPurchaseValue || !unitSaleValue) {
      setErrorMessage("Por favor, completa todos los campos.");
      return;
    }

    try {
      const codeExists = await checkIfCodeExists(code);
      if (codeExists) {
        setErrorMessage("El código ya está registrado. Por favor, utiliza un código diferente.");
        return;
      }

      await addDoc(collection(db, "products"), {
        code,
        productName,
        totalValue: parseFloat(totalValue.replace(/[^0-9]/g, "")),
        quantity: parseInt(quantity),
        unitPurchaseValue: parseFloat(unitPurchaseValue.replace(/[^0-9]/g, "")),
        unitSaleValue: parseFloat(unitSaleValue.replace(/[^0-9]/g, "")),
      });

      setSuccessMessage("Producto registrado exitosamente");
      setErrorMessage("");
      setFormData({
        code: "",
        productName: "",
        totalValue: "",
        quantity: "",
        unitPurchaseValue: "",
        unitSaleValue: "",
      });
    } catch (error) {
      console.error("Error al registrar el producto:", error);
      setErrorMessage("Error al registrar el producto.");
      setSuccessMessage("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border-2 border-blue-300">
        <h2 className="text-2xl font-bold text-center text-blue-900">Registrar Producto</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
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
            <label htmlFor="productName" className="block text-sm font-bold text-blue-900">
              Nombre del Producto
            </label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa el nombre del producto"
              required
            />
          </div>
          <div>
            <label htmlFor="totalValue" className="block text-sm font-bold text-blue-900">
              Valor Total de la Compra
            </label>
            <input
              type="text"
              id="totalValue"
              name="totalValue"
              value={formData.totalValue}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa el valor total"
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
            <label htmlFor="unitPurchaseValue" className="block text-sm font-bold text-blue-900">
              Valor Unitario de Compra
            </label>
            <input
              type="text"
              id="unitPurchaseValue"
              name="unitPurchaseValue"
              value={formData.unitPurchaseValue}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Valor unitario de compra"
              required
            />
          </div>
          <div>
            <label htmlFor="unitSaleValue" className="block text-sm font-bold text-blue-900">
              Valor Unitario de Venta
            </label>
            <input
              type="text"
              id="unitSaleValue"
              name="unitSaleValue"
              value={formData.unitSaleValue}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa el valor unitario de venta"
              required
            />
            {errorMessage && (
              <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
            )}
            {successMessage && (
              <p className="mt-1 text-sm text-blue-700">{successMessage}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Registrar Producto
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterProducts;