"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const RegisterProducts = dynamic(() => import("@/components/data/RegisterProducts"), {
  ssr: false,
});
const RegisterToiletries = dynamic(() => import("@/components/data/RegisterToiletries"), {
  ssr: false,
});

const ClientWrapper = () => {
  const [selectedOption, setSelectedOption] = useState("mini-bar");

  const handleProductAdded = () => {
    console.log("Producto agregado");
  };

  return (
    <div className="mt-12 px-4">
      {/* Header Flex Container */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        {/* Radio buttons a la izquierda */}
        <div className="flex gap-4 order-1 sm:order-none">
          <label className="flex items-center gap-1 text-blue-800 font-medium">
            <input
              type="radio"
              value="mini-bar"
              checked={selectedOption === "mini-bar"}
              onChange={() => setSelectedOption("mini-bar")}
            />
            Registrar Productos Mini Bar
          </label>
          <label className="flex items-center gap-1 text-blue-800 font-medium">
            <input
              type="radio"
              value="toiletries"
              checked={selectedOption === "toiletries"}
              onChange={() => setSelectedOption("toiletries")}
            />
            Registrar Productos de Aseo
          </label>
        </div>
      </div>
      {/* Mostrar componente según la opción seleccionada */}
      {selectedOption === "mini-bar" ? (
        <RegisterProducts onProductAdded={handleProductAdded} />
      ) : (
        <RegisterToiletries onProductAdded={handleProductAdded} />
      )}
    </div>
  );
};

export default ClientWrapper;