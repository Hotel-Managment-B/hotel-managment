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

const ToiletriesSpent = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedPiece, setSelectedPiece] = useState("");
  const [toiletries, setToiletries] = useState<string[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [rooms, setRooms] = useState<number[]>([]);

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
    if (!selectedOption || !quantity || !selectedPiece) {
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
    } catch (error) {
      console.error("Error al registrar el uso:", error);
      alert("Hubo un error al registrar el uso.");
    }
  };

  const handleUpdateQuantity = async () => {
    if (!selectedOption || !quantity) {
      alert("Por favor, complete los campos requeridos.");
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
    <div className="bg-white rounded-3xl border border-blue-400 m-4 shadow-2xl p-8">
      <h1 className="text-lg font-bold text-blue-900 mb-4 mt-4">
        Gastos de Artículos de Aseo
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="mr-0 md:mr-64">
          <label className="block text-sm font-medium text-blue-900">
            Fecha
          </label>
          <input
            type="date"
            className="mt-1 block w-full border rounded-md shadow-sm border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="mb-4 mr-0 md:mr-64">
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
            className="mt-1 block w-full border rounded-md shadow-sm  border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            list="toiletries-options"
          />
          <datalist id="toiletries-options">
            {filteredOptions.map((option, index) => (
              <option key={index} value={option} />
            ))}
          </datalist>
        </div>

        <div className="mb-4 mr-0 md:mr-64">
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
            className="mt-1 block w-full border rounded-md shadow-sm  border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            min="1"
          />
        </div>

        <div className="mb-4 mr-0 md:mr-64">
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
            className="mt-1 block w-full border rounded-md shadow-sm  border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Seleccione...</option>
            {rooms.map((roomNumber, index) => (
              <option key={index} value={roomNumber}>{`Habitación ${roomNumber}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-900">
            Observaciones
          </label>
          <textarea
            className="w-full h-16 p-2 border rounded-md shadow-sm  border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>
        <div>
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
  );
};

export default ToiletriesSpent;
