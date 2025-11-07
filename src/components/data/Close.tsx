/**
 * Componente Close.tsx - Sistema de Cierre de Caja con Aislamiento de Datos entre Turnos
 * 
 * FUNCIONALIDAD DE AISLAMIENTO IMPLEMENTADA:
 * 
 * 1. PROBLEMA SOLUCIONADO:
 *    - Evita que los datos de ventas y gastos del mismo día se repitan entre turnos consecutivos
 *    - Ejemplo: Turno 6am-6pm y Turno 6pm-6am del mismo día no duplicarán datos
 * 
 * 2. MECANISMO DE AISLAMIENTO:
 *    - Antes de cargar ventas/gastos, consulta la colección 'close' para obtener IDs ya procesados
 *    - Filtra automáticamente los registros que ya fueron incluidos en cierres anteriores del día
 *    - Guarda los IDs de registros procesados en cada cierre para referencia futura
 * 
 * 3. CAMPOS AGREGADOS:
 *    - ventasIncluidas: Array de IDs de roomHistory procesados en este cierre
 *    - gastosIncluidos: Array de IDs de administrativeExpenses procesados en este cierre
 * 
 * 4. FLUJO DE OPERACIÓN:
 *    - Al cargar datos: Verificar qué registros ya fueron procesados → Excluir duplicados → Mostrar solo datos nuevos
 *    - Al cerrar turno: Guardar IDs de registros procesados → Permitir siguiente turno con datos limpios
 * 
 * 5. INTERFAZ DE USUARIO:
 *    - Muestra información sobre cuántos registros nuevos incluye el turno actual
 *    - Indica cuando los datos han sido aislados correctamente
 *    - Transparencia total sobre qué datos se están procesando
 */

"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/FormatCurrency";
import { collection, getDocs, query, where, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/Index";
import { toast } from "react-toastify";

interface CloseData {
    fecha: string;
    turno: string;
    empleado: string;
    ventasEfectivo: number;
    ventasTarjeta: number;
    ventasTransferencia: number;
    gastos: number;
    propinas: number;
    efectivoInicial: number;
    efectivoFinal: number;
    diferencia: number;
    observaciones: string;
    cuentasBancarias: { [accountId: string]: number };
    salesIdsIncluded?: string[]; // IDs de ventas incluidas en este turno
    expenseIdsIncluded?: string[]; // IDs de gastos incluidos en este turno
}

interface Employee {
    id: string;
    email: string;
    fullName: string;
}

interface BankAccount {
    id: string;
    accountName: string;
    initialAmount: number;
}

interface RoomHistory {
    id: string;
    total: number;
    paymentMethod: string;
    checkOutDate: any; // Timestamp de Firebase
}

const Close = () => {
    const [closeData, setCloseData] = useState<CloseData>({
        fecha: new Date().toISOString().split('T')[0],
        turno: "Turno 1",
        empleado: "",
        ventasEfectivo: 0,
        ventasTarjeta: 0,
        ventasTransferencia: 0,
        gastos: 0,
        propinas: 0,
        efectivoInicial: 0,
        efectivoFinal: 0,
        diferencia: 0,
        observaciones: "",
        cuentasBancarias: {},
        salesIdsIncluded: [],
        expenseIdsIncluded: []
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(true);
    const [isLoadingSales, setIsLoadingSales] = useState(true);
    const [turnoIniciado, setTurnoIniciado] = useState(false);
    const [saldosIniciales, setSaldosIniciales] = useState<{ [accountId: string]: number }>({});
    const [fechaInicioTurno, setFechaInicioTurno] = useState<string>('');
    const [turnoRestaurado, setTurnoRestaurado] = useState<boolean>(false);

    // Cargar estado del turno desde localStorage al montar el componente
    useEffect(() => {
        const savedTurnoState = localStorage.getItem('turnoActivo');
        if (savedTurnoState) {
            try {
                const parsedState = JSON.parse(savedTurnoState);
                setTurnoIniciado(parsedState.turnoIniciado || false);
                setSaldosIniciales(parsedState.saldosIniciales || {});
                setFechaInicioTurno(parsedState.fechaInicioTurno || '');
                
                // Restaurar también los datos del formulario relacionados con el turno
                if (parsedState.turnoIniciado && parsedState.saldosIniciales) {
                    const saldos = parsedState.saldosIniciales as { [accountId: string]: number };
                    setCloseData(prev => ({
                        ...prev,
                        cuentasBancarias: saldos,
                        efectivoInicial: Object.values(saldos).reduce((sum, amount) => sum + amount, 0)
                    }));
                }
                
                setTurnoRestaurado(true);
                console.log('Estado del turno restaurado desde localStorage:', parsedState);
            } catch (error) {
                console.error('Error al restaurar estado del turno:', error);
                localStorage.removeItem('turnoActivo');
            }
        }
    }, []);

    // Guardar estado del turno en localStorage cuando cambie
    useEffect(() => {
        const turnoState = {
            turnoIniciado,
            saldosIniciales,
            fechaInicioTurno
        };
        
        if (turnoIniciado) {
            localStorage.setItem('turnoActivo', JSON.stringify(turnoState));
            console.log('Estado del turno guardado en localStorage:', turnoState);
        } else {
            localStorage.removeItem('turnoActivo');
            console.log('Estado del turno eliminado de localStorage');
        }
    }, [turnoIniciado, saldosIniciales, fechaInicioTurno]);

    // Cargar empleados desde Firebase
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setIsLoadingEmployees(true);
                const employeeCollection = collection(db, "employee");
                const employeeSnapshot = await getDocs(employeeCollection);
                const employeeList = employeeSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    email: doc.data().email || "",
                    fullName: doc.data().fullName || "",
                })) as Employee[];

                employeeList.sort((a, b) => a.fullName.localeCompare(b.fullName));
                setEmployees(employeeList);
            } catch (error) {
                console.error("Error al cargar empleados:", error);
            } finally {
                setIsLoadingEmployees(false);
            }
        };

        fetchEmployees();
    }, []);

    // Cargar cuentas bancarias desde Firebase
    useEffect(() => {
        const fetchBankAccounts = async () => {
            try {
                setIsLoadingBankAccounts(true);
                const bankAccountCollection = collection(db, "bankAccount");
                const bankAccountSnapshot = await getDocs(bankAccountCollection);
                const bankAccountList = bankAccountSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    accountName: doc.data().accountName || "",
                    initialAmount: doc.data().initialAmount || 0,
                })) as BankAccount[];

                bankAccountList.sort((a, b) => a.accountName.localeCompare(b.accountName));
                setBankAccounts(bankAccountList);

            } catch (error) {
                console.error("Error al cargar cuentas bancarias:", error);
            } finally {
                setIsLoadingBankAccounts(false);
            }
        };

        fetchBankAccounts();
    }, []);

    // Cargar ventas del día desde roomHistory
    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                setIsLoadingSales(true);

                // Obtener rango de fechas para cubrir turno nocturno (desde ayer hasta hoy)
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
                const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

                console.log('Buscando registros entre:', startOfYesterday, 'y', endOfToday);

                // Primero, obtener los IDs de ventas ya procesadas en cierres anteriores del día
                const closesQuery = query(
                    collection(db, "close"),
                    where("fecha", "==", closeData.fecha)
                );
                const closesSnapshot = await getDocs(closesQuery);
                const processedSalesIds = new Set<string>();
                
                closesSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.ventasIncluidas && Array.isArray(data.ventasIncluidas)) {
                        data.ventasIncluidas.forEach((id: string) => processedSalesIds.add(id));
                    }
                });

                console.log('IDs de ventas ya procesadas:', Array.from(processedSalesIds));

                const roomHistoryCollection = collection(db, "roomHistory");
                const roomHistoryQuery = query(
                    roomHistoryCollection,
                    where("date", ">=", Timestamp.fromDate(startOfYesterday)),
                    where("date", "<", Timestamp.fromDate(endOfToday))
                );

                const roomHistorySnapshot = await getDocs(roomHistoryQuery);

                console.log('Registros encontrados:', roomHistorySnapshot.docs.length);

                let ventasEfectivo = 0;
                let ventasTransferencia = 0;
                const salesIdsIncluded: string[] = []; // Para rastrear qué ventas incluimos

                // Función para convertir string de moneda a número
                const parseMoneyString = (moneyStr: string): number => {
                    if (typeof moneyStr === 'number') return moneyStr;
                    if (!moneyStr) return 0;

                    // Remover símbolos de moneda, puntos y comas, mantener solo números
                    const cleaned = moneyStr.toString().replace(/[$.,]/g, '');
                    return parseFloat(cleaned) || 0;
                };

                roomHistorySnapshot.docs.forEach((doc) => {
                    // Verificar si esta venta ya fue procesada en un cierre anterior
                    if (processedSalesIds.has(doc.id)) {
                        console.log('Saltando venta ya procesada:', doc.id);
                        return;
                    }

                    const data = doc.data();
                    const totalStr = data.total || "0";
                    const total = parseMoneyString(totalStr);
                    const paymentMethod = data.paymentMethod || "";

                    console.log('Registro:', {
                        id: doc.id,
                        totalOriginal: totalStr,
                        totalConvertido: total,
                        paymentMethod,
                        date: data.date?.toDate ? data.date.toDate() : data.date
                    });

                    // Incluir en el conteo y agregar a la lista de IDs procesados
                    salesIdsIncluded.push(doc.id);
                    
                    if (paymentMethod === "Caja Principal") {
                        ventasEfectivo += total;
                        console.log('Sumando a efectivo:', total);
                    } else {
                        ventasTransferencia += total;
                        console.log('Sumando a transferencia:', total, 'método:', paymentMethod);
                    }
                });

                console.log('Totales calculados:', { ventasEfectivo, ventasTransferencia });
                console.log('IDs de ventas incluidas en este turno:', salesIdsIncluded);

                // Actualizar closeData con las ventas calculadas y los IDs procesados
                setCloseData(prev => ({
                    ...prev,
                    ventasEfectivo,
                    ventasTransferencia,
                    salesIdsIncluded // Agregar este campo para el registro
                }));

            } catch (error) {
                console.error("Error al cargar datos de ventas:", error);
            } finally {
                setIsLoadingSales(false);
            }
        };

        fetchSalesData();
    }, []);

    // Cargar gastos del día desde administrativeExpenses
    useEffect(() => {
        const fetchExpensesData = async () => {
            try {
                // Obtener rango de fechas para cubrir turno nocturno (desde ayer hasta hoy)
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
                const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

                console.log('Buscando gastos entre:', startOfYesterday, 'y', endOfToday);

                // Primero, obtener los IDs de gastos ya procesados en cierres anteriores del día
                const closesQuery = query(
                    collection(db, "close"),
                    where("fecha", "==", closeData.fecha)
                );
                const closesSnapshot = await getDocs(closesQuery);
                const processedExpenseIds = new Set<string>();
                
                closesSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.gastosIncluidos && Array.isArray(data.gastosIncluidos)) {
                        data.gastosIncluidos.forEach((id: string) => processedExpenseIds.add(id));
                    }
                });

                console.log('IDs de gastos ya procesados:', Array.from(processedExpenseIds));

                const administrativeExpensesCollection = collection(db, "administrativeExpenses");
                const expensesQuery = query(
                    administrativeExpensesCollection,
                    where("date", ">=", Timestamp.fromDate(startOfYesterday)),
                    where("date", "<", Timestamp.fromDate(endOfToday))
                );

                const expensesSnapshot = await getDocs(expensesQuery);

                console.log('Gastos encontrados:', expensesSnapshot.docs.length);

                let totalGastos = 0;
                const expenseIdsIncluded: string[] = []; // Para rastrear qué gastos incluimos

                // Función para convertir string de moneda a número
                const parseMoneyString = (moneyStr: string): number => {
                    if (typeof moneyStr === 'number') return moneyStr;
                    if (!moneyStr) return 0;

                    // Remover símbolos de moneda, puntos y comas, mantener solo números
                    const cleaned = moneyStr.toString().replace(/[$.,]/g, '');
                    return parseFloat(cleaned) || 0;
                };

                expensesSnapshot.docs.forEach((doc) => {
                    // Verificar si este gasto ya fue procesado en un cierre anterior
                    if (processedExpenseIds.has(doc.id)) {
                        console.log('Saltando gasto ya procesado:', doc.id);
                        return;
                    }

                    const data = doc.data();
                    const valueStr = data.value || "0";
                    const value = parseMoneyString(valueStr);

                    console.log('Gasto:', {
                        id: doc.id,
                        concept: data.concept,
                        bank: data.bank,
                        expenseType: data.expenseType,
                        valueOriginal: valueStr,
                        valueConvertido: value,
                        date: data.date?.toDate ? data.date.toDate() : data.date
                    });

                    // Incluir en el conteo y agregar a la lista de IDs procesados
                    expenseIdsIncluded.push(doc.id);
                    totalGastos += value;
                });

                console.log('Total gastos calculado:', totalGastos);
                console.log('IDs de gastos incluidos en este turno:', expenseIdsIncluded);

                // Actualizar closeData con los gastos calculados y los IDs procesados
                setCloseData(prev => ({
                    ...prev,
                    gastos: totalGastos,
                    expenseIdsIncluded // Agregar este campo para el registro
                }));

            } catch (error) {
                console.error("Error al cargar datos de gastos:", error);
            }
        };

        fetchExpensesData();
    }, []);

    // Calcular totales automáticamente
    const totalVentas = closeData.ventasEfectivo + closeData.ventasTarjeta + closeData.ventasTransferencia;
    const totalSaldoActual = turnoIniciado ? Object.values(saldosIniciales).reduce((sum, amount) => sum + amount, 0) : 0;
    // Cálculo del total: Total Inicial + Total Ventas - Total Gastos
    const totalCalculado = turnoIniciado ? (totalSaldoActual + totalVentas - closeData.gastos) : 0;
    const diferencia = closeData.efectivoFinal - totalCalculado;

    const handleIniciarTurno = () => {
        if (bankAccounts.length === 0) {
            toast.error('No hay cuentas bancarias disponibles');
            return;
        }

        // Capturar los saldos actuales como saldos iniciales del turno
        const saldosCapturados: { [key: string]: number } = {};
        bankAccounts.forEach(account => {
            saldosCapturados[account.id] = account.initialAmount;
        });

        setSaldosIniciales(saldosCapturados);
        setCloseData(prev => ({
            ...prev,
            cuentasBancarias: saldosCapturados,
            efectivoInicial: bankAccounts.reduce((sum, account) => sum + account.initialAmount, 0)
        }));

        setTurnoIniciado(true);
        setFechaInicioTurno(`${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`);
        toast.success('Turno iniciado. Los saldos han sido capturados.');
    };

    const handleFinalizarTurno = () => {
        // Resetear todo al estado inicial
        setTurnoIniciado(false);
        setSaldosIniciales({});
        setFechaInicioTurno('');
        setTurnoRestaurado(false);
        setCloseData({
            fecha: new Date().toISOString().split('T')[0],
            turno: 'Turno 1',
            empleado: '',
            ventasEfectivo: 0,
            ventasTarjeta: 0,
            ventasTransferencia: 0,
            gastos: 0,
            propinas: 0,
            efectivoInicial: 0,
            efectivoFinal: 0,
            diferencia: 0,
            observaciones: '',
            cuentasBancarias: {},
            salesIdsIncluded: [],
            expenseIdsIncluded: []
        });
        
        // Limpiar localStorage
        localStorage.removeItem('turnoActivo');
        console.log('Turno finalizado y localStorage limpiado');
        
        toast.success('Turno finalizado. El sistema está listo para un nuevo turno.');
    };

    const handleInputChange = (field: keyof CloseData, value: string | number) => {
        setCloseData(prev => ({
            ...prev,
            [field]: value,
            ...(field === 'efectivoFinal' && {
                diferencia: Number(value) - totalCalculado
            })
        }));
    };

    const handleSubmit = async () => {
        if (!turnoIniciado) {
            toast.error('Debe iniciar un turno antes de procesar el cierre.');
            return;
        }

        if (!closeData.empleado) {
            toast.error('Debe seleccionar un empleado responsable.');
            return;
        }

        setIsProcessing(true);

        try {
            // Crear el registro de cierre en Firebase
            const closeRecord = {
                fecha: closeData.fecha,
                turno: closeData.turno,
                empleadoResponsable: closeData.empleado,
                totalInicial: totalSaldoActual,
                totalVentas: totalVentas,
                totalGastos: closeData.gastos,
                totalGeneral: totalCalculado, // Total Inicial + Ventas - Gastos
                fechaCreacion: serverTimestamp(),
                saldosIniciales: saldosIniciales,
                ventasEfectivo: closeData.ventasEfectivo,
                ventasTarjeta: closeData.ventasTarjeta,
                ventasTransferencia: closeData.ventasTransferencia,
                // Agregar los IDs de los registros procesados para evitar duplicación
                ventasIncluidas: closeData.salesIdsIncluded || [],
                gastosIncluidos: closeData.expenseIdsIncluded || []
            };

            await addDoc(collection(db, 'close'), closeRecord);
            
            console.log('Cierre registrado exitosamente:', closeRecord);
            toast.success('Cierre de caja procesado y registrado correctamente en la base de datos.');
            
            // Finalizar turno automáticamente después del cierre exitoso
            handleFinalizarTurno();
        } catch (error) {
            console.error('Error al registrar el cierre:', error);
            toast.error('Hubo un error al procesar el cierre. Inténtelo nuevamente.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-blue-800 flex items-center">
                        <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Cierre de Caja
                    </h1>
                    <p className="text-gray-600 mt-2">Registro y control del cierre diario de operaciones</p>
                </div>

                {/* Estado del Turno */}
                {!turnoIniciado && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-center">
                            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                                ⚠️ Turno no iniciado
                            </h2>
                            <p className="text-yellow-700 mb-4">
                                Debe iniciar el turno para capturar los saldos iniciales y comenzar el registro de operaciones
                            </p>
                            <button
                                onClick={handleIniciarTurno}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                🚀 Iniciar Turno
                            </button>
                        </div>
                    </div>
                )}

                {turnoIniciado && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-semibold text-green-800 mb-2">
                                ✅ Turno Activo
                            </h2>
                            <p className="text-green-700">
                                Saldos iniciales capturados - Turno iniciado el {fechaInicioTurno}
                                {turnoRestaurado && (
                                    <span className="block text-xs text-green-600 mt-1">
                                        🔄 Turno restaurado automáticamente
                                    </span>
                                )}
                            </p>
                        </div>
                        
                        {/* Mostrar saldos capturados */}
                        <div className="bg-white p-4 rounded-lg border border-green-300">
                            <h3 className="text-md font-semibold text-green-800 mb-3 text-center">
                                💰 Saldos Iniciales Capturados (Fijos)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.keys(saldosIniciales).length > 0 ? (
                                    Object.entries(saldosIniciales).map(([accountId, amount]) => {
                                        const account = bankAccounts.find(acc => acc.id === accountId);
                                        return (
                                            <div key={accountId} className="flex justify-between items-center p-2 bg-green-50 rounded border">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {account?.accountName || `Cuenta ${accountId}`}:
                                                </span>
                                                <span className="text-sm font-bold text-green-800">
                                                    {formatCurrency(amount)}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-2 text-center text-gray-500 text-sm">
                                        No hay saldos capturados
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-green-200 mt-3 pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-md font-bold text-green-800">Total Inicial:</span>
                                    <span className="text-md font-bold text-green-800">
                                        {formatCurrency(totalSaldoActual)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!turnoIniciado && (
                    <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                        <p className="text-gray-600 text-center text-sm">
                            📋 El formulario estará disponible después de iniciar el turno
                        </p>
                    </div>
                )}

                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${!turnoIniciado ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Información General */}
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h2 className="text-lg font-semibold text-blue-800 mb-4">Información General</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha
                                    </label>
                                    <input
                                        type="date"
                                        value={closeData.fecha}
                                        onChange={(e) => handleInputChange('fecha', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Turno
                                    </label>
                                    <select
                                        value={closeData.turno}
                                        onChange={(e) => handleInputChange('turno', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Turno 1">Turno 1</option>
                                        <option value="Turno 2">Turno 2</option>
                                        <option value="Turno 3">Turno 3</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Empleado Responsable
                                </label>
                                {isLoadingEmployees ? (
                                    <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-gray-500">Cargando empleados...</span>
                                    </div>
                                ) : employees.length === 0 ? (
                                    <div className="w-full p-3 border border-gray-300 rounded-md bg-red-50 text-red-600">
                                        No hay empleados registrados
                                    </div>
                                ) : (
                                    <select
                                        value={closeData.empleado}
                                        onChange={(e) => handleInputChange('empleado', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccione un empleado</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.email}>
                                                {employee.fullName} ({employee.email})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Ventas */}
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h2 className="text-lg font-semibold text-green-800 mb-4">
                                Ventas del Día
                                {isLoadingSales && (
                                    <svg className="animate-spin ml-2 h-4 w-4 text-green-600 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ventas en Efectivo (Caja Principal)
                                    </label>
                                    <input
                                        type="text"
                                        value={formatCurrency(closeData.ventasEfectivo)}
                                        readOnly
                                        className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Transferencias/Otros
                                    </label>
                                    <input
                                        type="text"
                                        value={formatCurrency(closeData.ventasTransferencia)}
                                        readOnly
                                        className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                                    />
                                </div>

                                {/* Información de aislamiento de datos */}
                                {turnoIniciado && (closeData.salesIdsIncluded && closeData.salesIdsIncluded.length > 0) && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <h4 className="text-sm font-medium text-blue-800 mb-2">
                                            🔒 Aislamiento de Datos del Turno
                                        </h4>
                                        <p className="text-xs text-blue-600">
                                            Este turno incluye {closeData.salesIdsIncluded.length} venta(s) nueva(s) 
                                            que no fueron procesadas en turnos anteriores del día.
                                        </p>
                                        <p className="text-xs text-blue-500 mt-1">
                                            Los datos ya procesados en cierres anteriores han sido excluidos automáticamente.
                                        </p>
                                    </div>
                                )}

                                <div className="border-t pt-3">
                                    <div className="flex justify-between items-center text-lg font-semibold text-green-800">
                                        <span>Total Ventas:</span>
                                        <span>{formatCurrency(totalVentas)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Control de Cajas y Cuentas */}
                    <div className="space-y-6">
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h2 className="text-lg font-semibold text-yellow-800 mb-4">Control de Cajas y Cuentas</h2>

                            <div className="space-y-4">
                                {/* Cuentas Bancarias */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Saldos
                                    </label>
                                    {isLoadingBankAccounts ? (
                                        <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-gray-500">Cargando cuentas bancarias...</span>
                                        </div>
                                    ) : bankAccounts.length === 0 ? (
                                        <div className="w-full p-3 border border-gray-300 rounded-md bg-red-50 text-red-600">
                                            No hay cuentas bancarias registradas
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {bankAccounts.map((account) => (
                                                <div key={account.id} className="p-3 bg-white border border-gray-200 rounded-md">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        {account.accountName}
                                                    </label>
                                                    <span className="text-xs text-gray-500">
                                                        Saldo Actual: {formatCurrency(account.initialAmount)}
                                                    </span>
                                                    {turnoIniciado && saldosIniciales[account.id] !== undefined && (
                                                        <span className="block text-xs text-green-600 font-medium mt-1">
                                                            Saldo Capturado: {formatCurrency(saldosIniciales[account.id])} (Fijo)
                                                        </span>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Total de saldo actual */}
                                            <div className="border-t pt-3 mt-3">
                                                <div className="flex justify-between items-center text-sm font-medium text-yellow-800">
                                                    <span>Total Saldo Actual:</span>
                                                    <span>{formatCurrency(bankAccounts.reduce((sum, account) => sum + account.initialAmount, 0))}</span>
                                                </div>
                                                {turnoIniciado && (
                                                    <div className="flex justify-between items-center text-sm font-medium text-green-700 mt-1">
                                                        <span>Total Capturado (Fijo):</span>
                                                        <span>{formatCurrency(totalSaldoActual)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Gastos del Día
                                    </label>
                                    <input
                                        type="text"
                                        value={formatCurrency(closeData.gastos)}
                                        readOnly
                                        className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                                    />
                                </div>

                                {/* Información de aislamiento de gastos */}
                                {turnoIniciado && (closeData.expenseIdsIncluded && closeData.expenseIdsIncluded.length > 0) && (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                                            🔒 Gastos Aislados del Turno
                                        </h4>
                                        <p className="text-xs text-yellow-600">
                                            Este turno incluye {closeData.expenseIdsIncluded.length} gasto(s) nuevo(s) 
                                            que no fueron procesados en turnos anteriores del día.
                                        </p>
                                        <p className="text-xs text-yellow-500 mt-1">
                                            Los gastos ya procesados en cierres anteriores han sido excluidos automáticamente.
                                        </p>
                                    </div>
                                )}

                                <div className="border-t pt-3">
                                </div>
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Ventas:</span>
                                    <span className="font-semibold">{formatCurrency(totalVentas)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Gastos:</span>
                                    <span className="font-semibold">{formatCurrency(closeData.gastos)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Inicial:</span>
                                    <span className="font-semibold">{formatCurrency(totalSaldoActual)}</span>
                                </div>

                                <div className="border-t pt-3">
                                    <div className={`flex justify-between items-center text-lg font-bold ${diferencia === 0 ? 'text-green-600' : diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                                        }`}>
                                        <span>Total:</span>
                                        <span>
                                            {formatCurrency(totalCalculado)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Total Inicial + Ventas - Gastos
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botones de Acción */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
                    <button
                        type="button"
                        disabled={isProcessing || !turnoIniciado}
                        onClick={handleSubmit}
                        className={`px-6 py-3 rounded-md text-white font-semibold transition-colors ${
                            isProcessing || !turnoIniciado
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isProcessing ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando...
                            </span>
                        ) : !turnoIniciado ? (
                            '🔒 Procesar Cierre (Debe iniciar turno)'
                        ) : (
                            '✅ Procesar Cierre de Caja'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Close;