"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { db } from "../../firebase/Index";
import ToiletriesSpentList from './ToiletriesSpentList';

const ToiletriesSpent = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedPiece, setSelectedPiece] = useState("");
  const [toiletries, setToiletries] = useState<string[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [rooms, setRooms] = useState<number[]>([]);
  const [refreshList, setRefreshList] = useState(false);

  useEffect(() => {
    const fetchToiletries = async () => {
      const querySnapshot = await getDocs(collection(db, "toiletries"));
      const options = querySnapshot.docs.map((doc) => doc.data().name);
      setToiletries(options);
      setFilteredOptions(options);
    };
    fetchToiletries();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "roomsData"));
        const roomNumbers = querySnapshot.docs.map((doc) => doc.data().roomNumber);
        setRooms(roomNumbers);
      } catch (error) {
        console.error("Error al obtener los números de habitación:", error);
      }
    };
    fetchRooms();
  }, []);

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(e.target.value);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Number(e.target.value));
  };

  const handlePieceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPiece(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toLowerCase();
    setSelectedOption(inputValue);
    setFilteredOptions(
      toiletries.filter((option) => option.toLowerCase().includes(inputValue))
    );
  };

  const handleRegisterUsage = async () => {
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement | null;
    if (!selectedOption || !quantity || !selectedPiece || !dateInput || !dateInput.value) {
      alert("Por favor, complete todos los campos requeridos.");
      return;
    }

    try {
      await addDoc(collection(db, "toiletriesSpent"), {
        date: serverTimestamp(),
        item: selectedOption,
        quantity: quantity,
        room: selectedPiece,
        notes: notes || "",
      });
      alert("Uso registrado exitosamente.");

      // Resetear los campos después de registrar
      setSelectedOption("");
      setQuantity(1);
      setSelectedPiece("");
      setNotes("");

      // Activar la actualización de la lista
      setRefreshList(!refreshList);
    } catch (error) {
      console.error("Error al registrar el uso:", error);
      alert("Hubo un error al registrar el uso.");
    }
  };

  const handleUpdateQuantity = async () => {
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement | null;
    if (!selectedOption || !quantity || !selectedPiece || !dateInput || !dateInput.value) {
      alert("Por favor, complete todos los campos requeridos.");
      return;
    }

    try {
      const normalizedOption =
        selectedOption.charAt(0).toUpperCase() + selectedOption.slice(1).toLowerCase();
      const toiletriesQuery = query(
        collection(db, "toiletries"),
        where("name", "==", normalizedOption)
      );
      const querySnapshot = await getDocs(toiletriesQuery);

      if (!querySnapshot.empty) {
        const toiletryDoc = querySnapshot.docs[0];
        const toiletryRef = doc(db, "toiletries", toiletryDoc.id);

        await updateDoc(toiletryRef, {
          quantity: increment(-quantity),
        });

        alert("Cantidad actualizada exitosamente.");
      } else {
        alert("No se encontró el artículo especificado en la colección.");
      }
    } catch (error) {
      console.error("Error al actualizar la cantidad:", error);
      alert("Hubo un error al actualizar la cantidad.");
    }
  };

  return (
    <>
    <div className="flex justify-center items-center">
         <h1 className="text-lg text-center font-bold text-blue-900 mt-4 w-full bg-gradient-to-b from-blue-100 to-blue-200 p-2 rounded-lg shadow-lg border-2 border-blue-300">
          Consumo de Artículos de Aseo
        </h1>
       </div>
      <div className="bg-white rounded-3xl border border-blue-400 mt-4 shadow-2xl p-8 m-4">
       
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          <div className="col-span-4 md:col-span-1 mb-4 mr-0 md:mr-4">
            <label className="block text-sm font-medium text-blue-900">
              Fecha
            </label>
            <input
              type="date"
              className="h-8 mt-1 text-center block w-full border rounded-md shadow-sm border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="col-span-4 md:col-span-1 mb-4 mr-0 md:mr-4">
            <label
              htmlFor="optionInput"
              className="block text-sm font-medium text-blue-900"
            >
              Seleccione un artículo de aseo
            </label>
            <input
              id="optionInput"
              type="text"
              value={selectedOption}
              onChange={handleInputChange}
              className="h-8 mt-1 text-center block w-full border rounded-md shadow-sm  border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              list="toiletries-options"
            />
            <datalist id="toiletries-options">
              {filteredOptions.map((option, index) => (
                <option key={index} value={option} />
              ))}
            </datalist>
          </div>

          <div className="col-span-4 md:col-span-1 mb-4 mr-0 md:mr-4">
            <label
              htmlFor="quantityInput"
              className="block text-sm font-medium text-blue-900"
            >
              Cantidad utilizada
            </label>
            <input
              id="quantityInput"
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              className="h-8 mt-1 text-center block w-full border rounded-md shadow-sm  border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              min="1"
            />
          </div>

          <div className="col-span-4 md:col-span-1 mb-4 mr-0 md:mr-4">
            <label
              htmlFor="pieceSelect"
              className="block text-sm font-medium text-blue-900"
            >
              Seleccione una Habitación
            </label>
            <select
              id="pieceSelect"
              value={selectedPiece}
              onChange={handlePieceChange}
              className="h-8 mt-1 text-center block w-full border rounded-md shadow-sm  border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Seleccione...</option>
              {rooms.map((roomNumber, index) => (
                <option key={index} value={roomNumber}>{`Habitación ${roomNumber}`}</option>
              ))}
            </select>
          </div>
          <div className="col-span-4 md:col-span-2">
            <label className="block text-sm font-medium text-blue-900">
              Observaciones
            </label>
            <textarea
              className="w-full h-16 p-2 border rounded-md shadow-sm  border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
          <div className="col-span-4 md:col-span-3 lg:col-span-2 mr-18 md:mr-30 lg:mr-64 flex justify-center items-center">
            <button
              onClick={async () => {
                await handleRegisterUsage();
                await handleUpdateQuantity();
              }}
              className="mt-4 ml-18 md:ml-32 bg-blue-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-600"
            >
              Registrar Uso
            </button>
          </div>
        </div>
        
      </div>
      <div className="m-4">
        <ToiletriesSpentList refresh={refreshList} />
      </div>
    </>
  );
};

export default ToiletriesSpent;
