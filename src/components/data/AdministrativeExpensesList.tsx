"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/Index";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";

interface AdministrativeExpense {
  date: { seconds: number };
  expenseType: string; // Nuevo campo para tipo de gasto
  concept: string;
  value: string;
  bank: string;
}

interface AdministrativeExpensesListProps {
  refresh: boolean;
}

const AdministrativeExpensesList: React.FC<AdministrativeExpensesListProps> = ({
  refresh,
}) => {
  const [allExpenses, setAllExpenses] = useState<AdministrativeExpense[]>([]); // Todos los gastos sin filtrar
  const [filteredExpenses, setFilteredExpenses] = useState<
    AdministrativeExpense[]
  >([]); // Gastos después de aplicar filtros
  const [displayedExpenses, setDisplayedExpenses] = useState<
    AdministrativeExpense[]
  >([]); // Gastos mostrados en la página actual
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Referencia para la tabla
  const tableRef = useRef<HTMLDivElement>(null);
  // Estados para los filtros de fecha
  const [startDay, setStartDay] = useState<string>("");
  const [startMonth, setStartMonth] = useState<string>("");
  const [startYear, setStartYear] = useState<string>("2025"); // Año actual por defecto

  const [endDay, setEndDay] = useState<string>("");
  const [endMonth, setEndMonth] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("2025"); // Año actual por defecto
  // Función para actualizar los gastos mostrados en la página actual
  const updateDisplayedExpenses = useCallback((
    expenses: AdministrativeExpense[],
    page: number
  ) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedExpenses(expenses.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(expenses.length / itemsPerPage));
  }, [itemsPerPage]);

  // Función para cambiar de página
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    updateDisplayedExpenses(filteredExpenses, newPage);

    // Scroll al inicio de la tabla
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Opciones para los selectores
  const days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const years = Array.from({ length: 10 }, (_, i) => (2025 - 5 + i).toString()); // 5 años atrás y 5 adelante

  // Obtener la fecha actual formateada
  const getCurrentDateValues = () => {
    const today = new Date();
    return {
      day: today.getDate().toString().padStart(2, "0"),
      month: (today.getMonth() + 1).toString().padStart(2, "0"),
      year: today.getFullYear().toString(),
    };
  };
  // Función para aplicar los filtros
  const applyDateFilters = () => {
    if (
      !startDay ||
      !startMonth ||
      !startYear ||
      !endDay ||
      !endMonth ||
      !endYear
    ) {
      setFilteredExpenses(allExpenses);
      updateDisplayedExpenses(allExpenses, 1);
      return;
    }

    // Crear fechas en formato día/mes/año
    const startDateStr = `${startDay}/${startMonth}/${startYear}`;
    const endDateStr = `${endDay}/${endMonth}/${endYear}`;

    // Convertir a objetos Date para comparación (formato MM/DD/YYYY para constructor Date)
    const startDate = new Date(`${startMonth}/${startDay}/${startYear}`);
    const endDate = new Date(`${endMonth}/${endDay}/${endYear}`);
    endDate.setHours(23, 59, 59, 999); // Establecer al final del día

    console.log("Filtro aplicado - Fecha inicio:", startDateStr);
    console.log("Filtro aplicado - Fecha fin:", endDateStr);
    console.log("Objetos Date - Inicio:", startDate);
    console.log("Objetos Date - Fin:", endDate);

    const newFilteredExpenses = allExpenses.filter((expense) => {
      const expenseDate = new Date(expense.date.seconds * 1000);
      const result = expenseDate >= startDate && expenseDate <= endDate;
      console.log(
        "Comparando fecha:",
        expenseDate.toLocaleDateString(),
        "Timestamp:",
        expense.date.seconds,
        "¿Dentro del rango?:",
        result
      );
      return result;
    });

    console.log("Total gastos:", allExpenses.length);
    console.log("Gastos filtrados:", newFilteredExpenses.length);

    setFilteredExpenses(newFilteredExpenses);
    setCurrentPage(1); // Volver a la primera página al aplicar filtros
    updateDisplayedExpenses(newFilteredExpenses, 1);
  }; // Función para aplicar los filtros con la fecha actual
  const applyCurrentDateFilter = () => {
    const current = getCurrentDateValues();
    setStartDay(current.day);
    setStartMonth(current.month);
    setStartYear(current.year);
    setEndDay(current.day);
    setEndMonth(current.month);
    setEndYear(current.year);

    // Aplicar filtro inmediatamente con la fecha actual
    const startDate = new Date(
      `${current.month}/${current.day}/${current.year}`
    );
    const endDate = new Date(`${current.month}/${current.day}/${current.year}`);
    endDate.setHours(23, 59, 59, 999);

    const newFilteredExpenses = allExpenses.filter((expense) => {
      const expenseDate = new Date(expense.date.seconds * 1000);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    setFilteredExpenses(newFilteredExpenses);
    setCurrentPage(1); // Volver a la primera página
    updateDisplayedExpenses(newFilteredExpenses, 1);
  }; // Función para resetear los filtros
  const resetFilters = () => {
    setStartDay("");
    setStartMonth("");
    setStartYear("2025");
    setEndDay("");
    setEndMonth("");
    setEndYear("2025");
    setFilteredExpenses(allExpenses);
    setCurrentPage(1); // Volver a la primera página
    updateDisplayedExpenses(allExpenses, 1);
  }; // Función para exportar a Excel
  const exportToExcel = async () => {
    try {
      // Verificar si hay datos para exportar
      if (filteredExpenses.length === 0) {
        toast.warning("No hay datos para exportar. Por favor, ajuste los filtros.");
        return;
      }

      setIsExporting(true);

      // Crear un nuevo libro de trabajo
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Sistema de Gestión Hotelera";
      workbook.lastModifiedBy = "Sistema de Gestión Hotelera";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Añadir una hoja de trabajo
      const worksheet = workbook.addWorksheet("Gastos Administrativos");

      // Definir las columnas
      worksheet.columns = [
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Tipo de Gasto", key: "tipoGasto", width: 25 },
        { header: "Concepto", key: "concepto", width: 35 },
        { header: "Valor", key: "valor", width: 18 },
        { header: "Banco", key: "banco", width: 18 },
      ];

      // Estilo para los encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "000000" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D9E1F2" }, // Color azul claro
      };
      headerRow.alignment = { horizontal: "center" };

      // Añadir los datos
      filteredExpenses.forEach((expense: AdministrativeExpense) => {
        worksheet.addRow({
          fecha: new Date(expense.date.seconds * 1000).toLocaleDateString(
            "es-ES",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }
          ),
          tipoGasto: expense.expenseType,
          concepto: expense.concept,
          valor: expense.value,
          banco: expense.bank,
        });
      });

      // Aplicar bordes a todas las celdas con datos
      for (let i = 1; i <= filteredExpenses.length + 1; i++) {
        const row = worksheet.getRow(i);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }

      // Aplicar formato de tabla
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: filteredExpenses.length + 1, column: 5 },
      };

      // Generar nombre de archivo con fecha y hora actual
      const now = new Date();
      const dateStr = now
        .toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-");
      const timeStr = now
        .toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replace(/:/g, "-");

      // Incluir información del filtro en el nombre del archivo
      let fileName = `Gastos_Administrativos_${dateStr}_${timeStr}`;

      // Si hay filtros aplicados, incluirlos en el nombre
      if (
        startDay &&
        startMonth &&
        startYear &&
        endDay &&
        endMonth &&
        endYear
      ) {
        const filtroStr = `_${startDay}-${startMonth}-${startYear}_al_${endDay}-${endMonth}-${endYear}`;
        fileName += filtroStr;
      }

      fileName += ".xlsx";

      // Generar el archivo y descargarlo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, fileName);

      console.log("Excel exportado con éxito:", fileName);
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error("Error al exportar a Excel. Por favor, intente de nuevo.");
      setIsExporting(false);
    }
  };
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const expensesQuery = query(
          collection(db, "administrativeExpenses"),
          orderBy("date", "asc")
        );
        const querySnapshot = await getDocs(expensesQuery);
        const expensesData = querySnapshot.docs.map(
          (doc) => doc.data() as AdministrativeExpense
        );
        setAllExpenses(expensesData);
        setFilteredExpenses(expensesData); // Inicialmente todos los gastos sin filtrar
        updateDisplayedExpenses(expensesData, 1); // Mostrar la primera página
      } catch (error) {
        console.error("Error al obtener los gastos administrativos:", error);
      }
    };    fetchExpenses();
  }, [refresh, itemsPerPage, updateDisplayedExpenses]);

  return (
    <>
      {" "}
      <div className="text-center mt-8 w-full bg-gradient-to-b from-blue-100 to-blue-200 h-8 rounded-lg shadow-lg">
        <h1 className="text-sm md:text-lg font-bold text-blue-800">
          Historial de Gastos Administrativos
        </h1>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={exportToExcel}
          disabled={isExporting || filteredExpenses.length === 0}
          className={`px-4 py-2 rounded-md text-sm transition-colors flex items-center
                   ${
                     isExporting
                       ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                       : filteredExpenses.length === 0
                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                       : "bg-green-600 text-white hover:bg-green-700"
                   }`}
        >
          {isExporting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Exportando...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Exportar a Excel{filteredExpenses.length > 0 ? `` : ""}
            </>
          )}
        </button>
      </div>
      {/* Filtros de fecha */}
      <div className="bg-white p-4 mt-4 shadow-md rounded-lg">
        <h2 className="text-sm md:text-md font-semibold text-blue-800 mb-3">
          Filtrar por rango de fecha
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fecha de inicio */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-blue-900">Desde:</h3>
            <div className="flex flex-wrap gap-2">
              <div className="w-24">
                <label className="block text-xs text-gray-600">Día</label>
                <select
                  value={startDay}
                  onChange={(e) => setStartDay(e.target.value)}
                  className="w-full p-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Día</option>
                  {days.map((day) => (
                    <option key={`start-day-${day}`} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-600">Mes</label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full p-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Mes</option>
                  {months.map((month) => (
                    <option key={`start-month-${month}`} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-600">Año</label>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="w-full p-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {years.map((year) => (
                    <option key={`start-year-${year}`} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Fecha de fin */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-blue-900">Hasta:</h3>
            <div className="flex flex-wrap gap-2">
              <div className="w-24">
                <label className="block text-xs text-gray-600">Día</label>
                <select
                  value={endDay}
                  onChange={(e) => setEndDay(e.target.value)}
                  className="w-full p-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Día</option>
                  {days.map((day) => (
                    <option key={`end-day-${day}`} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-600">Mes</label>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full p-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Mes</option>
                  {months.map((month) => (
                    <option key={`end-month-${month}`} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-600">Año</label>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="w-full p-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {years.map((year) => (
                    <option key={`end-year-${year}`} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Botones de acción */}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={applyDateFilters}
            className="px-4 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
          >
            Aplicar Filtros
          </button>
          <button
            onClick={applyCurrentDateFilter}
            className="px-4 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
          >
            Filtrar Fecha Actual
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-1 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400 transition-colors"
          >
            Mostrar Todo
          </button>
        </div>      </div>      <div
        className="bg-white p-4 md:p-8 shadow-lg rounded-lg sm:overflow-y-auto sm:max-h-96 md:overflow-visible md:max-h-full"
        ref={tableRef}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-blue-300 rounded-lg overflow-hidden">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Fecha</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Tipo de Gasto</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Concepto</th>
                <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Valor</th>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Banco</th>
              </tr>
            </thead>
            <tbody>
              {displayedExpenses.length > 0 ? (
                displayedExpenses.map(
                  (expense: AdministrativeExpense, index: number) => (
                    <tr key={index} className="hover:bg-blue-50 transition-colors">
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                        {new Date(
                          expense.date.seconds * 1000
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                        {expense.expenseType}
                      </td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                        {expense.concept}
                      </td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">
                        {expense.value}
                      </td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                        {expense.bank}
                      </td>
                    </tr>
                  )
                )
              ) : (                <tr><td
                    colSpan={5}
                    className="py-8 px-4 text-center text-gray-500 border-b border-blue-200"
                  >
                    No se encontraron registros para el filtro seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Controles de paginación */}
        {filteredExpenses.length > 0 && (
          <div className="flex flex-col justify-between items-center mt-6 px-2 py-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-3 w-full text-center">
              Mostrando {displayedExpenses.length} de {filteredExpenses.length}{" "}
              registros
            </div>

            {/* Controles de navegación - rediseño para dispositivos pequeños */}
            <div className="flex flex-wrap justify-center items-center gap-2 w-full mb-3">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => changePage(1)}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded text-sm ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
                  aria-label="Primera página"
                >
                  &lt;&lt;
                </button>
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded text-sm ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
                  aria-label="Página anterior"
                >
                  &lt;
                </button>
              </div>

              <span className="text-sm font-medium px-2 bg-white rounded-md py-1 border border-blue-200">
                Página {currentPage} de {totalPages}
              </span>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 rounded text-sm ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
                  aria-label="Página siguiente"
                >
                  &gt;
                </button>
                <button
                  onClick={() => changePage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 rounded text-sm ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
                  aria-label="Última página"
                >
                  &gt;&gt;
                </button>
              </div>
            </div>

            {/* Selector de items por página */}
            <div className="w-full flex justify-center">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const newItemsPerPage = Number(e.target.value);
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1);
                  updateDisplayedExpenses(filteredExpenses, 1);
                }}
                className="px-3 py-1.5 text-sm border border-blue-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full max-w-[150px]"
                aria-label="Elementos por página"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>
          </div>
        )}
      </div>{" "}
    </>
  );
};

export default AdministrativeExpensesList;
