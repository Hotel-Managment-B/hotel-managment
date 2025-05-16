'use client';

import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import { usePathname } from "next/navigation";

const TabMenu = () => {
  const pathname = usePathname();

  // Ensure TabMenu renders on all routes except /login
  if (pathname === "/login") {
    return null;
  }

  const [activeTab, setActiveTab] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    "Inicio",
    "Productos",
    "Inventario",
    "Ventas",
    "Reportes",
    "Configuración",
    "Ayuda",
  ];

  return (
    <div className="fixed top-0 left-0 sm:w-4 md:w-full bg-blue-600 shadow-md z-50 rounded-lg mt-2">
      <div className="flex justify-between items-center h-12 px-4 sm:px-0 sm:justify-around">
        <button
          className="sm:hidden text-white text-2xl focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <FaBars />
        </button>
        <div className="hidden sm:flex justify-around items-center w-full">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`relative px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md ${
                activeTab === index
                  ? "bg-blue-800 border-t-4 border-l-4 border-r-4 border-blue-800"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {isMenuOpen && (
        <div className="sm:hidden bg-blue-700 text-white">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveTab(index);
                setIsMenuOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 font-semibold transition-colors duration-200 ${
                activeTab === index ? "bg-blue-800" : "hover:bg-blue-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TabMenu;
