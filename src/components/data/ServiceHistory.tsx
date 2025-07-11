'use client';

import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, doc, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/Index';
import { formatCurrency } from '../../utils/FormatCurrency';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { FixedSizeList as List } from 'react-window';

interface ServiceHistoryItem {
  id: string;
  date: { seconds: number; nanoseconds: number } | Timestamp;
  roomNumber: string;
  paymentMethod: string;
  total: string;
  details: ServiceDetail[];
}

interface ServiceDetail {
  // Campos de productos
  description?: string;
  quantity?: number;
  subtotal?: string;
  unitPrice?: string;
  
  // Campos de información del servicio
  type?: string;
  checkInTime?: string;
  checkOutTime?: string;
  selectedRate?: number;
  additionalHourCost?: number;
  additionalHourQuantity?: number;
  totalAdditionalHourCost?: number;
  planName?: string;
}

const ServiceHistory = () => {
  const [historyItems, setHistoryItems] = useState<ServiceHistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ServiceHistoryItem[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<ServiceDetail[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  
  // Ordenamiento
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [displayedItems, setDisplayedItems] = useState<ServiceHistoryItem[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Estado para exportación
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Estado para seguimiento de carga de detalles
  const [detailsLoadingProgress, setDetailsLoadingProgress] = useState<number>(0);
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        const historyQuery = query(
          collection(db, 'roomHistory'),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(historyQuery);
          // Obtener todos los documentos primero sin cargar detalles
        const basicHistoryItems: ServiceHistoryItem[] = querySnapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          date: docSnapshot.data().date,
          roomNumber: docSnapshot.data().roomNumber,
          paymentMethod: docSnapshot.data().paymentMethod,
          total: docSnapshot.data().total,
          details: [] // Inicializamos con un array vacío
        }));
        
        // Establecer los datos básicos inmediatamente para mejorar la experiencia del usuario
        setHistoryItems(basicHistoryItems);
        setFilteredItems(basicHistoryItems);
        setCurrentPage(1);
        updateDisplayedItems(basicHistoryItems, 1);
        setLoading(false);
        
        // Luego, cargar los detalles en segundo plano
        const historyData = [...basicHistoryItems];
        let detailsLoaded = 0;
        
        // Función para actualizar el progreso y los datos
        const updateWithDetails = (index: number, details: ServiceDetail[]) => {
          historyData[index].details = details;
          detailsLoaded++;
          setDetailsLoadingProgress(Math.round((detailsLoaded / historyData.length) * 100));
          
          // Actualizar los datos después de cargar cierta cantidad de detalles o al finalizar
          if (detailsLoaded % 10 === 0 || detailsLoaded === historyData.length) {
            setHistoryItems([...historyData]);
            setFilteredItems([...historyData]);
            updateDisplayedItems([...historyData], currentPage);
          }
        };
        
        // Cargar detalles en paralelo con límites para no sobrecargar
        const batchSize = 5; // Procesar en lotes para no sobrecargar
        for (let i = 0; i < basicHistoryItems.length; i += batchSize) {
          const batch = basicHistoryItems.slice(i, i + batchSize);
          
          // Procesamiento en paralelo de cada lote
          await Promise.all(
            batch.map(async (item, batchIndex) => {
              try {
                const detailsRef = collection(doc(db, 'roomHistory', item.id), 'details');
                const detailsSnapshot = await getDocs(detailsRef);
                
                const details = detailsSnapshot.docs.map(detailDoc => {
                  const data = detailDoc.data();
                  return {
                    // Campos de productos
                    description: data.description,
                    quantity: data.quantity,
                    subtotal: data.subtotal,
                    unitPrice: data.unitPrice,
                    
                    // Campos de información del servicio
                    type: data.type,
                    checkInTime: data.checkInTime,
                    checkOutTime: data.checkOutTime,
                    selectedRate: data.selectedRate,
                    additionalHourCost: data.additionalHourCost,
                    additionalHourQuantity: data.additionalHourQuantity,
                    totalAdditionalHourCost: data.totalAdditionalHourCost,
                    planName: data.planName,
                  };
                });
                
                updateWithDetails(i + batchIndex, details);
              } catch (detailError) {
                console.error(`Error cargando detalles para item ${item.id}:`, detailError);
                updateWithDetails(i + batchIndex, []);
              }
            })
          );
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching room history:', err);
        setError('Error al cargar el historial de servicios');
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);
  useEffect(() => {
    // Aplicar filtros
    let result = [...historyItems];
    
    if (roomFilter) {
      result = result.filter(item => 
        item.roomNumber.toLowerCase().includes(roomFilter.toLowerCase())
      );
    }
    
    if (paymentMethodFilter) {
      result = result.filter(item => 
        item.paymentMethod.toLowerCase().includes(paymentMethodFilter.toLowerCase())
      );
    }
    
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(item => {
        const itemDate = new Date((item.date as any).seconds * 1000);
        return itemDate >= fromDate;
      });
    }
    
    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        const itemDate = new Date((item.date as any).seconds * 1000);
        return itemDate <= toDate;
      });
    }
    
    // Aplicar ordenamiento
    result.sort((a, b) => {
      let valueA, valueB;
      
      if (sortField === 'date') {
        valueA = (a.date as any).seconds;
        valueB = (b.date as any).seconds;
      } else if (sortField === 'roomNumber') {
        valueA = parseInt(a.roomNumber);
        valueB = parseInt(b.roomNumber);
      } else if (sortField === 'total') {
        valueA = parseFloat(a.total.replace(/[^\d.-]/g, ''));
        valueB = parseFloat(b.total.replace(/[^\d.-]/g, ''));
      } else {
        valueA = a[sortField as keyof ServiceHistoryItem];
        valueB = b[sortField as keyof ServiceHistoryItem];
      }
      
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredItems(result);
    setCurrentPage(1); // Volver a la primera página al aplicar filtros
    updateDisplayedItems(result, 1);
  }, [historyItems, roomFilter, dateFromFilter, dateToFilter, paymentMethodFilter, sortField, sortDirection, itemsPerPage]);
  
  useEffect(() => {
    // Actualizar la paginación
    const total = filteredItems.length;
    const pages = Math.ceil(total / itemsPerPage);
    setTotalPages(pages);
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setDisplayedItems(filteredItems.slice(start, end));
  }, [filteredItems, currentPage, itemsPerPage]);

  const fetchDetails = async (historyId: string) => {
    try {
      // Buscar el item en el array filtrado
      const item = filteredItems.find(item => item.id === historyId);
      
      if (item && item.details) {
        // Si el item existe y tiene detalles precargados, los usamos directamente
        setSelectedDetails(item.details);
        setIsModalOpen(true);
        setError(null);
      } else {
        // Si por algún motivo no tenemos los detalles, los cargamos desde Firestore
        setLoading(true);
        const detailsRef = collection(doc(db, 'roomHistory', historyId), 'details');
        const querySnapshot = await getDocs(detailsRef);
        
        if (querySnapshot.empty) {
          setSelectedDetails([]);
        } else {        const detailsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            // Campos de productos
            description: data.description,
            quantity: data.quantity,
            subtotal: data.subtotal,
            unitPrice: data.unitPrice,
            
            // Campos de información del servicio
            type: data.type,
            checkInTime: data.checkInTime,
            checkOutTime: data.checkOutTime,
            selectedRate: data.selectedRate,
            additionalHourCost: data.additionalHourCost,
            additionalHourQuantity: data.additionalHourQuantity,
            totalAdditionalHourCost: data.totalAdditionalHourCost,
            planName: data.planName,
          };
        });
          setSelectedDetails(detailsData);
        }
        
        setIsModalOpen(true);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
      setError('Error al cargar los detalles del servicio');
      setSelectedDetails([]);
      setLoading(false);
    }
  };

  // Función para actualizar los elementos mostrados en la página actual
  const updateDisplayedItems = (items: ServiceHistoryItem[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedItems(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };
  
  // Función para cambiar de página
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    updateDisplayedItems(filteredItems, newPage);
    
    // Scroll al inicio de la tabla
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDetails(null);
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const clearFilters = () => {
    setRoomFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setPaymentMethodFilter('');
    setCurrentPage(1);
    updateDisplayedItems(historyItems, 1);
  };
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    updateDisplayedItems(filteredItems, page);
    
    // Scroll al inicio de la tabla
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Función para exportar a Excel
  const exportToExcel = async () => {
    try {
      // Verificar si hay datos para exportar
      if (filteredItems.length === 0) {
        alert('No hay datos para exportar. Por favor, ajuste los filtros.');
        return;
      }

      setIsExporting(true);

      // Crear un nuevo libro de trabajo
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Gestión Hotelera';
      workbook.lastModifiedBy = 'Sistema de Gestión Hotelera';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Añadir una hoja de trabajo
      const worksheet = workbook.addWorksheet('Historial de Servicios');

      // Definir las columnas
      worksheet.columns = [
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Habitación', key: 'habitacion', width: 15 },
        { header: 'Método de Pago', key: 'metodoPago', width: 20 },
        { header: 'Total', key: 'total', width: 18 }
      ];

      // Estilo para los encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: '000000' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9E1F2' } // Color azul claro
      };
      headerRow.alignment = { horizontal: 'center' };

      // Añadir los datos
      filteredItems.forEach((item: ServiceHistoryItem) => {
        worksheet.addRow({
          fecha: new Date((item.date as any).seconds * 1000).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          habitacion: item.roomNumber,
          metodoPago: item.paymentMethod,
          total: formatCurrency(item.total)
        });
      });

      // Si queremos incluir los detalles, podemos añadir una hoja adicional
      if (filteredItems.some(item => item.details && item.details.length > 0)) {
        const detailsWorksheet = workbook.addWorksheet('Detalles de Servicios');
        
        // Definir las columnas para detalles
        detailsWorksheet.columns = [
          { header: 'Habitación', key: 'habitacion', width: 15 },
          { header: 'Fecha', key: 'fecha', width: 15 },
          { header: 'Descripción', key: 'descripcion', width: 30 },
          { header: 'Cantidad', key: 'cantidad', width: 12 },
          { header: 'Precio Unitario', key: 'precioUnitario', width: 18 },
          { header: 'Subtotal', key: 'subtotal', width: 18 }
        ];
        
        // Estilo para los encabezados de detalles
        const detailsHeaderRow = detailsWorksheet.getRow(1);
        detailsHeaderRow.font = { bold: true, color: { argb: '000000' } };
        detailsHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D9E1F2' } // Color azul claro
        };
        detailsHeaderRow.alignment = { horizontal: 'center' };
        
        // Añadir los detalles
        let rowIndex = 2;
        filteredItems.forEach((item: ServiceHistoryItem) => {
          if (item.details && item.details.length > 0) {
            const fecha = new Date((item.date as any).seconds * 1000).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
            
            item.details.forEach((detail: ServiceDetail) => {
              detailsWorksheet.addRow({
                habitacion: item.roomNumber,
                fecha: fecha,
                descripcion: detail.description || 'N/A',
                cantidad: detail.quantity || 0,
                precioUnitario: detail.unitPrice ? formatCurrency(detail.unitPrice) : 'N/A',
                subtotal: detail.subtotal ? formatCurrency(detail.subtotal) : 'N/A'
              });
              rowIndex++;
            });
          }
        });
        
        // Aplicar bordes a todas las celdas con datos en la hoja de detalles
        for (let i = 1; i <= rowIndex - 1; i++) {
          const row = detailsWorksheet.getRow(i);
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
        
        // Aplicar formato de tabla a la hoja de detalles
        detailsWorksheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: rowIndex - 1, column: 6 }
        };
      }

      // Aplicar bordes a todas las celdas con datos en la hoja principal
      for (let i = 1; i <= filteredItems.length + 1; i++) {
        const row = worksheet.getRow(i);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }

      // Aplicar formato de tabla a la hoja principal
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: filteredItems.length + 1, column: 4 }
      };

      // Generar nombre de archivo con fecha y hora actual
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/:/g, '-');
      
      // Incluir información del filtro en el nombre del archivo
      let fileName = `Historial_Servicios_${dateStr}_${timeStr}`;
      
      // Si hay filtros aplicados, incluirlos en el nombre
      if (dateFromFilter && dateToFilter) {
        const fromDate = new Date(dateFromFilter).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-');
        
        const toDate = new Date(dateToFilter).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-');
        
        fileName += `_del_${fromDate}_al_${toDate}`;
      }
      
      fileName += '.xlsx';

      // Generar el archivo y descargarlo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
      
      console.log('Excel exportado con éxito:', fileName);
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel. Por favor, intente de nuevo.');
      setIsExporting(false);
    }
  };

  return (    <div className="p-4 m-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Historial de Servicios de Habitaciones</h2>

      <div className="flex justify-end mt-4">
        <button 
          onClick={exportToExcel}
          disabled={isExporting || filteredItems.length === 0}
          className={`px-4 py-2 rounded-md text-sm transition-colors flex items-center
                     ${isExporting 
                       ? 'bg-gray-400 text-gray-100 cursor-not-allowed' 
                       : filteredItems.length === 0 
                         ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                         : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          {isExporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exportando...
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar a Excel
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Filtros */}      <div className="mt-6 mb-4 p-4 bg-white rounded-lg border border-blue-300 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Habitación</label>
            <input
              type="text"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full p-2 border border-blue-300 focus:outline-none focus:ring-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Filtrar por habitación"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Método de Pago</label>
            <input
              type="text"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full p-2 border border-blue-300 focus:outline-none focus:ring-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Filtrar por método de pago"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Desde</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-full p-2 border border-blue-300 focus:outline-none focus:ring-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Hasta</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-full p-2 border border-blue-300 focus:outline-none focus:ring-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
        </div>          <div className="mt-4 flex justify-between items-center">
            <div>
              {loading ? (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  <span className="text-sm">Cargando datos...</span>
                </div>
              ) : detailsLoadingProgress < 100 && detailsLoadingProgress > 0 ? (
                <div className="flex flex-col w-56">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-blue-600">Cargando detalles...</span>
                    <span className="text-sm text-blue-600">{detailsLoadingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${detailsLoadingProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : null}
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors mr-2"
              disabled={loading}
            >
              Limpiar Filtros
            </button>
          </div>
      </div>

      {loading && !isModalOpen ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : (        <div className="bg-white p-6 md:p-8 shadow-lg rounded-lg sm:overflow-y-auto sm:max-h-96 md:overflow-visible md:max-h-full mt-4" ref={tableRef}>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-blue-300 rounded-lg overflow-hidden">
              <thead className="bg-blue-100">
                <tr>
                  <th 
                    className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900 cursor-pointer hover:bg-blue-200"
                    onClick={() => handleSort('date')}
                  >
                    Fecha {sortField === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th 
                    className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900 cursor-pointer hover:bg-blue-200"
                    onClick={() => handleSort('roomNumber')}
                  >
                    Habitación {sortField === 'roomNumber' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th 
                    className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900 cursor-pointer hover:bg-blue-200"
                    onClick={() => handleSort('paymentMethod')}
                  >
                    Método de Pago {sortField === 'paymentMethod' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th 
                    className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900 cursor-pointer hover:bg-blue-200"
                    onClick={() => handleSort('total')}
                  >
                    Total {sortField === 'total' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.length > 0 ? (
                  displayedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                        {new Date((item.date as any).seconds * 1000).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">{item.roomNumber}</td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">{item.paymentMethod}</td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">{formatCurrency(item.total)}</td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-center">
                        <button
                          onClick={() => fetchDetails(item.id)}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-3 px-4 border-b border-blue-200 text-sm text-center text-gray-500">
                      No hay registros de servicios disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div><div className="mt-4 text-right text-sm text-gray-600">
          </div>
            {/* Controles de paginación */}
          {filteredItems.length > 0 && (
            <div className="flex flex-col justify-between items-center mt-6 px-2 py-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-3 w-full text-center">
                Mostrando {displayedItems.length} de {filteredItems.length} registros
              </div>
              
              {/* Controles de navegación - rediseño para dispositivos pequeños */}
              <div className="flex flex-wrap justify-center items-center gap-2 w-full mb-3">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 rounded text-sm ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                    aria-label="Primera página"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 rounded text-sm ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 rounded text-sm ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                    aria-label="Página siguiente"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 rounded text-sm ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
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
                    updateDisplayedItems(filteredItems, 1);
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
        </div>
      )}

      {/* Modal de detalles */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl border-2 border-blue-200 w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-blue-900">Detalles del Servicio</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
              {loading && !selectedDetails ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Sección de información del servicio */}
                {selectedDetails && selectedDetails.some(detail => detail.type === 'serviceInfo') && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">Información del Servicio</h4>
                    {selectedDetails
                      .filter(detail => detail.type === 'serviceInfo')
                      .map((serviceInfo, index) => (
                        <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium text-blue-900">Hora de Ingreso:</span>
                              <span className="ml-2 text-gray-800">{serviceInfo.checkInTime || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">Hora de Salida:</span>
                              <span className="ml-2 text-gray-800">{serviceInfo.checkOutTime || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">Plan Seleccionado:</span>
                              <span className="ml-2 text-gray-800">{serviceInfo.planName || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">Tarifa:</span>
                              <span className="ml-2 text-gray-800">
                                {serviceInfo.selectedRate ? formatCurrency(serviceInfo.selectedRate.toString()) : 'N/A'}
                              </span>
                            </div>
                            {serviceInfo.additionalHourQuantity && serviceInfo.additionalHourQuantity > 0 && (
                              <>
                                <div>
                                  <span className="font-medium text-blue-900">Horas Adicionales:</span>
                                  <span className="ml-2 text-gray-800">{serviceInfo.additionalHourQuantity}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-blue-900">Costo Hora Adicional:</span>
                                  <span className="ml-2 text-gray-800">
                                    {serviceInfo.additionalHourCost ? formatCurrency(serviceInfo.additionalHourCost.toString()) : 'N/A'}
                                  </span>
                                </div>
                                <div className="md:col-span-2">
                                  <span className="font-medium text-blue-900">Total Horas Adicionales:</span>
                                  <span className="ml-2 text-gray-800 font-semibold">
                                    {serviceInfo.totalAdditionalHourCost ? formatCurrency(serviceInfo.totalAdditionalHourCost.toString()) : 'N/A'}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Sección de productos consumidos */}
                {selectedDetails && selectedDetails.some(detail => detail.type === 'product' || !detail.type) && (
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">Productos Consumidos</h4>
                    <div className="grid grid-cols-4 gap-4 mb-3 bg-blue-100 p-3 rounded-md">
                      <span className="font-bold text-blue-900 text-sm">Descripción</span>
                      <span className="font-bold text-blue-900 text-center text-sm">Cantidad</span>
                      <span className="font-bold text-blue-900 text-center text-sm">Precio Unitario</span>
                      <span className="font-bold text-blue-900 text-center text-sm">Subtotal</span>
                    </div>
                    <div className="mt-2 divide-y divide-blue-200">
                      {selectedDetails
                        .filter(detail => detail.type === 'product' || !detail.type)
                        .map((detail, index) => (
                          <div key={index} className="grid grid-cols-4 gap-4 py-3 hover:bg-blue-50 transition-colors">
                            <span className="text-gray-800 text-sm">{detail.description || 'N/A'}</span>
                            <span className="text-center text-sm text-gray-800">{detail.quantity || 0}</span>
                            <span className="text-center text-sm text-gray-800">
                              {detail.unitPrice ? formatCurrency(detail.unitPrice) : 'N/A'}
                            </span>
                            <span className="text-center font-medium text-sm text-gray-800">
                              {detail.subtotal ? formatCurrency(detail.subtotal) : 'N/A'}
                            </span>
                          </div>
                        ))}
                      {selectedDetails.filter(detail => detail.type === 'product' || !detail.type).length === 0 && (
                        <div className="py-4 text-center text-gray-500 text-sm">
                          No hay productos consumidos en este servicio
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Si no hay ningún tipo de detalle */}
                {selectedDetails && selectedDetails.length === 0 && (
                  <div className="py-4 text-center text-gray-500 text-sm">
                    No hay detalles disponibles para este servicio
                  </div>
                )}
                
                {/* Total de productos (solo si hay productos) */}
                {selectedDetails && selectedDetails.filter(detail => detail.type === 'product' || !detail.type).length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-300 flex justify-end">
                    <div className="text-right">
                      <span className="font-bold text-lg text-blue-900">Total Productos: </span>
                      <span className="font-bold text-lg">
                        {formatCurrency(
                          selectedDetails
                            .filter(detail => detail.type === 'product' || !detail.type)
                            .reduce((sum, detail) => 
                              sum + parseFloat((detail.subtotal || '0').replace(/[^\d.-]/g, '')), 0
                            ).toString()
                        )}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceHistory;
