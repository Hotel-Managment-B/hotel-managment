"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/Index";
import AddEmployee from "./AddEmployee";
import { FaTrash, FaEdit } from "react-icons/fa";
import { formatCurrency } from "../../utils/FormatCurrency";

export interface Employee {
  id: string;
  fullName: string;
  idNumber: string;
  contactNumber: string;
  email: string;
  salary?: string; // Añadimos el campo salary como opcional para compatibilidad con registros existentes
}

const ListEmployee = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "employee"));
        const employeeList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[];
        setEmployees(employeeList);
      } catch (error) {
        console.error("Error al obtener los empleados: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleEdit = async (employee: Employee) => {
    try {
      const employeeRef = doc(db, "employee", employee.id);
      const employeeSnapshot = await getDoc(employeeRef);

      if (employeeSnapshot.exists()) {
        const updatedEmployee = {
          id: employeeSnapshot.id,
          ...employeeSnapshot.data(),
        } as Employee;
        setSelectedEmployee(updatedEmployee);
        setIsModalOpen(true);
      } else {
        console.error("El empleado no existe en la base de datos.");
      }
    } catch (error) {
      console.error("Error al obtener los datos del empleado:", error);
    }
  };

  const handleUpdate = async (updatedData: Employee) => {
    try {
      const employeeRef = doc(db, "employee", updatedData.id);
      await updateDoc(employeeRef, {
        fullName: updatedData.fullName,
        idNumber: updatedData.idNumber,
        contactNumber: updatedData.contactNumber,
        email: updatedData.email,
        salary: updatedData.salary || "",
      });
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => (emp.id === updatedData.id ? updatedData : emp))
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al actualizar el empleado:", error);
    }
  };
  // Función para manejar el registro de un nuevo empleado
  const handleAddEmployee = (newEmployeeData: Employee) => {
    // Añadimos el nuevo empleado directamente a la lista
    setEmployees((prevEmployees) => [...prevEmployees, newEmployeeData]);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start min-h-screen mt-6 px-4 gap-4">
      <div className="sm:w-1/3 w-full">
        <AddEmployee
          onSubmit={handleAddEmployee}
          title="Registrar Empleado"
          buttonText="Registrar Empleado"
        />
      </div>
      <div className="sm:w-2/3 w-full">
        <div className="w-full max-w-4xl p-8 space-y-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-sm md:text-lg font-bold text-center text-blue-900">
            Lista de Empleados
          </h2>
          {isLoading ? (
            <p className="text-blue-700 text-lg">Cargando empleados...</p>
          ) : employees.length === 0 ? (
            <p className="text-blue-700 text-lg">No hay empleados para mostrar.</p>) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-full bg-white border border-blue-300 rounded-lg overflow-hidden">
                <thead className="bg-blue-100">
                  <tr><th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Nombre Completo</th>
                    <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Cédula</th>
                    <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">Salario Quincenal</th>
                    <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Número de Contacto</th>
                    <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">Email</th>
                    <th className="py-3 px-4 border-b border-blue-300 text-center text-sm font-semibold text-blue-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-blue-50 transition-colors">
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">{employee.fullName}</td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">{employee.idNumber}</td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">
                        {employee.salary ? formatCurrency(employee.salary) : "$0"}
                      </td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">{employee.contactNumber}</td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">{employee.email}</td>
                      <td className="py-3 px-4 border-b border-blue-200 text-sm text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => {
                              const confirmDelete = window.confirm(
                                "¿Seguro deseas eliminar este empleado?"
                              );
                              if (confirmDelete) {
                                console.log("Eliminar empleado", employee.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <AddEmployee
              initialData={selectedEmployee}
              onSubmit={(updatedData: Employee) => handleUpdate(updatedData)}
              title="Actualizar Empleado"
              buttonText="Actualizar Empleado"
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListEmployee;
