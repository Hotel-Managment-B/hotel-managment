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
              setActiveTab("/inicio");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_INIT_ROUTE || "/");
            }}
            className={getButtonClass("/inicio")}
          >
            Inicio
          </button>
          <button
            onClick={() => {
              setActiveTab("/lista-empleados");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_W || "/");
            }}
            className={getButtonClass("/lista-empleados")}
          >
            Lista de Empleados
          </button>
          <button
            onClick={() => {
              setActiveTab("/bancos");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_X || "/");
            }}
            className={getButtonClass("/bancos")}
          >
            Cuentas Bancarias
          </button>
          <button
            onClick={() => {
              setActiveTab("/registrar");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_P || "/");
            }}
            className={getButtonClass("/registrar")}
          >
            Registrar Productos
          </button>
          <button
            onClick={() => {
              setActiveTab("/compras");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_C || "/");
            }}
            className={getButtonClass("/compras")}
          >
            Compras Productos
          </button>

          <button
            onClick={() => {
              setActiveTab("/inventario");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_I || "/");
            }}
            className={getButtonClass("/inventario")}
          >
            Inventario
          </button>
          <button
            onClick={() => {
              setActiveTab("/habitaciones");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_H || "/");
            }}
            className={getButtonClass("/habitaciones")}
          >
            Habitaciones
          </button>
          <button
            onClick={() => {
              setActiveTab("/gastos");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_G || "/");
            }}
            className={getButtonClass("/gastos")}
          >
            Gastos
          </button>
          <button
            onClick={() => {
              setActiveTab("/historial de gastos");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_L || "/");
            }}
            className={getButtonClass("/historial de gastos")}
          >
            Historial de Gastos
          </button>
          <button
            onClick={() => {
              setActiveTab("/insumos");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_T || "/");
            }}
            className={`${getButtonClass("/insumos")} whitespace-nowrap`}
          >
            Insumos Habitaciones
          </button>
          <button
            onClick={() => {
              setActiveTab("/historial-servicios");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_Z || "/");
            }}
            className={`${getButtonClass("/historial-servicios")} whitespace-nowrap`}
          >
            Historial de Servicios
          </button>
          <button
            onClick={() => {
              setActiveTab("/prestamos-empleados");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_N || "/");
            }}
            className={getButtonClass("/prestamos-empleados")}
          >
            Prestamos
          </button>
          <button
            onClick={() => {
              setActiveTab("/lista-prestamos");
              setIsMenuOpen(false);
              router.push(process.env.NEXT_PUBLIC_CUSTOM_ROUTE_O || "/");
            }}
            className={getButtonClass("/lista-prestamos")}
          >
            Lista de Prestamos
          </button>
        </div>
      )}
    </div>
  );
};

export default TabMenu;
