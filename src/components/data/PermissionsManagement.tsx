"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/Index";

// Interfaces para el componente
interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Employee {
  id: string;
  fullName: string;
  email: string;
  uid?: string; // UID de Firebase Auth
  idNumber?: string;
  contactNumber?: string;
  salary?: string;
}

const PermissionsManagement = () => {
  // Estado para almacenar empleados cargados desde Firebase
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions] = useState<Permission[]>([
    // General
    {
      id: "1",
      name: "Inicio",
      description: "Acceso al panel principal del sistema",
      category: "General",
    },

    // Empleados
    {
      id: "2",
      name: "Lista de Empleados",
      description: "Ver y editar información de empleados",
      category: "Empleados",
    },

    // Finanzas
    {
      id: "3",
      name: "Cuentas Bancarias",
      description: "Gestionar cuentas bancarias del hotel",
      category: "Finanzas",
    },
    {
      id: "4",
      name: "Gastos",
      description: "Registrar gastos administrativos",
      category: "Finanzas",
    },
    {
      id: "5",
      name: "Historial de Gastos",
      description: "Ver listado de gastos realizados",
      category: "Finanzas",
    },
    {
      id: "6",
      name: "Préstamos",
      description: "Registrar préstamos a empleados",
      category: "Finanzas",
    },
    {
      id: "7",
      name: "Lista de Préstamos",
      description: "Ver histórico de préstamos",
      category: "Finanzas",
    },

    // Inventario
    {
      id: "8",
      name: "Registrar Productos",
      description: "Agregar nuevos productos al inventario",
      category: "Inventario",
    },
    {
      id: "9",
      name: "Compras Productos",
      description: "Registrar compras de productos para el minibar",
      category: "Inventario",
    },
    {
      id: "10",
      name: "Inventario",
      description: "Ver el listado de productos en stock",
      category: "Inventario",
    },

    // Habitaciones
    {
      id: "11",
      name: "Habitaciones",
      description: "Gestionar información de habitaciones",
      category: "Habitaciones",
    },
    {
      id: "12",
      name: "Insumos Habitaciones",
      description: "Administrar insumos para las habitaciones",
      category: "Habitaciones",
    },
    {
      id: "13",
      name: "Historial de Servicios",
      description: "Ver registro histórico de servicios de habitaciones",
      category: "Habitaciones",
    },

    //Permiso
    {
      id: "14",
      name: "Permiso Especial",
      description: "Acceso a funcionalidades especiales",
      category: "Permisos",
    },
  ]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]); // Inicialmente sin permisos seleccionados
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" }); // Cargar empleados desde Firebase al iniciar el componente
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const employeeCollection = collection(db, "employee");
        const employeeSnapshot = await getDocs(employeeCollection);
        const employeeList = employeeSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[];

        setEmployees(employeeList);
        setIsLoading(false);
      } catch (error) {
        console.error("Error al cargar empleados:", error);
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Agrupar permisos por categoría
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
  // Función para cargar los permisos de un empleado desde Firebase
  const fetchEmployeePermissions = async (employeeId: string) => {
    try {
      setIsSaving(true); // Mostrar indicador de carga

      // 1. Buscar en la subcolección de permisos dentro del documento de empleado
      const permissionsRef = doc(
        db,
        `employee/${employeeId}/permissions`,
        "user_permissions"
      );
      const permissionsSnapshot = await getDoc(permissionsRef);

      if (permissionsSnapshot.exists()) {
        // Si el documento existe, obtener los permisos
        const permissionsData = permissionsSnapshot.data();
        if (permissionsData && permissionsData.permissionIds) {
          setSelectedPermissions(permissionsData.permissionIds);
          console.log(
            "Permisos cargados desde subcolección:",
            permissionsData.permissionIds
          );
        } else {
          setSelectedPermissions([]);
        }
      } else {
        // 2. Verificar estructura antigua (para compatibilidad)
        const employeeDoc = await getDoc(doc(db, "employee", employeeId));
        if (employeeDoc.exists()) {
          const employeeData = employeeDoc.data();
          const employeeEmail = employeeData.email;

          if (employeeEmail) {
            // Intentar cargar desde la colección por email
            const emailPermissionsRef = doc(
              db,
              "permissions_by_email",
              employeeEmail.toLowerCase()
            );
            const emailPermissionsSnapshot = await getDoc(emailPermissionsRef);

            if (emailPermissionsSnapshot.exists()) {
              const permissionsData = emailPermissionsSnapshot.data();
              if (permissionsData && permissionsData.permissionIds) {
                setSelectedPermissions(permissionsData.permissionIds);
                console.log(
                  "Permisos cargados desde colección por email:",
                  permissionsData.permissionIds
                );
                setIsSaving(false);
                return;
              }
            }

            // Verificar en la estructura antigua de permissions
            const oldPermissionsRef = doc(db, "permissions", employeeId);
            const oldPermissionsSnapshot = await getDoc(oldPermissionsRef);

            if (oldPermissionsSnapshot.exists()) {
              const permissionsData = oldPermissionsSnapshot.data();
              if (permissionsData && permissionsData.permissionIds) {
                setSelectedPermissions(permissionsData.permissionIds);
                console.log(
                  "Permisos cargados desde estructura antigua:",
                  permissionsData.permissionIds
                );
                setIsSaving(false);
                return;
              }
            }
          }
        }

        // Si no se encuentran permisos en ninguna parte
        setSelectedPermissions([]);
      }

      setIsSaving(false);
    } catch (error) {
      console.error("Error al cargar los permisos del empleado:", error);
      setSelectedPermissions([]);
      setIsSaving(false);
      setMessage({
        type: "error",
        text: "Error al cargar los permisos. Intente nuevamente.",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleEmployeeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const employeeId = e.target.value;
    setSelectedEmployee(employeeId);

    if (employeeId) {
      // Cargar los permisos del empleado desde Firebase
      await fetchEmployeePermissions(employeeId);
    } else {
      // Si se selecciona la opción "Seleccione un empleado", limpiar los permisos seleccionados
      setSelectedPermissions([]);
    }
  };

  // Manejar cambio en checkbox de permiso
  const handlePermissionChange = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // Seleccionar o deseleccionar todos los permisos
  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedPermissions(permissions.map((p) => p.id));
    } else {
      setSelectedPermissions([]);
    }
  }; // Guardar permisos en Firebase
  const handleSavePermissions = async () => {
    if (!selectedEmployee) {
      setMessage({
        type: "error",
        text: "Por favor, seleccione un empleado primero",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }

    setIsSaving(true);

    try {
      // Obtener datos del empleado seleccionado para obtener su email
      const employeeDoc = await getDoc(doc(db, "employee", selectedEmployee));

      if (!employeeDoc.exists()) {
        throw new Error("No se encontró el empleado seleccionado");
      }

      const employeeData = employeeDoc.data();
      const employeeEmail = employeeData.email;

      if (!employeeEmail) {
        throw new Error("El empleado no tiene un correo electrónico asociado");
      }

      console.log("Guardando permisos para empleado:", employeeEmail);

      // Datos a guardar
      const permissionsData = {
        permissionIds: selectedPermissions,
        email: employeeEmail.toLowerCase(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Guardar en subcolección permissions dentro de employee
      const permissionSubcollectionRef = doc(
        db,
        `employee/${selectedEmployee}/permissions`,
        "user_permissions"
      );
      await setDoc(permissionSubcollectionRef, permissionsData);

      // 2. También guardamos en una colección separada por email para facilitar búsquedas
      const emailPermissionsRef = doc(
        db,
        "permissions_by_email",
        employeeEmail.toLowerCase()
      );
      await setDoc(emailPermissionsRef, {
        ...permissionsData,
        employeeId: selectedEmployee,
      });

      setIsSaving(false);
      setMessage({
        type: "success",
        text: "Permisos guardados correctamente",
      });

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error al guardar los permisos:", error);
      setIsSaving(false);
      setMessage({
        type: "error",
        text: "Error al guardar los permisos. Intente nuevamente.",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-blue-800 mb-6">
          Gestión de Permisos de Usuario
        </h1>
        {/* Selector de empleado */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Empleado
          </label>
          {isLoading ? (
            <p className="text-gray-500">Cargando empleados...</p>
          ) : employees.length === 0 ? (
            <p className="text-gray-500">No hay empleados registrados</p>
          ) : (
            <select
              value={selectedEmployee}
              onChange={handleEmployeeChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione un empleado</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sección de permisos */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-blue-700">Permisos</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => handleSelectAll(true)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Seleccionar Todos
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Deseleccionar Todos
            </button>
          </div>
        </div>

        {/* Mostrar permisos agrupados por categoría */}
        <div className="space-y-6">
          {Object.entries(permissionsByCategory).map(
            ([category, categoryPermissions]) => (
              <div
                key={category}
                className="border border-gray-200 rounded-md p-4"
              >
                <h3 className="text-md font-semibold text-blue-800 mb-3">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start p-2 border border-gray-100 rounded bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        id={`perm-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionChange(permission.id)}
                        className="mt-1"
                      />
                      <label htmlFor={`perm-${permission.id}`} className="ml-2">
                        <div className="font-medium text-gray-800">
                          {permission.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {permission.description}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Botón de guardar */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSavePermissions}
            disabled={isSaving}
            className={`px-4 py-2 rounded-md text-white ${
              isSaving
                ? "bg-blue-400 cursor-wait"
                : "bg-blue-600 hover:bg-blue-700"
            } transition-colors`}
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

        {/* Mensaje de confirmación */}
        {message.text && (
          <div
            className={`mt-4 p-3 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionsManagement;
