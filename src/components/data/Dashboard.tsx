'use client';

import React, { useState, useMemo, useEffect } from "react";
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
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/Index";
import { formatCurrency } from "@/utils/FormatCurrency";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const Dashboard = () => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [serviciosTotal, setServiciosTotal] = useState<number>(0);
  const [gastosTotal, setGastosTotal] = useState<number>(0);
  const [comprasTotal, setComprasTotal] = useState<number>(0);
  const [productosVendidos, setProductosVendidos] = useState<{labels: string[], data: number[]}>({
    labels: [],
    data: []
  });  const [productosPocoVendidos, setProductosPocoVendidos] = useState<{labels: string[], data: number[]}>({
    labels: [],
    data: []
  });
  const [piezasMasUsadas, setPiezasMasUsadas] = useState<{labels: string[], data: number[]}>({
    labels: [],
    data: []
  });
  const [piezasMenosUsadas, setPiezasMenosUsadas] = useState<{labels: string[], data: number[]}>({
    labels: [],
    data: []
  });
  const [loading, setLoading] = useState<boolean>(false);// Función para obtener datos de servicios desde Firebase
  const fetchServiciosData = async (isCurrentMonth: boolean = false) => {
    setLoading(true);
    try {
      let startDate: Date, endDate: Date;

      if (isCurrentMonth || (!selectedDay || !selectedMonth || !selectedYear)) {
        // Obtener datos del mes actual (junio 2025)
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        console.log('Consultando mes actual:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          month: now.getMonth() + 1,
          year: now.getFullYear()
        });
      } else {
        // Obtener datos de la fecha específica seleccionada
        const selectedDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, parseInt(selectedDay));
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        console.log('Consultando fecha específica:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }

      // Consulta a Firebase
      const roomHistoryRef = collection(db, 'roomHistory');
      const q = query(
        roomHistoryRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );

      const querySnapshot = await getDocs(q);
      let totalServicios = 0;
      let documentCount = 0;

      console.log('Documentos encontrados:', querySnapshot.size);      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documentCount++;
        console.log(`Documento ${documentCount}:`, {
          id: doc.id,
          date: data.date?.toDate?.() || data.date,
          total: data.total,
          dataKeys: Object.keys(data)
        });
        
        if (data.total) {
          if (typeof data.total === 'number') {
            totalServicios += data.total;
          } else if (typeof data.total === 'string') {
            // Limpiar el string: quitar $, espacios, y convertir puntos de miles
            const cleanTotal = data.total.replace(/[$\s]/g, '').replace(/\./g, '');
            const numericTotal = parseFloat(cleanTotal);
            console.log(`Convirtiendo total: "${data.total}" -> "${cleanTotal}" -> ${numericTotal}`);
            
            if (!isNaN(numericTotal)) {
              totalServicios += numericTotal;
            }
          }
        }
      });

      console.log('Total calculado:', totalServicios);
      setServiciosTotal(totalServicios);
    } catch (error) {
      console.error('Error fetching servicios data:', error);
      setServiciosTotal(0);
    } finally {
      setLoading(false);
    }
  };
  // Función para obtener datos de gastos administrativos y de aseo desde Firebase
  const fetchGastosData = async (isCurrentMonth: boolean = false) => {
    setLoading(true);
    try {
      let startDate: Date, endDate: Date;

      if (isCurrentMonth || (!selectedDay || !selectedMonth || !selectedYear)) {
        // Obtener datos del mes actual (junio 2025)
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        console.log('Consultando gastos combinados del mes actual:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          month: now.getMonth() + 1,
          year: now.getFullYear()
        });
      } else {
        // Obtener datos de la fecha específica seleccionada
        const selectedDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, parseInt(selectedDay));
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        console.log('Consultando gastos combinados de fecha específica:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }

      // Consulta a Firebase para gastos administrativos
      const administrativeExpensesRef = collection(db, 'administrativeExpenses');
      const q1 = query(
        administrativeExpensesRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );

      // Consulta a Firebase para gastos de aseo
      const toiletriesPurchaseRef = collection(db, 'toiletriesPurchase');
      const q2 = query(
        toiletriesPurchaseRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );

      // Ejecutar ambas consultas en paralelo
      const [adminSnapshot, aseoSnapshot] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      let totalGastos = 0;
      let documentCount = 0;

      console.log('Documentos administrativos encontrados:', adminSnapshot.size);
      console.log('Documentos de aseo encontrados:', aseoSnapshot.size);

      // Procesar gastos administrativos
      adminSnapshot.forEach((doc) => {
        const data = doc.data();
        documentCount++;
        console.log(`Documento admin ${documentCount}:`, {
          id: doc.id,
          date: data.date?.toDate?.() || data.date,
          value: data.value,
          dataKeys: Object.keys(data)
        });
        
        if (data.value) {
          if (typeof data.value === 'number') {
            totalGastos += data.value;
          } else if (typeof data.value === 'string') {
            // Limpiar el string: quitar $, espacios, y convertir puntos de miles
            const cleanValue = data.value.replace(/[$\s]/g, '').replace(/\./g, '');
            const numericValue = parseFloat(cleanValue);
            console.log(`Convirtiendo valor admin: "${data.value}" -> "${cleanValue}" -> ${numericValue}`);
            
            if (!isNaN(numericValue)) {
              totalGastos += numericValue;
            }
          }
        }
      });

      // Procesar gastos de aseo
      aseoSnapshot.forEach((doc) => {
        const data = doc.data();
        documentCount++;
        console.log(`Documento aseo ${documentCount}:`, {
          id: doc.id,
          date: data.date?.toDate?.() || data.date,
          total: data.total,
          dataKeys: Object.keys(data)
        });
        
        if (data.total) {
          if (typeof data.total === 'number') {
            totalGastos += data.total;
          } else if (typeof data.total === 'string') {
            // Limpiar el string: quitar $, espacios, y convertir puntos de miles
            const cleanTotal = data.total.replace(/[$\s]/g, '').replace(/\./g, '');
            const numericTotal = parseFloat(cleanTotal);
            console.log(`Convirtiendo total aseo: "${data.total}" -> "${cleanTotal}" -> ${numericTotal}`);
            
            if (!isNaN(numericTotal)) {
              totalGastos += numericTotal;
            }
          }
        }
      });

      console.log('Total gastos combinados calculado:', totalGastos);
      setGastosTotal(totalGastos);
    } catch (error) {
      console.error('Error fetching gastos combinados data:', error);
      setGastosTotal(0);
    } finally {      setLoading(false);
    }
  };

  // Función para obtener datos de compras desde Firebase (toiletriesPurchase + miniBarPurchases)
  const fetchComprasData = async (isCurrentMonth: boolean = false) => {
    setLoading(true);
    try {
      let startDate: Date, endDate: Date;

      if (isCurrentMonth || (!selectedDay || !selectedMonth || !selectedYear)) {
        // Obtener datos del mes actual (junio 2025)
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        console.log('Consultando compras del mes actual:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          month: now.getMonth() + 1,
          year: now.getFullYear()
        });
      } else {
        // Obtener datos de la fecha específica seleccionada
        const selectedDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, parseInt(selectedDay));
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        console.log('Consultando compras de fecha específica:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }

      // Consulta a Firebase para compras de aseo
      const toiletriesPurchaseRef = collection(db, 'toiletriesPurchase');
      const q1 = query(
        toiletriesPurchaseRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );

      // Consulta a Firebase para compras de minibar
      const miniBarPurchasesRef = collection(db, 'miniBarPurchases');
      const q2 = query(
        miniBarPurchasesRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );

      // Ejecutar ambas consultas en paralelo
      const [aseoSnapshot, minibarSnapshot] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      let totalCompras = 0;
      let documentCount = 0;

      console.log('Documentos de compras aseo encontrados:', aseoSnapshot.size);
      console.log('Documentos de compras minibar encontrados:', minibarSnapshot.size);

      // Procesar compras de aseo
      aseoSnapshot.forEach((doc) => {
        const data = doc.data();
        documentCount++;
        console.log(`Documento compra aseo ${documentCount}:`, {
          id: doc.id,
          date: data.date?.toDate?.() || data.date,
          total: data.total,
          dataKeys: Object.keys(data)
        });
        
        if (data.total) {
          if (typeof data.total === 'number') {
            totalCompras += data.total;
          } else if (typeof data.total === 'string') {
            // Limpiar el string: quitar $, espacios, y convertir puntos de miles
            const cleanTotal = data.total.replace(/[$\s]/g, '').replace(/\./g, '');
            const numericTotal = parseFloat(cleanTotal);
            console.log(`Convirtiendo total compra aseo: "${data.total}" -> "${cleanTotal}" -> ${numericTotal}`);
            
            if (!isNaN(numericTotal)) {
              totalCompras += numericTotal;
            }
          }
        }
      });

      // Procesar compras de minibar
      minibarSnapshot.forEach((doc) => {
        const data = doc.data();
        documentCount++;
        console.log(`Documento compra minibar ${documentCount}:`, {
          id: doc.id,
          date: data.date?.toDate?.() || data.date,
          total: data.total,
          dataKeys: Object.keys(data)
        });
        
        if (data.total) {
          if (typeof data.total === 'number') {
            totalCompras += data.total;
          } else if (typeof data.total === 'string') {
            // Limpiar el string: quitar $, espacios, y convertir puntos de miles
            const cleanTotal = data.total.replace(/[$\s]/g, '').replace(/\./g, '');
            const numericTotal = parseFloat(cleanTotal);
            console.log(`Convirtiendo total compra minibar: "${data.total}" -> "${cleanTotal}" -> ${numericTotal}`);
            
            if (!isNaN(numericTotal)) {
              totalCompras += numericTotal;
            }
          }
        }
      });

      console.log('Total compras combinadas calculado:', totalCompras);
      setComprasTotal(totalCompras);
    } catch (error) {
      console.error('Error fetching compras combinadas data:', error);
      setComprasTotal(0);
    } finally {
      setLoading(false);
    }
  };  // Función para obtener productos más y menos vendidos desde Firebase (todos los tiempos)
  const fetchProductosVendidos = async () => {
    setLoading(true);
    try {
      console.log('Consultando productos vendidos de todos los tiempos');

      // Consultar TODOS los documentos de roomHistory (sin filtro de fecha)
      const roomHistoryRef = collection(db, 'roomHistory');
      const roomHistorySnapshot = await getDocs(roomHistoryRef);
      
      console.log('Documentos de roomHistory encontrados (todos los tiempos):', roomHistorySnapshot.size);

      // Objeto para acumular cantidades por producto
      const productosMap: { [key: string]: number } = {};

      // Procesar cada documento de roomHistory
      for (const roomDoc of roomHistorySnapshot.docs) {
        const roomData = roomDoc.data();
        console.log(`Procesando documento roomHistory: ${roomDoc.id}`);

        // Consultar la subcolección 'details' de este documento
        const detailsRef = collection(db, 'roomHistory', roomDoc.id, 'details');
        const detailsSnapshot = await getDocs(detailsRef);
        
        console.log(`Documentos en details de ${roomDoc.id}:`, detailsSnapshot.size);

        // Procesar cada documento de la subcolección details
        detailsSnapshot.forEach((detailDoc) => {
          const detailData = detailDoc.data();
          console.log(`Detalle:`, {
            id: detailDoc.id,
            description: detailData.description,
            quantity: detailData.quantity,
            dataKeys: Object.keys(detailData)
          });

          if (detailData.description && detailData.quantity) {
            const description = detailData.description.toString().trim();
            let quantity = 0;

            // Convertir quantity a número
            if (typeof detailData.quantity === 'number') {
              quantity = detailData.quantity;
            } else if (typeof detailData.quantity === 'string') {
              quantity = parseInt(detailData.quantity) || 0;
            }

            if (quantity > 0 && description.length > 0) {
              // Acumular la cantidad para este producto
              productosMap[description] = (productosMap[description] || 0) + quantity;
            }
          }
        });
      }

      console.log('Productos encontrados (todos los tiempos):', productosMap);

      // Convertir a array y ordenar por cantidad
      const productosArray = Object.entries(productosMap).map(([description, quantity]) => ({
        description,
        quantity
      }));

      // Ordenar por cantidad descendente
      productosArray.sort((a, b) => b.quantity - a.quantity);

      console.log('Productos ordenados (todos los tiempos):', productosArray);

      // Obtener los 5 más vendidos
      const top5MasVendidos = productosArray.slice(0, 5);
      const masVendidosLabels = top5MasVendidos.map(p => p.description);
      const masVendidosData = top5MasVendidos.map(p => p.quantity);

      // Obtener los 5 menos vendidos (últimos 5, pero con cantidad > 0)
      const menosVendidos = productosArray.filter(p => p.quantity > 0).slice(-5).reverse();
      const menosVendidosLabels = menosVendidos.map(p => p.description);
      const menosVendidosData = menosVendidos.map(p => p.quantity);

      console.log('Top 5 más vendidos (todos los tiempos):', { labels: masVendidosLabels, data: masVendidosData });
      console.log('Top 5 menos vendidos (todos los tiempos):', { labels: menosVendidosLabels, data: menosVendidosData });

      setProductosVendidos({ labels: masVendidosLabels, data: masVendidosData });
      setProductosPocoVendidos({ labels: menosVendidosLabels, data: menosVendidosData });

    } catch (error) {
      console.error('Error fetching productos vendidos:', error);
      setProductosVendidos({ labels: [], data: [] });
      setProductosPocoVendidos({ labels: [], data: [] });
    } finally {
      setLoading(false);
    }
  };
  // Función para obtener piezas (habitaciones) más y menos usadas desde Firebase (todos los tiempos)
  const fetchPiezasUsadas = async () => {
    setLoading(true);
    try {
      console.log('Consultando piezas usadas de todos los tiempos');

      // Consultar TODOS los documentos de roomHistory (sin filtro de fecha)
      const roomHistoryRef = collection(db, 'roomHistory');
      const roomHistorySnapshot = await getDocs(roomHistoryRef);
      
      console.log('Documentos de roomHistory encontrados para piezas:', roomHistorySnapshot.size);

      // Objeto para acumular usos por habitación
      const piezasMap: { [key: string]: number } = {};

      // Procesar cada documento de roomHistory
      roomHistorySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Procesando documento para piezas:`, {
          id: doc.id,
          roomNumber: data.roomNumber,
          date: data.date?.toDate?.() || data.date,
          dataKeys: Object.keys(data)
        });

        if (data.roomNumber) {
          const roomNumber = data.roomNumber.toString().trim();
          
          if (roomNumber.length > 0) {
            // Incrementar el contador de uso para esta habitación
            piezasMap[roomNumber] = (piezasMap[roomNumber] || 0) + 1;
          }
        }
      });

      console.log('Piezas encontradas (todos los tiempos):', piezasMap);

      // Convertir a array y ordenar por cantidad de usos
      const piezasArray = Object.entries(piezasMap).map(([roomNumber, usos]) => ({
        roomNumber,
        usos
      }));

      // Ordenar por usos descendente
      piezasArray.sort((a, b) => b.usos - a.usos);

      console.log('Piezas ordenadas por uso (todos los tiempos):', piezasArray);

      // Obtener las 5 más usadas
      const top5MasUsadas = piezasArray.slice(0, 5);
      const masUsadasLabels = top5MasUsadas.map(p => `Habitación ${p.roomNumber}`);
      const masUsadasData = top5MasUsadas.map(p => p.usos);

      // Obtener las 5 menos usadas (últimas 5, pero con usos > 0)
      const menosUsadas = piezasArray.filter(p => p.usos > 0).slice(-5).reverse();
      const menosUsadasLabels = menosUsadas.map(p => `Habitación ${p.roomNumber}`);
      const menosUsadasData = menosUsadas.map(p => p.usos);

      console.log('Top 5 piezas más usadas (todos los tiempos):', { labels: masUsadasLabels, data: masUsadasData });
      console.log('Top 5 piezas menos usadas (todos los tiempos):', { labels: menosUsadasLabels, data: menosUsadasData });

      setPiezasMasUsadas({ labels: masUsadasLabels, data: masUsadasData });
      setPiezasMenosUsadas({ labels: menosUsadasLabels, data: menosUsadasData });

    } catch (error) {
      console.error('Error fetching piezas usadas:', error);
      setPiezasMasUsadas({ labels: [], data: [] });
      setPiezasMenosUsadas({ labels: [], data: [] });
    } finally {
      setLoading(false);
    }
  };
  // Efecto para cargar datos cuando cambian los filtros (solo cards, no gráficos)
  useEffect(() => {
    fetchServiciosData();
    fetchGastosData();
    fetchComprasData();
  }, [selectedDay, selectedMonth, selectedYear]);
  
  // Efecto para cargar datos del mes actual al montar el componente
  useEffect(() => {
    fetchServiciosData(true);
    fetchGastosData(true);
    fetchComprasData(true);
  }, []);

  // Efecto para cargar gráficos una sola vez (todos los tiempos)
  useEffect(() => {
    fetchProductosVendidos();
    fetchPiezasUsadas();
  }, []);

  // Datos de ejemplo para diferentes fechas
  const mockData = {
    '2025-1-15': {
      servicios: 12000,
      gastos: 4500,
      inventarios: 8500,
      compras: 9200,
      productosVendidos: [320, 180, 120],
      productosPocoVendidos: [45, 35, 25],
      piezasUsadas: [450, 280, 180],
      piezasPocoUsadas: [8, 12, 5]
    },
    '2025-2-10': {
      servicios: 8500,
      gastos: 6200,
      inventarios: 6800,
      compras: 7500,
      productosVendidos: [280, 220, 95],
      productosPocoVendidos: [60, 25, 15],
      piezasUsadas: [380, 320, 220],
      piezasPocoUsadas: [15, 3, 8]
    },
    '2025-3-5': {
      servicios: 15000,
      gastos: 3800,
      inventarios: 9200,
      compras: 10500,
      productosVendidos: [350, 250, 140],
      productosPocoVendidos: [40, 28, 32],
      piezasUsadas: [500, 350, 280],
      piezasPocoUsadas: [5, 8, 12]
    },
    'default': {
      servicios: 10000,
      gastos: 5000,
      inventarios: 7000,
      compras: 8000,
      productosVendidos: [300, 200, 100],
      productosPocoVendidos: [50, 30, 20],
      piezasUsadas: [400, 300, 200],
      piezasPocoUsadas: [10, 5, 2]
    }
  };

  // Generar opciones para los selects
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: 1, name: 'Enero' },
    { value: 2, name: 'Febrero' },
    { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Mayo' },
    { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' },
    { value: 11, name: 'Noviembre' },
    { value: 12, name: 'Diciembre' }
  ];
  const years = Array.from({ length: 10 }, (_, i) => 2025 + i);

  // Obtener datos filtrados
  const filteredData = useMemo(() => {
    if (selectedDay && selectedMonth && selectedYear) {
      const key = `${selectedYear}-${selectedMonth}-${selectedDay}`;
      return mockData[key as keyof typeof mockData] || mockData.default;
    }
    return mockData.default;
  }, [selectedDay, selectedMonth, selectedYear]);  const resetFilters = () => {
    setSelectedDay('');
    setSelectedMonth('');
    setSelectedYear('');
    // Cargar datos del mes actual (solo cards, no gráficos)
    fetchServiciosData(true);
    fetchGastosData(true);
    fetchComprasData(true);
  };

  const showCurrentMonth = () => {
    setSelectedDay('');
    setSelectedMonth('');
    setSelectedYear('');
    // Cargar datos del mes actual (solo cards, no gráficos)
    fetchServiciosData(true);
    fetchGastosData(true);
    fetchComprasData(true);
  };const salesData = {
    labels: productosVendidos.labels.length > 0 ? productosVendidos.labels : ["Sin datos"],
    datasets: [
      {
        label: "Productos más vendidos",
        data: productosVendidos.data.length > 0 ? productosVendidos.data : [0],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };

  const leastSalesData = {
    labels: productosPocoVendidos.labels.length > 0 ? productosPocoVendidos.labels : ["Sin datos"],
    datasets: [
      {
        label: "Productos menos vendidos",
        data: productosPocoVendidos.data.length > 0 ? productosPocoVendidos.data : [0],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };  // Opciones para los gráficos de dona
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.2,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 15,
          font: {
            size: 12
          }
        }
      }
    }
  };

  // Opciones para los gráficos de barras
  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };
  const mostUsedPartsData = {
    labels: piezasMasUsadas.labels.length > 0 ? piezasMasUsadas.labels : ["Sin datos"],
    datasets: [
      {
        label: "Piezas más usadas",
        data: piezasMasUsadas.data.length > 0 ? piezasMasUsadas.data : [0],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };

  const leastUsedPartsData = {
    labels: piezasMenosUsadas.labels.length > 0 ? piezasMenosUsadas.labels : ["Sin datos"],
    datasets: [
      {
        label: "Piezas menos usadas",
        data: piezasMenosUsadas.data.length > 0 ? piezasMenosUsadas.data : [0],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-900 mt-12 bg-gradient-to-b from-indigo-100 to-indigo-200">Dashboard</h1>
        {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-bold text-blue-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Día</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar día</option>
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Mes</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar mes</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar año</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={showCurrentMonth}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Mes actual
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-green-100 p-3 sm:p-4 rounded-lg shadow-md text-center">
          <h2 className="text-lg sm:text-xl font-bold text-green-900">Servicios</h2>
          <p className="text-xs text-green-600 mb-1">
            {selectedDay && selectedMonth && selectedYear 
              ? `${selectedDay}/${selectedMonth}/${selectedYear}`
              : 'Mes actual'
            }
          </p>
          {loading ? (
            <p className="text-xl sm:text-2xl font-semibold text-green-700">Cargando...</p>
          ) : (
            <p className="text-xl sm:text-2xl font-semibold text-green-700">
              {formatCurrency(serviciosTotal)}
            </p>
          )}
        </div>
        <div className="bg-red-100 p-3 sm:p-4 rounded-lg shadow-md text-center">
          <h2 className="text-lg sm:text-xl font-bold text-red-900">Gastos</h2>
          <p className="text-xs text-red-600 mb-1">
            {selectedDay && selectedMonth && selectedYear 
              ? `${selectedDay}/${selectedMonth}/${selectedYear}`
              : 'Mes actual'
            }
          </p>
          <p className="text-xs text-red-500 mb-1">Administrativos + Aseo</p>
          {loading ? (
            <p className="text-xl sm:text-2xl font-semibold text-red-700">Cargando...</p>
          ) : (
            <p className="text-xl sm:text-2xl font-semibold text-red-700">
              {formatCurrency(gastosTotal)}
            </p>
          )}
        </div>        <div className="bg-yellow-100 p-3 sm:p-4 rounded-lg shadow-md text-center">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-900">Compras</h2>
          <p className="text-xs text-yellow-600 mb-1">
            {selectedDay && selectedMonth && selectedYear 
              ? `${selectedDay}/${selectedMonth}/${selectedYear}`
              : 'Mes actual'
            }
          </p>
          <p className="text-xs text-yellow-700 mb-1">Aseo + Minibar</p>
          {loading ? (
            <p className="text-xl sm:text-2xl font-semibold text-yellow-700">Cargando...</p>
          ) : (
            <p className="text-xl sm:text-2xl font-semibold text-yellow-700">
              {formatCurrency(comprasTotal)}
            </p>
          )}
        </div>
      </div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Productos más vendidos</h3>
          <p className="text-xs text-gray-500 mb-3">Datos de todos los tiempos</p>
          <div className="max-w-sm mx-auto">
            <Doughnut data={salesData} options={doughnutOptions} />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Productos menos vendidos</h3>
          <p className="text-xs text-gray-500 mb-3">Datos de todos los tiempos</p>
          <div className="max-w-sm mx-auto">
            <Doughnut data={leastSalesData} options={doughnutOptions} />
          </div>
        </div><div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Piezas más usadas</h3>
          <p className="text-xs text-gray-500 mb-3">Datos de todos los tiempos</p>
          <Bar data={mostUsedPartsData} options={barOptions} />
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Piezas menos usadas</h3>
          <p className="text-xs text-gray-500 mb-3">Datos de todos los tiempos</p>
          <Bar data={leastUsedPartsData} options={barOptions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
