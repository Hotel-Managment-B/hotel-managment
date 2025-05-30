"use client";

import { useState } from "react";
import MiniBarList from "@/components/data/MiniBarList";
import ToiletriesPurchaseList from "@/components/data/ToiletriesPurchaseList";

const MiniBarListPage = () => {
  const [selectedOption, setSelectedOption] = useState("mini-bar");

  return (
    <div className="mt-12 px-4">
      {/* Radio buttons para seleccionar la vista */}
      <div className="flex gap-4 ">
        <label className="flex items-center gap-1 text-blue-800 font-medium">
          <input
            type="radio"
            value="mini-bar"
            checked={selectedOption === "mini-bar"}
            onChange={() => setSelectedOption("mini-bar")}
          />
          Historial Compras de Mini Bar
        </label>
        <label className="flex items-center gap-1 text-blue-800 font-medium">
          <input
            type="radio"
            value="toiletries"
            checked={selectedOption === "toiletries"}
            onChange={() => setSelectedOption("toiletries")}
          />
          Historial Compras Productos de Aseo
        </label>
      </div>

      {/* Mostrar componente según la opción seleccionada */}
      {selectedOption === "mini-bar" ? (
        <MiniBarList />
      ) : (
        <ToiletriesPurchaseList />
      )}
    </div>
  );
};

export default MiniBarListPage;