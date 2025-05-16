'use client';

import React, { useEffect, useRef, useState } from "react";
import { FaBars } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";

const TabMenu = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure TabMenu renders on all routes except /login
  if (pathname === "/login") {
    return null;
  }

  const [activeTab, setActiveTab] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const tabs = [
    { name: "Inicio", route: "#" },
    { name: "Productos", route: "product-list" },
    { name: "Inventario", route: "#" },
    { name: "Ventas", route: "#" },
    { name: "Reportes", route: "#" },
    { name: "Configuración", route: "#" },
    { name: "Ayuda", route: "#" },
  ];

  const handleTabClick = (index: number, route: string) => {
    setActiveTab(index);
    if (route === "product-list") {
      setIsProductsDropdownOpen(!isProductsDropdownOpen);
    } else {
      router.push(route);
    }
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
            <div
              key={index}
              className="relative"
              ref={tab.route === "product-list" ? dropdownRef : null}
            >
              <button
                onClick={() => handleTabClick(index, tab.route)}
                className={`relative px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md ${
                  activeTab === index
                    ? "bg-blue-800 border-t-4 border-l-4 border-r-4 border-blue-800"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {tab.name}
              </button>
              {tab.route === "product-list" && isProductsDropdownOpen && (
                <div className="absolute top-full left-0 bg-blue-700 text-white rounded-md shadow-md mt-1 w-64">
                  <button
                    onClick={() => router.push("/products-mb")}
                    className="block w-full text-left px-4 py-2 hover:bg-blue-600"
                  >
                    Registrar productos en el mini bar
                  </button>
                  <button
                    onClick={() => alert("Función no implementada aún.")}
                    className="block w-full text-left px-4 py-2 hover:bg-blue-600"
                  >
                    Registrar productos de aseo
                  </button>
                </div>
              )}
            </div>
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
