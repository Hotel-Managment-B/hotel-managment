import { Suspense } from 'react';
import RoomStatus from "@/components/data/RoomStatus";

export default function RoomStatusPage() {
  return (
    <Suspense fallback={<div>Cargando estado de habitación...</div>}>
      <RoomStatus />
    </Suspense>
  );
}
