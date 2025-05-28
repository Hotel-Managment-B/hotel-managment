'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { FaTimes } from "react-icons/fa";
import { collection, getDocs, query, where, doc, updateDoc, addDoc, serverTimestamp, increment, getDoc } from "firebase/firestore";
import { db } from "../../firebase/Index";
import { formatCurrency } from "../../utils/FormatCurrency";


interface Product {
  code: string;
  productName: string;
  unitSaleValue: string;
}

interface Row {
  code: string;
  description: string;
  quantity: number | string;
  unitPrice: string;
  subtotal: string;
}

const RoomStatus = () => {
  const searchParams = useSearchParams();
  const roomNumber = searchParams.get("roomNumber") || "";
  const hourlyRate = searchParams.get("hourlyRate") || "";
  const oneAndHalfHourRate = searchParams.get("oneAndHalfHourRate") || "";
  const threeHourRate = searchParams.get("threeHourRate") || "";
  const overnightRate = searchParams.get("overnightRate") || "";
  const initialStatus = searchParams.get("status") || "";
  
  const [status, setStatus] = useState(initialStatus);
  const [rows, setRows] = useState<Row[]>([
    { code: "", description: "", quantity: 1, unitPrice: "", subtotal: "" },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; accountName: string }[]>([]);
  
  // Estados simplificados para las tarifas
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [selectedRate, setSelectedRate] = useState<number>(0); // Inicializar con 0 en lugar de null
  const [totalAmount, setTotalAmount] = useState(0);

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

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bankAccount"));
        const accountsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          accountName: doc.data().accountName,
        }));
        setBankAccounts(accountsData);
      } catch (error) {
        console.error("Error fetching bank accounts: ", error);
      }
    };
    fetchBankAccounts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatus(e.target.value);
  };

  const handleAddRow = () => {
    setRows([...rows, { code: "", description: "", quantity: 1, unitPrice: "", subtotal: "" }]);
  };

  const handleRowChange = (index: number, field: string, value: string | number) => {
    setRows(prevRows => {
      const updatedRows = [...prevRows];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      return updatedRows;
    });
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  // Función para calcular el subtotal
  const calculateSubtotal = (quantity: number, unitPrice: string) => {
    const cleanPrice = unitPrice.toString().replace(/[^\d.-]/g, '');
    const price = parseFloat(cleanPrice);
    return (quantity * price).toString();
  };

  // Función para actualizar todos los campos relacionados al seleccionar un producto
  const handleProductSelection = (index: number, selectedCode: string) => {
    const selectedProduct = products.find(product => product.code === selectedCode);
    
    if (selectedProduct) {
      const quantity = rows[index].quantity || 1;
      const unitPrice = selectedProduct.unitSaleValue;
      const subtotal = calculateSubtotal(Number(quantity), unitPrice);
      
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
    const cleanedValue = moneyString.replace(/[$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanedValue) || 0;
  };

  // Nueva función para calcular el total basado en períodos de tiempo
  const calculateTotalByHours = (checkIn: string, checkOut: string, rate: number): number => {
    if (!checkIn || !checkOut || rate === 0) return 0;
    
    const [checkInHours, checkInMinutes] = checkIn.split(":").map(Number);
    const [checkOutHours, checkOutMinutes] = checkOut.split(":").map(Number);
    
    // Calcular tiempo total en minutos
    let totalMinutes = (checkOutHours * 60 + checkOutMinutes) - (checkInHours * 60 + checkInMinutes);
    
    // Ajustar si la salida es al día siguiente
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Agregar 24 horas en minutos
    }
    
    // Determinar el período de tiempo según la tarifa seleccionada
    let periodMinutes = 60; // Por defecto 1 hora
    let isOvernightRate = false;
    
    // Identificar el tipo de tarifa basado en los valores
    const hourlyRateValue = parseMoneyString(hourlyRate);
    const oneAndHalfHourRateValue = parseMoneyString(oneAndHalfHourRate);
    const threeHourRateValue = parseMoneyString(threeHourRate);
    const overnightRateValue = parseMoneyString(overnightRate);
    
    if (rate === hourlyRateValue) {
      periodMinutes = 60; // 1 hora
    } else if (rate === oneAndHalfHourRateValue) {
      periodMinutes = 90; // 1.5 horas
    } else if (rate === threeHourRateValue) {
      periodMinutes = 180; // 3 horas
    } else if (rate === overnightRateValue) {
      isOvernightRate = true; // Tarifa fija nocturna
    }
    
    // Calcular el total según el tipo de tarifa
    if (isOvernightRate) {
      // Para tarifa nocturna, cobrar tarifa fija
      return rate;
    } else {
      // Calcular cuántos períodos completos hay
      const completePeriods = Math.ceil(totalMinutes / periodMinutes);
      return completePeriods * rate;
    }
  };

  const handleCalculateTotal = () => {
    const consumptionTotal = rows.reduce((sum, row) => sum + parseFloat(row.subtotal || "0"), 0);
    const hourlyTotal = calculateTotalByHours(checkInTime, checkOutTime, selectedRate);
    setTotalAmount(consumptionTotal + hourlyTotal);
  };

  useEffect(() => {
    handleCalculateTotal();
  }, [checkInTime, checkOutTime, selectedRate, rows]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const roomsQuery = query(collection(db, "roomsData"), where("roomNumber", "==", roomNumber));
      const querySnapshot = await getDocs(roomsQuery);
      if (!querySnapshot.empty) {
        const roomDoc = querySnapshot.docs[0];
        const roomDocRef = doc(db, "roomsData", roomDoc.id);
        await updateDoc(roomDocRef, { status: newStatus });
        setStatus(newStatus);
      } else {
        console.error("No se encontró un documento con el número de habitación especificado.");
      }
    } catch (error) {
      console.error("Error al actualizar el estado de la habitación: ", error);
    }
  };

  const handleRegisterPurchase = async () => {
    try {
      const roomNumber = searchParams.get("roomNumber") || "";
      const total = formatCurrency(totalAmount); // Usar totalAmount directamente
      const selectElement = document.querySelector("select");
      const selectedPaymentMethod = selectElement ? selectElement.options[selectElement.selectedIndex].text : "";

      const roomHistoryRef = await addDoc(collection(db, "roomHistory"), {
        date: serverTimestamp(),
        roomNumber: roomNumber,
        total: total,
        paymentMethod: selectedPaymentMethod,
      });

      const detailsRef = collection(roomHistoryRef, "details");
      for (const row of rows) {
        await addDoc(detailsRef, {
          code: row.code,
          description: row.description,
          unitPrice: row.unitPrice,
          quantity: row.quantity,
          subtotal: row.subtotal,
        });
      }

      await updateBankAccountAmount(selectedPaymentMethod, totalAmount);

      // Resetear el componente
      setRows([{ code: "", description: "", quantity: 1, unitPrice: "", subtotal: "" }]);
      setStatus("desocupado");
      setSelectedRate(0);
      setCheckInTime("");
      setCheckOutTime("");
      alert("Compra registrada exitosamente y habitación desocupada");
    } catch (error) {
      console.error("Error al registrar la compra: ", error);
      alert("Hubo un error al registrar la compra");
    }
  };

  const updateBankAccountAmount = async (selectedPaymentMethod: string, total: number) => {
    try {
      const bankAccountQuery = query(
        collection(db, "bankAccount"),
        where("accountName", "==", selectedPaymentMethod)
      );
      const querySnapshot = await getDocs(bankAccountQuery);
      if (!querySnapshot.empty) {
        const bankAccountDoc = querySnapshot.docs[0];
        const bankAccountRef = doc(db, "bankAccount", bankAccountDoc.id);
        await updateDoc(bankAccountRef, {
          initialAmount: increment(total),
        });
        console.log("Monto actualizado exitosamente en la cuenta bancaria");
      } else {
        console.warn("No se encontró una cuenta bancaria con el nombre: ", selectedPaymentMethod);
      }
    } catch (error) {
      console.error("Error al actualizar el monto de la cuenta bancaria: ", error);
    }
  };

  const handleUpdateProductQuantity = async () => {
    try {
      for (const row of rows) {
        if (row.code) {
          const quantityToDeduct = typeof row.quantity === 'string' ? 
            (parseInt(row.quantity, 10) || 1) : 
            (row.quantity || 1);
            
          const productsQuery = query(collection(db, "products"), where("code", "==", row.code));
          const querySnapshot = await getDocs(productsQuery);
          
          if (!querySnapshot.empty) {
            const productDoc = querySnapshot.docs[0];
            const productRef = doc(db, "products", productDoc.id);
            
            await updateDoc(productRef, {
              quantity: increment(-quantityToDeduct),
            });
          } else {
            console.warn(`Producto con código ${row.code} no encontrado.`);
          }
        }
      }
      alert("Inventario actualizado exitosamente");
    } catch (error) {
      console.error("Error al actualizar el inventario: ", error);
      alert("Hubo un error al actualizar el inventario");
    }
  };

  return (
    <div className="bg-white p-8">
      <h1 className="text-3xl font-bold text-blue-800 text-center mt-8 mb-4">
        Consumo de la Habitación {roomNumber}
      </h1>   
      <div className="w-full space-y-6 px-4 md:px-8 grid sm:grid-cols-1 md:grid-cols-2 border-2 border-blue-400 rounded-lg p-6 sahdow-lg">
        <div className="flex flex-col items-center bg-white shadow-2xl rounded-lg mr-2 p-6 col-span-2 lg:col-span-1 border-2 border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Estado de la Habitación</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="roomStatus"
                value="ocupado"
                checked={status === "ocupado"}
                onChange={() => handleStatusUpdate("ocupado")}
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
                onChange={() => handleStatusUpdate("desocupado")}
                className="form-radio text-blue-600"
              />
              <span className="text-blue-800 font-medium">Desocupado</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-center col-span-2 md:col-span-1 shadow-2xl border-2 border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-2 m-4">Total</h2>
          <p className="text-lg text-blue-800 font-bold mb-2 m-4">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="bg-white shadow-2xl border-2 border-blue-200 rounded-lg p-6 col-span-2 ">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Hora de Ingreso y Salida</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-blue-800 mb-1">Hora de Ingreso</label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="border border-blue-400 rounded-md p-2"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-blue-800 mb-1">Hora de Salida</label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="border border-blue-400 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="rateSelect" className="block text-sm font-medium text-gray-700">
                Seleccione una Tarifa
              </label>
              <select
                id="rateSelect"
                value={selectedRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value) || 0;
                  setSelectedRate(rate);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value={0}>Seleccione una tarifa</option>
                {hourlyRate && <option value={parseMoneyString(hourlyRate)}>Por hora - {hourlyRate}</option>}
                {oneAndHalfHourRate && <option value={parseMoneyString(oneAndHalfHourRate)}>1.5 horas - {oneAndHalfHourRate}</option>}
                {threeHourRate && <option value={parseMoneyString(threeHourRate)}>3 horas - {threeHourRate}</option>}
                {overnightRate && <option value={parseMoneyString(overnightRate)}>Nocturna - {overnightRate}</option>}
              </select>
            </div>
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
                    const exactMatch = products.find(product => product.code === value);
                    if (exactMatch) {
                      handleProductSelection(index, exactMatch.code);
                    }
                  }}
                  onBlur={(e) => {
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
                value={row.quantity}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  const quantity = inputValue === "" ? "" : inputValue;
                  handleRowChange(index, "quantity", quantity);
                  
                  if (row.unitPrice && inputValue !== "" && !isNaN(Number(inputValue))) {
                    const numQuantity = Number(inputValue);
                    const subtotal = calculateSubtotal(numQuantity, row.unitPrice);
                    handleRowChange(index, "subtotal", subtotal);
                  } else if (inputValue === "" || isNaN(Number(inputValue))) {
                    handleRowChange(index, "subtotal", "");
                  }
                }}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === "" || isNaN(Number(inputValue)) || Number(inputValue) < 1) {
                    handleRowChange(index, "quantity", 1);
                    if (row.unitPrice) {
                      const subtotal = calculateSubtotal(1, row.unitPrice);
                      handleRowChange(index, "subtotal", subtotal);
                    }
                  } else {
                    const finalQuantity = Math.max(1, Math.floor(Number(inputValue)));
                    handleRowChange(index, "quantity", finalQuantity);
                    if (row.unitPrice) {
                      const subtotal = calculateSubtotal(finalQuantity, row.unitPrice);
                      handleRowChange(index, "subtotal", subtotal);
                    }
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
          <div className="bg-white shadow-2xl border-2 border-blue-200 rounded-lg p-6 h-32 col-span-2 md:col-span-1 mt-6 mr-0 md:mr-4 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-blue-700 mb-4">
            Método de Pago
          </h2>
          <select className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountName}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 md:col-span-1 flex justify-center mt-8">
          <button
          onClick={async () => {
            await handleRegisterPurchase();
            await handleUpdateProductQuantity();
            setStatus("desocupado");
            await handleStatusUpdate("desocupado");
          }}
          className="mt-4 bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-700 h-12 mr-0 md:mr-32 lg:mr-96"
        >
          Registrar Compra
        </button>
        </div>
      </div>
    </div>
  );
};

export default RoomStatus;