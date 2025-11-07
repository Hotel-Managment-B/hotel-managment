"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/Index";
import { formatCurrency } from "../../utils/FormatCurrency";

interface RegisterProductsProps {
  onProductAdded: () => void;
  onProductUpdated?: (updatedData: Product) => void;
  initialData?: Product | null;
  title?: string;
  buttonText?: string;
}

export interface Product {
  id: string;
  date?: string;
  code: string;
  productName: string;
  quantity: number;
  totalValue: number;
  unitPurchaseValue: number;
  unitSaleValue: number;
}

const RegisterProducts: React.FC<RegisterProductsProps> = ({ onProductAdded, onProductUpdated, initialData, title, buttonText }) => {
  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    productName: initialData?.productName || "",
    totalValue: initialData?.totalValue?.toString() || "",
    quantity: initialData?.quantity?.toString() || "",
    unitPurchaseValue: initialData?.unitPurchaseValue?.toString() || "",
    unitSaleValue: initialData?.unitSaleValue?.toString() || "",
    date: initialData?.date || "",
  });

  const [bankAccounts, setBankAccounts] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bankAccount"));
        const accounts = querySnapshot.docs.map((doc) => {
          console.log("Cuenta bancaria obtenida:", doc.data()); // Log para depurar los datos
          return doc.data().accountName; // Cambié 'name' por 'accountName'
        });
        setBankAccounts(accounts);
      } catch (error) {
        console.error("Error al obtener las cuentas bancarias:", error);
      }
    };

    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        productName: initialData.productName || "",
        totalValue: formatCurrency(initialData.totalValue || ""),
        quantity: initialData.quantity?.toString() || "",
        unitPurchaseValue: formatCurrency(initialData.unitPurchaseValue || ""),
        unitSaleValue: formatCurrency(initialData.unitSaleValue || ""),
        date: initialData.date || "",
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const checkIfCodeExists = async (code: string, currentId?: string): Promise<boolean> => {
    try {
      const q = query(collection(db, "products"), where("code", "==", code));
      const querySnapshot = await getDocs(q);

      // Si el código existe pero pertenece al producto actual, no hay conflicto
      if (!querySnapshot.empty) {
        const existingProduct = querySnapshot.docs[0];
        if (existingProduct.id === currentId) {
          return false; // No hay conflicto
        }
        return true; // El código ya está en uso por otro producto
      }

      return false; // El código no existe
    } catch (error) {
      console.error("Error al verificar el código del producto:", error);
      return false; // En caso de error, asumimos que no existe
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { productName, totalValue, quantity, unitPurchaseValue, unitSaleValue, date } = formData;

    if (!productName || !totalValue || !quantity || !unitPurchaseValue || !unitSaleValue || !date) {
      setErrorMessage("Por favor, completa todos los campos.");
      return;
    }

    try {
      if (initialData) {
        // Actualizar producto existente sin modificar el código
        if (onProductUpdated) {
          onProductUpdated({
            ...initialData,
            productName,
            totalValue: parseFloat(totalValue.replace(/[^0-9]/g, "")),
            quantity: parseInt(quantity),
            unitPurchaseValue: parseFloat(unitPurchaseValue.replace(/[^0-9]/g, "")),
            unitSaleValue: parseFloat(unitSaleValue.replace(/[^0-9]/g, "")),
            date,
          });
        }
      } else {
        // Registrar nuevo producto
        const codeExists = await checkIfCodeExists(formData.code);
        if (codeExists) {
          setErrorMessage("El código ya está registrado. Por favor, utiliza un código diferente.");
          return;
        }

        await addDoc(collection(db, "products"), {
          code: formData.code,
          productName,
          totalValue: parseFloat(totalValue.replace(/[^0-9]/g, "")),
          quantity: parseInt(quantity),
          unitPurchaseValue: parseFloat(unitPurchaseValue.replace(/[^0-9]/g, "")),
          unitSaleValue: parseFloat(unitSaleValue.replace(/[^0-9]/g, "")),
          date,
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
          date: "",
        });

        onProductAdded();
      }
    } catch (error) {
      console.error("Error al registrar o actualizar el producto:", error);
      setErrorMessage("Error al registrar o actualizar el producto.");
      setSuccessMessage("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-blue-50">
      <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-lg shadow-2xl border-2 border-blue-200">
        <h2 className=" text-sm md:text-lg font-bold text-center text-blue-900">{title || "Registrar Producto del Mini Bar"}</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-bold text-blue-900">
                Fecha
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                required
              />
            </div>
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
                disabled={!!initialData} // Deshabilitar si hay datos iniciales
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
            </div>
          </div>
          {errorMessage && (
            <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="mt-1 text-sm text-blue-700">{successMessage}</p>
          )}
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {buttonText || "Registrar Producto"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterProducts;