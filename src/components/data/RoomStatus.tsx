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
  quantity: number | string; // Permitir tanto number como string
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
  const [bankAccounts, setBankAccounts] = useState<{ id: string; accountName: string }[]>([]); // Estado para las cuentas bancarias
  
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

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bankAccount"));
        const accountsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          accountName: doc.data().accountName, // Usar el campo accountName
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

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      // Buscar el documento por el campo roomNumber
      const roomsQuery = query(collection(db, "roomsData"), where("roomNumber", "==", roomNumber));
      const querySnapshot = await getDocs(roomsQuery);

      if (!querySnapshot.empty) {
        const roomDoc = querySnapshot.docs[0]; // Obtener el primer documento que coincida
        const roomDocRef = doc(db, "roomsData", roomDoc.id);

        // Actualizar el estado en Firebase
        await updateDoc(roomDocRef, { status: newStatus });
        setStatus(newStatus); // Actualizar el estado localmente
      } else {
        console.error("No se encontró un documento con el número de habitación especificado.");
      }
    } catch (error) {
      console.error("Error al actualizar el estado de la habitación: ", error);
    }
  };

  const handleRegisterPurchase = async () => {
    try {
      const roomNumber = searchParams.get("roomNumber") || ""; // Obtener el número de habitación
      const total = calculateTotal(); // Obtener el total del label
      const selectElement = document.querySelector("select");
      const selectedPaymentMethod = selectElement ? selectElement.options[selectElement.selectedIndex].text : ""; // Obtener el texto del método de pago seleccionado

      // Crear la colección roomHistory con la subcolección details
      const roomHistoryRef = await addDoc(collection(db, "roomHistory"), {
        date: serverTimestamp(),
        roomNumber: roomNumber,
        total: total,
        paymentMethod: selectedPaymentMethod, // Registrar el método de pago
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

      // Actualizar el monto en la cuenta bancaria
      await updateBankAccountAmount(selectedPaymentMethod, parseMoneyString(total));

      // Resetear el componente
      setRows([{ code: "", description: "", quantity: 1, unitPrice: "", subtotal: "" }]);
      setStatus("desocupado");

      alert("Compra registrada exitosamente y habitación desocupada");
    } catch (error) {
      console.error("Error al registrar la compra: ", error);
      alert("Hubo un error al registrar la compra");
    }
  };

  const updateBankAccountAmount = async (selectedPaymentMethod: string, total: number) => {
    try {
      // Buscar el documento en la colección bankAccount que coincida con el accountName
      const bankAccountQuery = query(
        collection(db, "bankAccount"),
        where("accountName", "==", selectedPaymentMethod) // Comparar directamente con accountName
      );
      const querySnapshot = await getDocs(bankAccountQuery);

      if (!querySnapshot.empty) {
        const bankAccountDoc = querySnapshot.docs[0]; // Obtener el primer documento que coincida
        const bankAccountRef = doc(db, "bankAccount", bankAccountDoc.id); // Referencia al documento

        // Actualizar el campo initialAmount sumando el total
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
          // Asegurar que la cantidad sea un número válido
          const quantityToDeduct = typeof row.quantity === 'string' ? 
            (parseInt(row.quantity, 10) || 1) : 
            (row.quantity || 1);
            
          // Buscar el producto por código en la colección usando query
          const productsQuery = query(collection(db, "products"), where("code", "==", row.code));
          const querySnapshot = await getDocs(productsQuery);
          
          if (!querySnapshot.empty) {
            const productDoc = querySnapshot.docs[0];
            const productRef = doc(db, "products", productDoc.id);
            
            await updateDoc(productRef, {
              quantity: increment(-quantityToDeduct), // Descontar la cantidad correcta
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
                value={row.quantity}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Permitir valores vacíos y números
                  const quantity = inputValue === "" ? "" : inputValue;
                  handleRowChange(index, "quantity", quantity);
                  
                  // Recalcular el subtotal solo si hay un valor numérico válido
                  if (row.unitPrice && inputValue !== "" && !isNaN(Number(inputValue))) {
                    const numQuantity = Number(inputValue);
                    const subtotal = calculateSubtotal(numQuantity, row.unitPrice);
                    handleRowChange(index, "subtotal", subtotal);
                  } else if (inputValue === "" || isNaN(Number(inputValue))) {
                    // Si no hay cantidad válida, limpiar el subtotal
                    handleRowChange(index, "subtotal", "");
                  }
                }}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  // Al perder el foco, asegurar que haya un valor mínimo de 1
                  if (inputValue === "" || isNaN(Number(inputValue)) || Number(inputValue) < 1) {
                    handleRowChange(index, "quantity", 1);
                    if (row.unitPrice) {
                      const subtotal = calculateSubtotal(1, row.unitPrice);
                      handleRowChange(index, "subtotal", subtotal);
                    }
                  } else {
                    // Asegurar que sea un número entero
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
            await handleRegisterPurchase(); // Registrar la compra
            await handleUpdateProductQuantity(); // Actualizar el inventario
            setStatus("desocupado"); // Cambiar el estado de la habitación a desocupado
            await handleStatusUpdate("desocupado"); // Actualizar el estado en Firebase
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