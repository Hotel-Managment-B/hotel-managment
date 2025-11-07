"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../firebase/Index";
import { formatCurrency } from "../../utils/FormatCurrency";
import { toast } from "react-toastify";

import { Employee } from "./ListEmployee"; // Importé correctamente la interfaz Employee para resolver el error de tipo

// Extendemos la interfaz Employee para incluir el campo salary
export interface EmployeeWithSalary extends Employee {
  salary?: string;
}

export interface AddEmployeeProps {
  initialData?: EmployeeWithSalary | null;
  onSubmit: (data: EmployeeWithSalary) => void;
  title?: string;
  buttonText?: string;
}

const AddEmployee: React.FC<AddEmployeeProps> = ({
  initialData,
  onSubmit,
  title = "Registrar Empleado",
  buttonText = "Registrar Empleado",
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    salary: "",
    idNumber: "",
    contactNumber: "",
    email: "",
    password: "",
  });

  const [displaySalary, setDisplaySalary] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        salary: initialData.salary || "",
        idNumber: initialData.idNumber || "",
        contactNumber: initialData.contactNumber || "",
        email: initialData.email || "",
        password: "", // No se debe rellenar la contraseña por seguridad
      });

      // Formatear el salario si existe
      if (initialData.salary) {
        setDisplaySalary(formatCurrency(initialData.salary));
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setFormData((prevFormData) => ({
      ...prevFormData,
      salary: value,
    }));

    if (value) {
      setDisplaySalary(formatCurrency(Number(value)));
    } else {
      setDisplaySalary("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employeeRef = initialData ? doc(db, "employee", initialData.id) : null;
      
      if (employeeRef) {
        // Actualizar empleado existente
        const updatedData = {
          fullName: formData.fullName,
          salary: formData.salary,
          idNumber: formData.idNumber,
          contactNumber: formData.contactNumber,
          email: formData.email,
          ...(formData.password && { password: formData.password }), // Solo incluye la contraseña si no está vacía
        };

        await updateDoc(employeeRef, updatedData);
        console.log("Empleado actualizado en Firebase:", updatedData);
      } else {
        // Crear nuevo empleado
        
        // 1. Primero crear la cuenta de autenticación
        if (!formData.email || !formData.password) {
          toast.error("Email y contraseña son requeridos para crear la cuenta del empleado");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        console.log("Cuenta de autenticación creada para:", formData.email);

        // 2. Luego guardar los datos del empleado en Firestore
        const employeeData = {
          ...formData,
          uid: userCredential.user.uid, // Guardar el UID de autenticación
          createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, "employee"), employeeData);
        console.log("Empleado registrado en Firebase con ID:", docRef.id);
        
        // Crear el objeto de empleado completo con el ID generado
        const newEmployee = {
          id: docRef.id,
          ...employeeData,
        };
        
        // Llamar a onSubmit con el nuevo empleado incluyendo su ID
        if (onSubmit) {
          onSubmit(newEmployee);
        }
        
        // Limpiar el formulario después de guardar
        setFormData({
          fullName: "",
          salary: "",
          idNumber: "",
          contactNumber: "",
          email: "",
          password: "",
        });
        setDisplaySalary("");
        
        toast.success("Empleado registrado exitosamente. Se ha creado su cuenta de acceso.");
        return;
      }
      
      // Este código solo se ejecutará para actualizaciones, no para nuevos registros
      setFormData({
        fullName: "",
        salary: "",
        idNumber: "",
        contactNumber: "",
        email: "",
        password: "",
      });
      setDisplaySalary("");

      if (onSubmit) {
        onSubmit({
          id: initialData?.id || "",
          ...formData,
        });
      }
      
      toast.success("Empleado actualizado exitosamente.");
      
    } catch (error: any) {
      console.error("Error al registrar o actualizar el empleado:", error);
      
      // Manejar errores específicos de Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Este email ya está registrado. Por favor usa otro email.");
      } else if (error.code === 'auth/weak-password') {
        toast.error("La contraseña es muy débil. Debe tener al menos 6 caracteres.");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("El formato del email no es válido.");
      } else {
        toast.error("Error al registrar el empleado. Por favor intenta nuevamente.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-14">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-2xl border-2 border-blue-200">
        <h2 className="text-sm md:text-lg font-bold text-center text-blue-900">
          {title}
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="fullName" className="block text-sm font-bold text-blue-900">
              Nombre Completo
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa el nombre completo"
              required
            />
          </div>
          <div>
            <label htmlFor="salary" className="block text-sm font-bold text-blue-900">
              Salario Quincenal ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="text"
                id="salary"
                name="salary"
                value={displaySalary || ""}
                onChange={handleSalaryChange}
                className="w-full px-3 py-2 pl-8 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                placeholder="0"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="idNumber" className="block text-sm font-bold text-blue-900">
              Cédula
            </label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa la cédula"
              required
            />
          </div>
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-bold text-blue-900">
              Número de Contacto
            </label>
            <input
              type="text"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa el número de contacto"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-blue-900">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa el email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-blue-900">
              Contraseña {!initialData && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder={initialData ? "Dejar vacío para mantener la actual" : "Ingresa la contraseña"}
              required={!initialData}
              minLength={6}
            />
            {!initialData && (
              <p className="text-xs text-gray-600 mt-1">
                Mínimo 6 caracteres. Esta será la contraseña para acceder al sistema.
              </p>
            )}
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-64 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
