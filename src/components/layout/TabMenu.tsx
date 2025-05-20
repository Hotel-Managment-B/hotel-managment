'use client';

import React, { useEffect, useRef, useState } from "react";
import { FaBars } from "react-icons/fa";
import { useRouter } from "next/navigation";

const TabMenu = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full bg-blue-600 shadow-md z-50">
      <div className="flex justify-between items-center h-12 px-4">
        <button
          className="sm:hidden text-white text-2xl focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <FaBars />
        </button>
        <div className="text-white text-2xl hidden sm:block">Logo</div>
        <div className="hidden sm:flex justify-around items-center w-full">
          <div className="relative">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md bg-blue-800 border-t-4 border-l-4 border-r-4 border-blue-800"
            >
              Inicio
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => router.push("/products-mb")}
              className="px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md bg-blue-600 hover:bg-blue-700"
            >
              Productos
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => router.push("/product-list")}
              className="px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md bg-blue-600 hover:bg-blue-700"
            >
              Inventario
            </button>
          </div>
          <div className="relative">
            <button className="px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md bg-blue-600 hover:bg-blue-700">
              Ventas
            </button>
          </div>
          <div className="relative">
            <button className="px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md bg-blue-600 hover:bg-blue-700">
              Reportes
            </button>
          </div>
          <div className="relative">
            <button className="px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md bg-blue-600 hover:bg-blue-700">
              Configuración
            </button>
          </div>
          <div className="relative">
            <button className="px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md bg-blue-600 hover:bg-blue-700">
              Ayuda
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="sm:hidden bg-blue-700 text-white flex flex-col items-start p-4"
        >
          <button
            onClick={() => {
              setIsMenuOpen(false);
              router.push("/dashboard");
            }}
            className="w-full text-left px-4 py-2 hover:bg-blue-600"
          >
            Inicio
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              router.push("/products-mb");
            }}
            className="w-full text-left px-4 py-2 hover:bg-blue-600"
          >
            Productos
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              router.push("/product-list");
            }}
            className="w-full text-left px-4 py-2 hover:bg-blue-600"
          >
            Inventario
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              router.push("/ventas");
            }}
            className="w-full text-left px-4 py-2 hover:bg-blue-600"
          >
            Ventas
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              router.push("/reportes");
            }}
            className="w-full text-left px-4 py-2 hover:bg-blue-600"
          >
            Reportes
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              router.push("/configuracion");
            }}
            className="w-full text-left px-4 py-2 hover:bg-blue-600"
          >
            Configuración
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              router.push("/ayuda");
            }}
            className="w-full text-left px-4 py-2 hover:bg-blue-600"
          >
            Ayuda
          </button>
        </div>
      )}
    </div>
  );
};

export default TabMenu;
