"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/Index";
import { formatCurrency } from "@/utils/FormatCurrency";

interface CloseRecord {
    id: string;
    empleadoResponsable: string;
    fecha: string;
    fechaCreacion: Timestamp;
    gastosIncluidos: string[];
    saldosIniciales: { [key: string]: number };
    totalGastos: number;
    totalGeneral: number;
    totalInicial: number;
    totalVentas: number;
    turno: string;
    ventasEfectivo: number;
    ventasIncluidas: string[];
    ventasTransferencia: number;
}

const CloseHistory: React.FC = () => {
    const [closeRecords, setCloseRecords] = useState<CloseRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTurno, setFilterTurno] = useState('');
    const [selectedDateFrom, setSelectedDateFrom] = useState('');
    const [selectedDateTo, setSelectedDateTo] = useState('');

    useEffect(() => {
        fetchCloseRecords();
    }, []);

    const fetchCloseRecords = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const closeCollection = collection(db, "close");
            const closeQuery = query(closeCollection, orderBy("fechaCreacion", "desc"));
            const closeSnapshot = await getDocs(closeQuery);
            
            const records = closeSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            })) as CloseRecord[];
            
            setCloseRecords(records);
        } catch (err) {
            console.error("Error al cargar historial de cierres:", err);
            setError("Error al cargar el historial de cierres");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp || !timestamp.toDate) return 'Fecha no disponible';
        return timestamp.toDate().toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const filteredRecords = closeRecords.filter(record => {
        const matchesSearch = record.empleadoResponsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.fecha.includes(searchTerm);
        const matchesTurno = filterTurno === '' || record.turno === filterTurno;
        
        let matchesDateRange = true;
        if (selectedDateFrom && selectedDateTo) {
            matchesDateRange = record.fecha >= selectedDateFrom && record.fecha <= selectedDateTo;
        } else if (selectedDateFrom) {
            matchesDateRange = record.fecha >= selectedDateFrom;
        } else if (selectedDateTo) {
            matchesDateRange = record.fecha <= selectedDateTo;
        }
        
        return matchesSearch && matchesTurno && matchesDateRange;
    });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-lg text-gray-600">Cargando historial de cierres...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={fetchCloseRecords}
                                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                                >
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-blue-800 flex items-center">
                        <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Historial de Cierres de Caja
                    </h1>
                    <p className="text-gray-600 mt-2">Consulta y análisis de todos los cierres de caja realizados</p>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar
                        </label>
                        <input
                            type="text"
                            placeholder="Empleado o fecha..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Turno
                        </label>
                        <select
                            value={filterTurno}
                            onChange={(e) => setFilterTurno(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todos los turnos</option>
                            <option value="Diurno">Diurno</option>
                            <option value="Nocturno">Nocturno</option>
                            <option value="Completo">Completo</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Desde
                        </label>
                        <input
                            type="date"
                            value={selectedDateFrom}
                            onChange={(e) => setSelectedDateFrom(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Hasta
                        </label>
                        <input
                            type="date"
                            value={selectedDateTo}
                            onChange={(e) => setSelectedDateTo(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterTurno('');
                                setSelectedDateFrom('');
                                setSelectedDateTo('');
                            }}
                            className="w-full px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-medium text-blue-800">Total Cierres</h3>
                        <p className="text-2xl font-bold text-blue-900">{filteredRecords.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="text-sm font-medium text-green-800">Total Ventas</h3>
                        <p className="text-2xl font-bold text-green-900">
                            {formatCurrency(filteredRecords.reduce((sum, record) => sum + record.totalVentas, 0))}
                        </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h3 className="text-sm font-medium text-red-800">Total Gastos</h3>
                        <p className="text-2xl font-bold text-red-900">
                            {formatCurrency(filteredRecords.reduce((sum, record) => sum + record.totalGastos, 0))}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h3 className="text-sm font-medium text-purple-800">Total General</h3>
                        <p className="text-2xl font-bold text-purple-900">
                            {formatCurrency(filteredRecords.reduce((sum, record) => sum + record.totalGeneral, 0))}
                        </p>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha/Hora
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Turno
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Empleado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Inicial
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ventas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Gastos
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total General
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Registros
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p className="text-lg font-medium">No se encontraron cierres</p>
                                            <p className="text-sm">No hay registros que coincidan con los filtros aplicados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {record.fecha}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {formatDate(record.fechaCreacion)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                record.turno === 'Diurno' 
                                                    ? 'bg-yellow-100 text-yellow-800' 
                                                    : record.turno === 'Nocturno' 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-purple-100 text-purple-800'
                                            }`}>
                                                {record.turno}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.empleadoResponsable}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(record.totalInicial)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                            {formatCurrency(record.totalVentas)}
                                            <div className="text-xs text-gray-500">
                                                Efectivo: {formatCurrency(record.ventasEfectivo)}<br />
                                                Transferencia: {formatCurrency(record.ventasTransferencia)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                            {formatCurrency(record.totalGastos)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                            {formatCurrency(record.totalGeneral)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="space-y-1">
                                                <div className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded inline-block">
                                                    Saldos: {Object.keys(record.saldosIniciales || {}).length}
                                                </div>
                                                <div className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded inline-block">
                                                    Ventas: {(record.ventasIncluidas || []).length}
                                                </div>
                                                <div className="text-red-600 text-xs bg-red-100 px-2 py-1 rounded inline-block">
                                                    Gastos: {(record.gastosIncluidos || []).length}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CloseHistory;
