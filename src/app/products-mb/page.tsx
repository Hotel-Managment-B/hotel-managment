"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const RegisterProducts = dynamic(() => import("@/components/data/RegisterProducts"), {
  ssr: false,
});
const RegisterToiletries = dynamic(() => import("@/components/data/RegisterToiletries"), {
  ssr: false,
});
const AddRoom = dynamic(() => import("@/components/data/AddRoom"), {
  ssr: false,
});

const ClientWrapper = () => {
  const [selectedOption, setSelectedOption] = useState("mini-bar");

  const handleProductAdded = () => {
    console.log("Producto agregado");
  };

  return (
      <div className=" px-4 bg-blue-50 h-screen">
      {/* Header Flex Container */}
      <div className="flex items-center justify-center flex-wrap gap-4 mb-6 mt-12 md:mt-0">
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
          <label className="flex items-center gap-1 text-blue-800 font-medium">
            <input
              type="radio"
              value="add-room"
              checked={selectedOption === "add-room"}
              onChange={() => setSelectedOption("add-room")}
            />
            Registrar Habitación
          </label>
        </div>
      </div>
      {/* Mostrar componente según la opción seleccionada */}
      {selectedOption === "mini-bar" ? (
        <RegisterProducts onProductAdded={handleProductAdded} />
      ) : selectedOption === "toiletries" ? (
        <RegisterToiletries onProductAdded={handleProductAdded} />
      ) : (
        <AddRoom />
      )}
    </div>
  );
};

export default ClientWrapper;