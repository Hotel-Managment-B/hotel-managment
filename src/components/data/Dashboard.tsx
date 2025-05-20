'use client';

import React from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const Dashboard = () => {
  const salesData = {
    labels: ["Producto A", "Producto B", "Producto C"],
    datasets: [
      {
        label: "Productos más vendidos",
        data: [300, 200, 100],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const leastSalesData = {
    labels: ["Producto X", "Producto Y", "Producto Z"],
    datasets: [
      {
        label: "Productos menos vendidos",
        data: [50, 30, 20],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const mostUsedPartsData = {
    labels: ["Pieza 1", "Pieza 2", "Pieza 3"],
    datasets: [
      {
        label: "Piezas más usadas",
        data: [400, 300, 200],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const leastUsedPartsData = {
    labels: ["Pieza A", "Pieza B", "Pieza C"],
    datasets: [
      {
        label: "Piezas menos usadas",
        data: [10, 5, 2],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-900 mt-12">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-green-100 p-3 sm:p-4 rounded-lg shadow-md text-center">
          <h2 className="text-lg sm:text-xl font-bold text-green-900">Ventas</h2>
          <p className="text-xl sm:text-2xl font-semibold text-green-700">$10,000</p>
        </div>
        <div className="bg-red-100 p-3 sm:p-4 rounded-lg shadow-md text-center">
          <h2 className="text-lg sm:text-xl font-bold text-red-900">Gastos</h2>
          <p className="text-xl sm:text-2xl font-semibold text-red-700">$5,000</p>
        </div>
        <div className="bg-blue-100 p-3 sm:p-4 rounded-lg shadow-md text-center">
          <h2 className="text-lg sm:text-xl font-bold text-blue-900">Inventarios</h2>
          <p className="text-xl sm:text-2xl font-semibold text-blue-700">$7,000</p>
        </div>
        <div className="bg-yellow-100 p-3 sm:p-4 rounded-lg shadow-md text-center">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-900">Compras</h2>
          <p className="text-xl sm:text-2xl font-semibold text-yellow-700">$8,000</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Productos más vendidos</h3>
          <Doughnut data={salesData} />
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Productos menos vendidos</h3>
          <Doughnut data={leastSalesData} />
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Piezas más usadas</h3>
          <Bar data={mostUsedPartsData} />
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Piezas menos usadas</h3>
          <Bar data={leastUsedPartsData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
