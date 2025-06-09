"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../firebase/Index";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface Room {
  id: string;
  roomNumber: string;
  hourlyRate: string;
  oneAndHalfHourRate: string;
  threeHourRate: string;
  overnightRate: string;
  status: string;
}

const RoomService = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "roomsData"));
        const roomsData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            roomNumber: doc.data().roomNumber || "",
            hourlyRate: doc.data().hourlyRate || "",
            oneAndHalfHourRate: doc.data().oneAndHalfHourRate || "",
            threeHourRate: doc.data().threeHourRate || "",
            overnightRate: doc.data().overnightRate || "",
            status: doc.data().status || "",
          }))
          .sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber));
        setRooms(roomsData);
      } catch (error) {
        console.error("Error fetching rooms: ", error);
      }
    };

    fetchRooms();
  }, []);

  return (
    <div className="p-4">
      <div className="w-full bg-gradient-to-b from-indigo-100 to-indigo-200 h-8 mb-8  rounded-lg shadow-lg">
        <h1 className="text-sm md:text-2xl font-bold text-indigo-800 text-center mt-16 mb-4">
          Habitaciones
        </h1>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <li key={room.id}>
            <div              onClick={() => {
                setActiveRoom(room.roomNumber); // Actualizar la habitación activa
                console.log(
                  `Navigating to: /room-status?roomNumber=${room.roomNumber}&status=${room.status}&hourlyRate=${room.hourlyRate}&oneAndHalfHourRate=${room.oneAndHalfHourRate}&threeHourRate=${room.threeHourRate}&overnightRate=${room.overnightRate}&from=roomservice`
                );
                router.push(
                  `/room-status?roomNumber=${room.roomNumber}&status=${room.status}&hourlyRate=${room.hourlyRate}&oneAndHalfHourRate=${room.oneAndHalfHourRate}&threeHourRate=${room.threeHourRate}&overnightRate=${room.overnightRate}&from=roomservice`
                );
              }}
              className={`cursor-pointer ${
                activeRoom === room.roomNumber
                  ? "bg-blue-300"
                  : room.status === "ocupado"
                  ? "bg-green-200 text-green-900 hover:bg-green-400"
                  : "bg-blue-100"
              } hover:bg-blue-300 text-blue-800 font-semibold rounded-lg shadow-md p-4 text-center transition duration-300`}
            >
              Habitación {room.roomNumber}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomService;
