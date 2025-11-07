'use client';

import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../utils/FormatCurrency";
import { db } from "../../firebase/Index";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

interface AddRoomProps {
  roomData?: {
    roomNumber: string;
    hourlyRate: string;
    oneAndHalfHourRate: string;
    threeHourRate: string;
    overnightRate: string;
    additionalHourRate?: string; // Nuevo campo
  } | null;
  onUpdateList?: () => Promise<void>;
}

const AddRoom: React.FC<AddRoomProps> = ({ roomData: initialRoomData, onUpdateList }) => {
  const [roomData, setRoomData] = useState<{
    roomNumber: string;
    hourlyRate: string;
    oneAndHalfHourRate: string;
    threeHourRate: string;
    overnightRate: string;
    additionalHourRate: string;
  }>({
    roomNumber: initialRoomData?.roomNumber || "",
    hourlyRate: initialRoomData?.hourlyRate || "",
    oneAndHalfHourRate: initialRoomData?.oneAndHalfHourRate || "",
    threeHourRate: initialRoomData?.threeHourRate || "",
    overnightRate: initialRoomData?.overnightRate || "",
    additionalHourRate: initialRoomData?.additionalHourRate || "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialRoomData) {
      setRoomData({
        roomNumber: initialRoomData.roomNumber,
        hourlyRate: initialRoomData.hourlyRate,
        oneAndHalfHourRate: initialRoomData.oneAndHalfHourRate,
        threeHourRate: initialRoomData.threeHourRate,
        overnightRate: initialRoomData.overnightRate,
        additionalHourRate: initialRoomData.additionalHourRate || "", // Nuevo campo
      });
    }
  }, [initialRoomData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue =
      name === "hourlyRate" ||
      name === "oneAndHalfHourRate" ||
      name === "threeHourRate" ||
      name === "overnightRate" ||
      name === "additionalHourRate" // Nuevo campo
        ? formatCurrency(value)
        : value;
    setRoomData({ ...roomData, [name]: formattedValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialRoomData) {
        // Buscar el documento por el campo roomNumber
        const q = query(
          collection(db, "roomsData"),
          where("roomNumber", "==", initialRoomData.roomNumber)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const roomDoc = querySnapshot.docs[0]; // Obtener el primer documento que coincida
          const roomDocRef = doc(db, "roomsData", roomDoc.id);

          const updatedData = {
            roomNumber: roomData.roomNumber,
            hourlyRate: roomData.hourlyRate,
            oneAndHalfHourRate: roomData.oneAndHalfHourRate,
            threeHourRate: roomData.threeHourRate,
            overnightRate: roomData.overnightRate,
            additionalHourRate: roomData.additionalHourRate, // Nuevo campo
          }; // Excluir el campo status

          await updateDoc(roomDocRef, updatedData);
          setMessage("Cambios guardados exitosamente.");

          if (onUpdateList) {
            await onUpdateList(); // Actualizar la lista
          }
        } else {
          setMessage("Error: No se encontró el documento para actualizar.");
        }
      } else {
        // Registrar una nueva habitación
        const q = query(
          collection(db, "roomsData"),
          where("roomNumber", "==", roomData.roomNumber)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setMessage("Error: El número de habitación ya existe.");
          return;
        }

        const newRoomData = {
          ...roomData,
          status: "Desocupado", // Campo por defecto
        };

        const docRef = await addDoc(collection(db, "roomsData"), newRoomData);
        console.log("Room added with ID: ", docRef.id);
        setMessage("Registro exitoso.");

        if (onUpdateList) {
          await onUpdateList(); // Actualizar la lista
        }
      }

      // Opcional: cerrar el modal o resetear el formulario
    } catch (error) {
      console.error("Error al guardar los cambios: ", error);
      setMessage("Error al guardar los cambios.");
    }
  };

  const isEditing = !!initialRoomData;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 py-8">
      <div className="bg-white shadow-2xl border-2 border-blue-200 rounded-lg p-6 w-full max-w-4xl mx-4">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
          {isEditing ? "Editar Habitación" : "Registrar Habitación"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-1">
                Número de Habitación
              </label>
              <input
                type="text"
                name="roomNumber"
                value={roomData.roomNumber}
                onChange={handleChange}
                className="w-full border border-blue-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-1">
                Valor por Hora
              </label>
              <input
                type="text"
                name="hourlyRate"
                value={roomData.hourlyRate}
                onChange={handleChange}
                className="w-full border border-blue-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-1">
                Valor por Hora y Media
              </label>
              <input
                type="text"
                name="oneAndHalfHourRate"
                value={roomData.oneAndHalfHourRate}
                onChange={handleChange}
                className="w-full border border-blue-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-1">
                Valor por 3 Horas
              </label>
              <input
                type="text"
                name="threeHourRate"
                value={roomData.threeHourRate}
                onChange={handleChange}
                className="w-full border border-blue-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-1">
                Valor de Amanecida
              </label>
              <input
                type="text"
                name="overnightRate"
                value={roomData.overnightRate}
                onChange={handleChange}
                className="w-full border border-blue-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-1">
                Valor de Hora Adicional
              </label>
              <input
                type="text"
                name="additionalHourRate"
                value={roomData.additionalHourRate}
                onChange={handleChange}
                className="w-full border border-blue-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                required
              />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-64 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isEditing ? "Guardar Cambios" : "Registrar Habitación"}
            </button>
          </div>
        </form>
        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              message.includes("Error") ? "text-red-500" : "text-blue-800"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AddRoom;
