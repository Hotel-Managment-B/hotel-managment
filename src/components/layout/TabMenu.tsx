"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaBars } from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";

const TabMenu = () => {
  const router = useRouter();
  const pathname = usePathname(); // Obtener la ruta actual
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("/dashboard");
  const menuRef = useRef<HTMLDivElement>(null);

  // No renderizar el TabMenu en la página de login
  const shouldRenderTabMenu = pathname !== "/login";

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

  if (!shouldRenderTabMenu) {
    return null;
  }

  const getButtonClass = (path: string) => {
    return `${
      activeTab === path
        ? "bg-blue-800 border-t-4 border-l-4 border-r-4 border-blue-800"
        : "bg-blue-600 hover:bg-blue-700"
    } w-full sm:w-auto px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md`;
  };

  return (
    <div className="fixed top-0 left-0 z-50 m-2">
      <button
        className="text-white text-2xl p-2 focus:outline-none bg-blue-600 rounded-md"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <FaBars />
      </button>
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-12 left-0 bg-blue-600 text-white flex flex-col items-start p-4 rounded-md shadow-lg"
        >
          <button
            onClick={() => {
              setActiveTab("/dashboard");
              setIsMenuOpen(false);
              router.push("/dashboard");
            }}
            className={getButtonClass("/dashboard")}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("/products-mb");
              setIsMenuOpen(false);
              router.push("/products-mb");
            }}
            className={getButtonClass("/products-mb")}
          >
            Registrar
          </button>
          <button
            onClick={() => {
              setActiveTab("/product-list");
              setIsMenuOpen(false);
              router.push("/product-list");
            }}
            className={getButtonClass("/product-list")}
          >
            Inventario
          </button>
          <button
            onClick={() => {
              setActiveTab("/room-data");
              setIsMenuOpen(false);
              router.push("/room-data");
            }}
            className={getButtonClass("/room-data")}
          >
            Habitaciones
          </button>
          <button
            onClick={() => {
              setActiveTab("/reportes");
              setIsMenuOpen(false);
              router.push("/reportes");
            }}
            className={getButtonClass("/reportes")}
          >
            Reportes
          </button>
          <button
            onClick={() => {
              setActiveTab("/configuracion");
              setIsMenuOpen(false);
              router.push("/configuracion");
            }}
            className={getButtonClass("/configuracion")}
          >
            Configuración
          </button>
          <button
            onClick={() => {
              setActiveTab("/ayuda");
              setIsMenuOpen(false);
              router.push("/ayuda");
            }}
            className={getButtonClass("/ayuda")}
          >
            Ayuda
          </button>
        </div>
      )}
    </div>
  );
};

export default TabMenu;
