'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { FaTimes } from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/Index";
import { formatCurrency } from "../../utils/FormatCurrency";

interface Product {
  code: string;
  productName: string;
  unitSaleValue: string;
}

const RoomStatus = () => {
  const searchParams = useSearchParams();
  const roomNumber = searchParams.get("roomNumber") || "";
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([
    { code: "", description: "", quantity: 1, unitPrice: "", subtotal: "" },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map((doc) => ({
          code: doc.data().code,
          productName: doc.data().productName,
          unitSaleValue: doc.data().unitSaleValue,
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };
    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatus(e.target.value);
  };

  const handleAddRow = () => {
    setRows([...rows, { code: "", description: "", quantity: 1, unitPrice: "", subtotal: "" }]);
  };

  const handleRowChange = (index: number, field: string, value: string | number) => {
    const updatedRows = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setRows(updatedRows);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  // Función para calcular el subtotal
  const calculateSubtotal = (quantity: number, unitPrice: string) => {
    // Elimina símbolos de moneda y separadores de miles
    const cleanPrice = unitPrice.toString().replace(/[^\d.-]/g, '');
    const price = parseFloat(cleanPrice);
    return (quantity * price).toString();
  };

  // Función para actualizar todos los campos relacionados al seleccionar un producto
  const handleProductSelection = (index: number, selectedCode: string) => {
    const selectedProduct = products.find(product => product.code === selectedCode);
    
    if (selectedProduct) {
      // Actualizar código, descripción y precio unitario
      const quantity = rows[index].quantity || 1;
      const unitPrice = selectedProduct.unitSaleValue;
      const subtotal = calculateSubtotal(quantity, unitPrice);
      
      const updatedRows = rows.map((row, i) =>
        i === index ? {
          ...row,
          code: selectedProduct.code,
          description: selectedProduct.productName,
          unitPrice: unitPrice,
          subtotal: subtotal
        } : row
      );
      setRows(updatedRows);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-blue-800 text-center mb-6">
        Consumo de la Habitación {roomNumber}
      </h1>
      <div className="flex items-center justify-center">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="roomStatus"
            value="ocupado"
            checked={status === "ocupado"}
            onChange={handleChange}
            className="form-radio text-blue-600"
          />
          <span className="text-blue-800 font-medium">Ocupado</span>
        </label>
      </div>
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-[2fr_3fr_1fr_2fr_2fr_auto] gap-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Código"
              value={row.code || ""}
              onChange={(e) => {
                const value = e.target.value;
                handleRowChange(index, "code", value);
                
                // Verificar si el código ingresado coincide con un producto
                const exactMatch = products.find(product => product.code === value);
                if (exactMatch) {
                  handleProductSelection(index, exactMatch.code);
                }
              }}
              onBlur={(e) => {
                // Verificar si el código ingresado manualmente existe
                const exactMatch = products.find(product => product.code === e.target.value);
                if (exactMatch) {
                  handleProductSelection(index, exactMatch.code);
                }
              }}
              list={`product-options-${index}`}
              className="border border-gray-300 rounded-md p-2 w-full"
            />
            <datalist id={`product-options-${index}`}>
              {products.map((product) => (
                <option key={product.code} value={product.code} data-name={product.productName}>
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
            className="border border-gray-300 rounded-md p-2"
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
            className="border border-gray-300 rounded-md p-2"
            min="1"
          />
          <input
            type="text"
            placeholder="Valor Unitario"
            value={formatCurrency(row.unitPrice || 0)}
            readOnly
            className="border border-gray-300 rounded-md p-2"
          />
          <input
            type="text"
            placeholder="Subtotal"
            value={formatCurrency(row.subtotal || 0)}
            readOnly
            className="border border-gray-300 rounded-md p-2"
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
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Agregar Fila
      </button>
    </div>
  );
};

export default RoomStatus;