'use client'

import { useState } from "react";
import ListProducts from "@/components/data/ListProducts";
import ListToiletries from "@/components/data/ListToiletries";

export default function ListProductsPage() {
  const [selectedOption, setSelectedOption] = useState("mini-bar");

  return (
    <div className="mt-16 px-4">
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
            Productos Mini Bar
          </label>
          <label className="flex items-center gap-1 text-blue-800 font-medium">
            <input
              type="radio"
              value="toiletries"
              checked={selectedOption === "toiletries"}
              onChange={() => setSelectedOption("toiletries")}
            />
            Productos de Aseo
          </label>
        </div>

        {/* Título centrado siempre */}
        <h2 className="text-3xl font-bold text-blue-900 mx-auto order-0 sm:order-none">
          {selectedOption === "mini-bar" ? "Productos Mini Bar" : "Productos de Aseo"}
        </h2>
      </div>

      {/* Lista de productos */}
      {selectedOption === "mini-bar" ? <ListProducts /> : <ListToiletries />}
    </div>
  );
}
