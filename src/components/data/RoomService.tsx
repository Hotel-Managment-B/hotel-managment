'use client';

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
}

const RoomService = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
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
      <h1 className="text-3xl font-bold text-indigo-800 text-center mt-16 mb-4">Habitaciones</h1>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <li key={room.id}>
            <div
              onClick={() => router.push(`/room-status?roomNumber=${room.roomNumber}&hourlyRate=${room.hourlyRate}&oneAndHalfHourRate=${room.oneAndHalfHourRate}&threeHourRate=${room.threeHourRate}&overnightRate=${room.overnightRate}`)}
              className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold rounded-lg shadow-md p-4 text-center transition duration-300"
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
