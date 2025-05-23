"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { FaTimes } from "react-icons/fa";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/Index";
import { formatCurrency } from "../../utils/FormatCurrency";

interface Product {
  code: string;
  productName: string;
  unitPurchaseValue: string;
}

const AddPurchase = () => {
  const [rows, setRows] = useState([
    { code: "", description: "", quantity: 1, unitPrice: "", subtotal: "" },
  ]);
  const [products, setProducts] = useState<Product[]>([]);

  // Cambio importante: Usamos el valor de tarifa original como string
  const [selectedRateDisplay, setSelectedRateDisplay] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map((doc) => ({
          code: doc.data().code,
          productName: doc.data().productName,
          unitPurchaseValue: doc.data().unitPurchaseValue,
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };
    fetchProducts();
  }, []);

 

  const handleAddRow = () => {
    setRows([
      ...rows,
      { code: "", description: "", quantity: 1, unitPrice: "", subtotal: "" },
    ]);
  };

  const handleRowChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedRows = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setRows(updatedRows);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };


  const calculateSubtotal = (quantity: number, unitPrice: string) => {
    // Elimina símbolos de moneda y separadores de miles
    const cleanPrice = unitPrice.toString().replace(/[^\d.-]/g, "");
    const price = parseFloat(cleanPrice);
    return (quantity * price).toString();
  };

  // Función para actualizar todos los campos relacionados al seleccionar un producto
  const handleProductSelection = (index: number, selectedCode: string) => {
    const selectedProduct = products.find(
      (product) => product.code === selectedCode
    );

    if (selectedProduct) {
      // Actualizar código, descripción y precio unitario
      const quantity = rows[index].quantity || 1;
      const unitPrice = selectedProduct.unitPurchaseValue;
      const subtotal = calculateSubtotal(quantity, unitPrice);

      const updatedRows = rows.map((row, i) =>
        i === index
          ? {
              ...row,
              code: selectedProduct.code,
              description: selectedProduct.productName,
              unitPrice: unitPrice,
              subtotal: subtotal,
            }
          : row
      );
      setRows(updatedRows);
    }
  };

  // Función para convertir un string con formato de moneda a número
  const parseMoneyString = (moneyString: string): number => {
    if (!moneyString) return 0;
    // Eliminar símbolos de moneda y puntos de miles, reemplazar coma decimal por punto
    const cleanedValue = moneyString.replace(/[$\s.]/g, "").replace(",", ".");
    return parseFloat(cleanedValue) || 0;
  };

  // Calcular el total (consumos + tarifa seleccionada)
  const calculateTotal = () => {
    // Sumar subtotales de productos
    const consumptionTotal = rows.reduce((total, row) => {
      return total + parseMoneyString(row.subtotal);
    }, 0);

    // Sumar la tarifa seleccionada
    const rateValue = parseMoneyString(selectedRateDisplay);

    // Total general
    const grandTotal = consumptionTotal + rateValue;

    return formatCurrency(grandTotal);
  };

  return (
    <div className="bg-white p-8">
      <h1 className="text-3xl font-bold text-blue-800 text-center mt-8 mb-4">
        Compras
      </h1>

      <form className="w-full space-y-6 px-4 md:px-8 grid sm:grid-cols-1 md:grid-cols-3 border-2 border-blue-400 rounded-lg p-6 shadow-lg">
        <div className="bg-white shadow-2xl border-2 border-blue-200 rounded-lg p-6 col-span-3 w-full overflow-x-auto">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            Productos
          </h2>
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-[2fr_3fr_1fr_2fr_2fr_auto] gap-4 mb-4"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Código"
                  value={row.code || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleRowChange(index, "code", value);
                    // Verificar si el código ingresado coincide con un producto
                    const exactMatch = products.find(
                      (product) => product.code === value
                    );
                    if (exactMatch) {
                      handleProductSelection(index, exactMatch.code);
                    }
                  }}
                  onBlur={(e) => {
                    // Verificar si el código ingresado manualmente existe
                    const exactMatch = products.find(
                      (product) => product.code === e.target.value
                    );
                    if (exactMatch) {
                      handleProductSelection(index, exactMatch.code);
                    }
                  }}
                  list={`product-options-${index}`}
                  className="border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md p-2 w-full"
                />
                <datalist id={`product-options-${index}`}>
                  {products.map((product) => (
                    <option
                      key={product.code}
                      value={product.code}
                      data-name={product.productName}
                    >
                      {product.code} - {product.productName}
                    </option>
                  ))}
                </datalist>
              </div>
              <input
                type="text"
                placeholder="Descripción"
                value={row.description || ""}
                readOnly
                className="border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md p-2"
              />
              <input
                type="number"
                placeholder="Cantidad"
                defaultValue={row.quantity || 1}
                onChange={(e) => {
                  const quantity = parseInt(e.target.value, 10) || 0;
                  handleRowChange(index, "quantity", quantity);
                  // Recalcular el subtotal cuando cambia la cantidad
                  if (row.unitPrice) {
                    const subtotal = calculateSubtotal(quantity, row.unitPrice);
                    handleRowChange(index, "subtotal", subtotal);
                  }
                }}
                className="border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md p-2"
                min="1"
              />
              <input
                type="text"
                placeholder="Valor Unitario"
                value={formatCurrency(row.unitPrice || 0)}
                readOnly
                className="border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md p-2"
              />
              <input
                type="text"
                placeholder="Subtotal"
                value={formatCurrency(row.subtotal || 0)}
                readOnly
                className="border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md p-2"
              />
              <button
                onClick={() => handleRemoveRow(index)}
                className="text-red-600 hover:text-red-800 flex items-center justify-center"
              >
                <FaTimes size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddRow}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-4"
          >
            Agregar Producto
          </button>
        </div>
        {/* Método de Pago */}
        <div className="bg-white shadow-2xl border-2 border-blue-200 rounded-lg p-6 h-32 col-span-3 md:col-span-1 mt-6 mr-0 md:mr-4 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-blue-700 mb-4">
            Método de Pago
          </h2>
          <select className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
        {/* Total */}
        <div className="flex flex-row items-center justify-center w-full  h-32 col-span-3 md:col-span-1 shadow-2xl border-2 border-blue-200 rounded-lg p-6 mt-6 ">
          <h2 className="text-xl font-semibold text-blue-800 mb-2 m-4">
            Total
          </h2>
          <p className="text-lg text-blue-800 font-bold mb-2 m-4">
            {calculateTotal()}
          </p>
          <div className="mt-2 text-sm text-gray-600 m-4 hidden">
            <div>
              Consumos:{" "}
              {formatCurrency(
                rows.reduce(
                  (total, row) => total + parseMoneyString(row.subtotal),
                  0
                )
              )}
            </div>
            <div>Tarifa: {selectedRateDisplay}</div>
          </div>
        </div>
        <div className="flex items-center justify-center mr-0 md:mr-16 lg:mr-42 col-span-3 md:col-span-1">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-4">
            Registrar Compra
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPurchase;
