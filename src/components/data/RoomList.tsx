'use client';

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/Index";
import { FaEdit } from "react-icons/fa";
import AddRoom from "./AddRoom";

interface Room {
  roomNumber: string;
  hourlyRate: string;
  oneAndHalfHourRate: string;
  threeHourRate: string;
  overnightRate: string;
}

const RoomList = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "roomsData"));
        const roomsData = querySnapshot.docs
          .map((doc) => ({
            roomNumber: doc.data().roomNumber,
            hourlyRate: doc.data().hourlyRate,
            oneAndHalfHourRate: doc.data().oneAndHalfHourRate,
            threeHourRate: doc.data().threeHourRate,
            overnightRate: doc.data().overnightRate,
          }))
          .sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber)); // Ordenar por número de habitación
        setRooms(roomsData);
      } catch (error) {
        console.error("Error fetching rooms: ", error);
      }
    };

    fetchRooms();
  }, []);

  // Filtrar habitaciones según el término de búsqueda
  const filteredRooms = rooms.filter((room) =>
    room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (room: Room) => {
    setRoomToEdit(room);
    setIsModalOpen(true);
  };

  const handleUpdateList = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "roomsData"));
      const roomsData = querySnapshot.docs
        .map((doc) => ({
          roomNumber: doc.data().roomNumber,
          hourlyRate: doc.data().hourlyRate,
          oneAndHalfHourRate: doc.data().oneAndHalfHourRate,
          threeHourRate: doc.data().threeHourRate,
          overnightRate: doc.data().overnightRate,
        }))
        .sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber)); // Ordenar por número de habitación
      setRooms(roomsData);
    } catch (error) {
      console.error("Error al actualizar la lista: ", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-sm md:text-lg font-bold text-indigo-800 text-center mt-8 mb-4">
        Lista de Habitaciones
      </h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por número de habitación"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 border border-blue-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-blue-300 rounded-lg overflow-hidden">
          <thead className="bg-blue-100">
            <tr>
              <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Número de Habitación</th>
              <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Tarifa por Hora</th>
              <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Tarifa por 1.5 Horas</th>
              <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Tarifa por 3 Horas</th>
              <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Tarifa de Amanecida</th>
              <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Editar</th>
            </tr>
          </thead>
            <tbody>
          {filteredRooms.map((room, index) => (
            <tr key={index} className="hover:bg-blue-50 transition-colors">
              <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">{room.roomNumber}</td>
              <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">{room.hourlyRate}</td>
              <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">{room.oneAndHalfHourRate}</td>
              <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">{room.threeHourRate}</td>
              <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">{room.overnightRate}</td>
              <td className="py-3 px-4 border-b border-blue-200 text-sm text-center">
                <button
                  onClick={() => handleEditClick(room)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaEdit size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <AddRoom roomData={roomToEdit} onUpdateList={handleUpdateList} />
            <div className=" flex justify-center mb-16">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-red-500 text-white px-8 py-2 rounded hover:bg-red-600 focus:outline-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList;