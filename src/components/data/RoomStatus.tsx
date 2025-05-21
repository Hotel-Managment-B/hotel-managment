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
  const hourlyRate = searchParams.get("hourlyRate") || "";
  const oneAndHalfHourRate = searchParams.get("oneAndHalfHourRate") || "";
  const threeHourRate = searchParams.get("threeHourRate") || "";
  const overnightRate = searchParams.get("overnightRate") || "";
  const [status, setStatus] = useState("");
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

  // Nueva función para manejar el cambio de tarifa
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Simplemente almacenamos el valor completo como string
    setSelectedRateDisplay(e.target.value);
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

  // Función para convertir un string con formato de moneda a número
  const parseMoneyString = (moneyString: string): number => {
    if (!moneyString) return 0;
    // Eliminar símbolos de moneda y puntos de miles, reemplazar coma decimal por punto
    const cleanedValue = moneyString.replace(/[$\s.]/g, '').replace(',', '.');
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
        Consumo de la Habitación {roomNumber}
      </h1>   
      <div className="w-full space-y-6 px-4 md:px-8 grid sm:grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col items-center bg-white shadow-2xl rounded-lg mr-2 p-6 col-span-2 lg:col-span-1 border-2 border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Estado de la Habitación</h2>
          <div className="flex items-center space-x-4">
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
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="roomStatus"
                value="desocupado"
                checked={status === "desocupado"}
                onChange={handleChange}
                className="form-radio text-blue-600"
              />
              <span className="text-blue-800 font-medium">Desocupado</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-center shadow-2xl border-2 border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-2 m-4">Total</h2>
          <p className="text-lg text-blue-800 font-bold mb-2 m-4">
            {calculateTotal()}
          </p>
          <div className="mt-2 text-sm text-gray-600 m-4 hidden">
            <div>Consumos: {formatCurrency(rows.reduce((total, row) => total + parseMoneyString(row.subtotal), 0))}</div>
            <div>Tarifa: {selectedRateDisplay}</div>
          </div>
        </div>
        <div className="bg-white shadow-2xl border-2 border-blue-200 rounded-lg p-6 col-span-2 ">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Tarifas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="text-lg text-blue-800 flex items-center space-x-2">
              <input 
                type="radio" 
                name="rate" 
                value={hourlyRate} 
                className="form-radio text-blue-600" 
                onChange={handleRateChange} 
              />
              <span>Tarifa por hora: {hourlyRate}</span>
            </label>
            <label className="text-lg text-blue-800 flex items-center space-x-2">
              <input 
                type="radio" 
                name="rate" 
                value={oneAndHalfHourRate} 
                className="form-radio text-blue-600" 
                onChange={handleRateChange} 
              />
              <span >Tarifa por 1.5 horas: {oneAndHalfHourRate}</span>
            </label>
            <label className="text-lg text-blue-800 flex items-center space-x-2">
              <input 
                type="radio" 
                name="rate" 
                value={threeHourRate} 
                className="form-radio text-blue-600" 
                onChange={handleRateChange} 
              />
              <span>Tarifa por 3 horas: {threeHourRate}</span>
            </label>
            <label className="text-lg text-blue-800 flex items-center space-x-2">
              <input 
                type="radio" 
                name="rate" 
                value={overnightRate} 
                className="form-radio text-blue-600" 
                onChange={handleRateChange} 
              />
              <span>Tarifa nocturna: {overnightRate}</span>
            </label>
          </div>
          {/* Mostrar tarifa seleccionada para debug */}
          <div className="mt-2 text-blue-800 hidden">
            Tarifa seleccionada: {selectedRateDisplay}
          </div>
        </div>
        <div className="bg-white shadow-2xl border-2 border-blue-200 rounded-lg p-6 col-span-2 w-full overflow-x-auto">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Consumos</h2>
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
                  className="border focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md p-2 w-full"
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
            Agregar Fila
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomStatus;