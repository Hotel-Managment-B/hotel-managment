"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaBars } from "react-icons/fa";
import { useRouter } from "next/navigation";

const TabMenu = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("/dashboard");
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

  const getButtonClass = (path: string) => {
    return `${
      activeTab === path
        ? "bg-blue-800 border-t-4 border-l-4 border-r-4 border-blue-800"
        : "bg-blue-600 hover:bg-blue-700"
    } w-full sm:w-auto px-4 py-2 text-white font-semibold transition-colors duration-200 rounded-t-md`;
  };

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
              onClick={() => {
                setActiveTab("/dashboard");
                router.push("/dashboard");
              }}
              className={getButtonClass("/dashboard")}
            >
              Inicio
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setActiveTab("/products-mb");
                router.push("/products-mb");
              }}
              className={getButtonClass("/products-mb")}
            >
              Productos
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setActiveTab("/product-list");
                router.push("/product-list");
              }}
              className={getButtonClass("/product-list")}
            >
              Inventario
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setActiveTab("/ventas")}
              className={getButtonClass("/ventas")}
            >
              Ventas
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setActiveTab("/reportes")}
              className={getButtonClass("/reportes")}
            >
              Reportes
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setActiveTab("/configuracion")}
              className={getButtonClass("/configuracion")}
            >
              Configuración
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setActiveTab("/ayuda")}
              className={getButtonClass("/ayuda")}
            >
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
              setActiveTab("/dashboard");
              setIsMenuOpen(false);
              router.push("/dashboard");
            }}
            className={getButtonClass("/dashboard")}
          >
            Inicio
          </button>
          <button
            onClick={() => {
              setActiveTab("/products-mb");
              setIsMenuOpen(false);
              router.push("/products-mb");
            }}
            className={getButtonClass("/products-mb")}
          >
            Productos
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
              setActiveTab("/ventas");
              setIsMenuOpen(false);
              router.push("/ventas");
            }}
            className={getButtonClass("/ventas")}
          >
            Ventas
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
