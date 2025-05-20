'use client';

import React, { useState } from "react";
import { formatCurrency } from "../../utils/FormatCurrency";
import { db } from "../../firebase/Index";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

const AddRoom = () => {
  const [roomData, setRoomData] = useState({
    roomNumber: "",
    hourlyRate: "",
    oneAndHalfHourRate: "",
    threeHourRate: "",
    overnightRate: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue =
      name === "hourlyRate" ||
      name === "oneAndHalfHourRate" ||
      name === "threeHourRate" ||
      name === "overnightRate"
        ? formatCurrency(value)
        : value;
    setRoomData({ ...roomData, [name]: formattedValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check if room number already exists
      const q = query(
        collection(db, "roomsData"),
        where("roomNumber", "==", roomData.roomNumber)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setMessage("Error: El número de habitación ya existe.");
        return;
      }

      // Add new room
      const docRef = await addDoc(collection(db, "roomsData"), roomData);
      console.log("Room added with ID: ", docRef.id);
      setMessage("Registro exitoso.");

      // Optionally reset the form
      setRoomData({
        roomNumber: "",
        hourlyRate: "",
        oneAndHalfHourRate: "",
        threeHourRate: "",
        overnightRate: "",
      });
    } catch (error) {
      console.error("Error adding room: ", error);
      setMessage("Error al registrar la habitación.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Registrar Habitación</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-blue-800 mb-1">Número de Habitación</label>
            <input
              type="text"
              name="roomNumber"
              value={roomData.roomNumber}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-800 mb-1">Valor por Hora</label>
            <input
              type="text"
              name="hourlyRate"
              value={roomData.hourlyRate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-800 mb-1">Valor por Hora y Media</label>
            <input
              type="text"
              name="oneAndHalfHourRate"
              value={roomData.oneAndHalfHourRate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-800 mb-1">Valor por 3 Horas</label>
            <input
              type="text"
              name="threeHourRate"
              value={roomData.threeHourRate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-800 mb-1">Valor de Amanecida</label>
            <input
              type="text"
              name="overnightRate"
              value={roomData.overnightRate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              required
            />
          </div>
          <div className="flex justify-center">
            <button
            type="submit"
            className="w-64 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Registrar Habitación
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
