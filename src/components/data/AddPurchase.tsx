"use client";
import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
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
  const [bankAccounts, setBankAccounts] = useState<{ id: string; accountName: string }[]>([]);
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

  const handleAddRow = () => {
    setRows([
      ...rows,
      { code: "", description: "", quantity: 1, unitPrice: "", subtotal: "" },
    ]);
  };

  // Función mejorada para manejar cambios en las filas
  const handleRowChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setRows(prevRows => {
      const updatedRows = [...prevRows];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      
      // Si el campo que cambió es quantity, recalcular el subtotal
      if (field === 'quantity' && updatedRows[index].unitPrice) {
        const quantity = typeof value === 'number' ? value : parseInt(value.toString(), 10) || 0;
        const subtotal = calculateSubtotal(quantity, updatedRows[index].unitPrice);
        updatedRows[index].subtotal = subtotal;
      }
      
      return updatedRows;
    });
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const calculateSubtotal = (quantity: number, unitPrice: string) => {
    const cleanPrice = unitPrice.toString().replace(/[^\d.-]/g, "");
    const price = parseFloat(cleanPrice);
    return (quantity * price).toString();
  };

  const handleProductSelection = (index: number, selectedCode: string) => {
    const selectedProduct = products.find(
      (product) => product.code === selectedCode
    );
    if (selectedProduct) {
      setRows(prevRows => {
        const updatedRows = [...prevRows];
        const currentQuantity = updatedRows[index].quantity || 1;
        const unitPrice = selectedProduct.unitPurchaseValue;
        const subtotal = calculateSubtotal(currentQuantity, unitPrice);
        
        updatedRows[index] = {
          ...updatedRows[index],
          code: selectedProduct.code,
          description: selectedProduct.productName,
          unitPrice: unitPrice,
          subtotal: subtotal,
        };
        
        return updatedRows;
      });
    }
  };

  const parseMoneyString = (moneyString: string): number => {
    if (!moneyString) return 0;
    const cleanedValue = moneyString.replace(/[$\s.]/g, "").replace(",", ".");
    return parseFloat(cleanedValue) || 0;
  };

  const calculateTotal = () => {
    const consumptionTotal = rows.reduce((total, row) => {
      return total + parseMoneyString(row.subtotal);
    }, 0);
    const rateValue = parseMoneyString(selectedRateDisplay);
    const grandTotal = consumptionTotal + rateValue;
    return formatCurrency(grandTotal);
  };

  const handleRegisterPurchase = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    try {
      const paymentMethodSelect = document.querySelector("select");
      if (!paymentMethodSelect) {
        alert("Por favor, seleccione un método de pago.");
        return;
      }

      const paymentMethod = paymentMethodSelect.value;
      const total = calculateTotal();

      console.log("Estado actual de rows antes de registrar:", rows);

      // Crear un documento en la colección miniBarPurchases
      const purchaseRef = await addDoc(collection(db, "miniBarPurchases"), {
        date: serverTimestamp(),
        paymentMethod,
        total,
      });

      // Agregar los detalles de los productos a la subcolección details
      const detailsCollectionRef = collection(purchaseRef, "details");

      // Procesar cada fila: guardar en details y actualizar stock en products
      await Promise.all(
        rows.map(async (row) => {
          console.log(`Registrando fila con cantidad: ${row.quantity}`);
          
          // 1. Guardar en la subcolección details
          await addDoc(detailsCollectionRef, {
            code: row.code,
            description: row.description,
            quantity: Number(row.quantity),
            unitPrice: row.unitPrice,
            subtotal: row.subtotal,
          });

          // 2. Actualizar stock en la colección products
          if (row.code) {
            console.log(`Buscando producto con código: "${row.code}"`);
            
            // Buscar el producto por código en la colección products
            const productsQuery = query(
              collection(db, "products"),
              where("code", "==", row.code.trim()) // Eliminar espacios en blanco
            );
            
            const querySnapshot = await getDocs(productsQuery);
            console.log(`Documentos encontrados: ${querySnapshot.docs.length}`);
            
            if (!querySnapshot.empty) {
              // Si encontramos el producto, actualizar su cantidad
              const productDoc = querySnapshot.docs[0];
              const currentData = productDoc.data();
              
              console.log("Datos actuales del producto:", currentData);
              
              // Verificar diferentes nombres posibles para el campo cantidad
              const currentQuantity = Number(currentData.quantity || currentData.stock || currentData.availableQuantity || 0);
              const newQuantity = currentQuantity + Number(row.quantity);
              
              console.log(`Actualizando stock del producto ${row.code}: ${currentQuantity} + ${row.quantity} = ${newQuantity}`);
              
              // Actualizar el documento del producto - usar el mismo nombre de campo que existe
              const updateField = currentData.quantity !== undefined ? 'quantity' : 
                                 currentData.stock !== undefined ? 'stock' : 
                                 currentData.availableQuantity !== undefined ? 'availableQuantity' : 'quantity';
              
              await updateDoc(productDoc.ref, {
                [updateField]: newQuantity
              });
              
              console.log(`Stock actualizado exitosamente en el campo: ${updateField}`);
            } else {
              console.warn(`No se encontró el producto con código: "${row.code}"`);
              
              // Buscar todos los productos para comparar códigos
              const allProductsSnapshot = await getDocs(collection(db, "products"));
              console.log("Códigos existentes en products:");
              allProductsSnapshot.docs.forEach(doc => {
                console.log(`- "${doc.data().code}"`);
              });
            }
          }
        })
      );

      // Descontar el total del campo initialAmount en la colección bankAccount
      const bankAccountQuery = query(
        collection(db, "bankAccount"),
        where("accountName", "==", paymentMethod)
      );
      
      const bankAccountSnapshot = await getDocs(bankAccountQuery);
      
      if (!bankAccountSnapshot.empty) {
        const bankAccountDoc = bankAccountSnapshot.docs[0];
        const bankAccountData = bankAccountDoc.data();
        
        console.log("Datos de la cuenta bancaria:", bankAccountData);
        
        // Calcular nuevo monto inicial
        const currentInitialAmount = Number(bankAccountData.initialAmount || 0);
        const newInitialAmount = currentInitialAmount - parseMoneyString(total);
        
        // Actualizar documento de la cuenta bancaria
        await updateDoc(bankAccountDoc.ref, {
          initialAmount: newInitialAmount
        });
        
        console.log(`Monto descontado exitosamente. Nuevo monto inicial: ${newInitialAmount}`);
      } else {
        console.warn(`No se encontró la cuenta bancaria para el método de pago: "${paymentMethod}"`);
      }

      alert("Compra registrada exitosamente y stock actualizado");
      
      // Opcional: Limpiar el formulario después del registro exitoso
      setRows([{ code: "", description: "", quantity: 1, unitPrice: "", subtotal: "" }]);
      
    } catch (error) {
      console.error("Error al registrar la compra: ", error);
      alert("Hubo un error al registrar la compra");
    }
  };

  return (
    <div className="bg-white p-8">
      <h1 className="text-3xl font-bold text-blue-800 text-center mt-8 mb-4">
        Compras Mini Bar
      </h1>
      <form className="w-full space-y-6 px-4 md:px-8 grid sm:grid-cols-1 md:grid-cols-3 border- rounded-lg p-6 shadow-lg">
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
                    const exactMatch = products.find(
                      (product) => product.code === value
                    );
                    if (exactMatch) {
                      handleProductSelection(index, exactMatch.code);
                    }
                  }}
                  onBlur={(e) => {
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
                value={row.quantity}
                onChange={(e) => {
                  const quantity = parseInt(e.target.value, 10) || 1;
                  handleRowChange(index, "quantity", quantity);
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
                type="button"
                onClick={() => handleRemoveRow(index)}
                className="text-red-600 hover:text-red-800 flex items-center justify-center"
              >
                <FaTimes size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddRow}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-4"
          >
            Agregar Producto
          </button>
        </div>
        <div className="bg-white shadow-2xl border-2 border-blue-200 rounded-lg p-6 h-32 col-span-3 md:col-span-1 mt-6 mr-0 md:mr-4 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-blue-700 mb-4">
            Metodo de Pago
          </h2>
          <select className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.accountName}>
                {account.accountName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-row items-center justify-center w-full h-32 col-span-3 md:col-span-1 shadow-2xl border-2 border-blue-200 rounded-lg p-6 mt-6">
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
          <button
            type="button"
            onClick={handleRegisterPurchase}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-4"
          >
            Registrar Compra
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPurchase;