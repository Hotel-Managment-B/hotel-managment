"use client";
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
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
    profitMargin: "",
  });

  // Función auxiliar para extraer valor numérico de un formato de moneda
  const extractNumericValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    // Eliminar cualquier caracter que no sea número o punto decimal
    return parseFloat(formattedValue.replace(/[^0-9.]/g, ""));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === "totalValue" || name === "unitPurchaseValue" || name === "unitSaleValue") {
      formattedValue = formatCurrency(value);
    }
    
    setFormData((prevFormData) => {
      const updatedFormData = { ...prevFormData, [name]: formattedValue };
      
      // Calcular valor unitario de compra si cambia valor total o cantidad
      if (name === "totalValue" || name === "quantity") {
        // Extraer valores numéricos
        const totalValue = extractNumericValue(updatedFormData.totalValue);
        const quantity = parseFloat(updatedFormData.quantity);
        
        if (!isNaN(totalValue) && !isNaN(quantity) && quantity > 0) {
          // Realizar la división directamente y aplicar formato
          const unitValue = totalValue / quantity;
          
          // Para depuración
          console.log("Valor total:", totalValue);
          console.log("Cantidad:", quantity);
          console.log("Valor unitario calculado:", unitValue);
          
          // Formatear manualmente para asegurar precisión
          updatedFormData.unitPurchaseValue = formatCurrency(unitValue.toString());
        } else {
          updatedFormData.unitPurchaseValue = "$0,00";
        }
      }
      
      // Calcular margen de ganancia si cambian valores unitarios
      if (name === "unitPurchaseValue" || name === "unitSaleValue") {
        const unitPurchaseValue = extractNumericValue(updatedFormData.unitPurchaseValue);
        const unitSaleValue = extractNumericValue(updatedFormData.unitSaleValue);
        
        if (!isNaN(unitPurchaseValue) && !isNaN(unitSaleValue) && unitPurchaseValue > 0) {
          const profitMargin = ((unitSaleValue - unitPurchaseValue) / unitPurchaseValue) * 100;
          updatedFormData.profitMargin = `${profitMargin.toFixed(2)}%`;
        } else {
          updatedFormData.profitMargin = "0,00%";
        }
      }
      
      return updatedFormData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { code, productName, totalValue, quantity, unitPurchaseValue, unitSaleValue, profitMargin } = formData;
    
    if (!code || !productName || !totalValue || !quantity || !unitPurchaseValue || !unitSaleValue || !profitMargin) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    
    try {
      await addDoc(collection(db, "products"), {
        code,
        productName,
        totalValue: extractNumericValue(totalValue),
        quantity: parseInt(quantity),
        unitPurchaseValue: extractNumericValue(unitPurchaseValue),
        unitSaleValue: extractNumericValue(unitSaleValue),
        profitMargin: parseFloat(profitMargin.replace("%", "")),
      });
      
      alert("Producto registrado exitosamente");
      setFormData({
        code: "",
        productName: "",
        totalValue: "",
        quantity: "",
        unitPurchaseValue: "",
        unitSaleValue: "",
        profitMargin: "",
      });
    } catch (error) {
      console.error("Error al registrar el producto:", error);
      alert("Error al registrar el producto.");
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
              Valor Total
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
              placeholder="Ingresa el valor unitario de compra"
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
          </div>
          <div>
            <label htmlFor="profitMargin" className="block text-sm font-bold text-blue-900">
              Margen de Ganancia
            </label>
            <input
              type="text"
              id="profitMargin"
              name="profitMargin"
              value={formData.profitMargin}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa el margen de ganancia"
              required
            />
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