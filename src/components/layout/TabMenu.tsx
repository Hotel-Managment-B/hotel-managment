'use client';

import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";

const TabMenu = () => {
  const pathname = usePathname();
  const router = useRouter();

  // Ensure TabMenu renders on all routes except /login
  if (pathname === "/login") {
    return null;
  }

  const [activeTab, setActiveTab] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { name: "Inicio", route: "dashboard" },
    { name: "Productos", route: "product-list" },
    { name: "Inventario", route: "product-list" },
    { name: "Ventas", route: "#" },
    { name: "Reportes", route: "#" },
    { name: "Configuración", route: "#" },
    { name: "Ayuda", route: "#" },
  ];

  const handleTabClick = (index: number, route: string) => {
    setActiveTab(index);
    router.push(route);
  };

  return (
    <div className="fixed top-0 left-0 sm:w-4 md:w-full bg-blue-600 shadow-md z-50 rounded-lg">
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
              onClick={() => {
                setActiveTab(index);
                router.push(tab.route);
              }}
              className={`relative px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md ${
                activeTab === index
                  ? "bg-blue-800 border-t-4 border-l-4 border-r-4 border-blue-800"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {tab.name}
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
                router.push(tab.route);
              }}
              className={`block w-full text-left px-4 py-2 font-semibold transition-colors duration-200 ${
                activeTab === index ? "bg-blue-800" : "hover:bg-blue-600"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TabMenu;
