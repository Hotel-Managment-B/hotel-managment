"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/Index";

import { Employee } from "./ListEmployee"; // Importé correctamente la interfaz Employee para resolver el error de tipo

export interface AddEmployeeProps {
  initialData?: Employee | null;
  onSubmit: (data: Employee) => void;
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
    idNumber: "",
    contactNumber: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        idNumber: initialData.idNumber || "",
        contactNumber: initialData.contactNumber || "",
        email: initialData.email || "",
        password: "", // No se debe rellenar la contraseña por seguridad
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employeeRef = initialData ? doc(db, "employee", initialData.id) : null;

      if (employeeRef) {
        const updatedData = {
          fullName: formData.fullName,
          idNumber: formData.idNumber,
          contactNumber: formData.contactNumber,
          email: formData.email,
          ...(formData.password && { password: formData.password }), // Solo incluye la contraseña si no está vacía
        };

        await updateDoc(employeeRef, updatedData);
        console.log("Empleado actualizado en Firebase:", updatedData);
      } else {
        await addDoc(collection(db, "employee"), formData);
        console.log("Empleado registrado en Firebase:", formData);
      }

      setFormData({
        fullName: "",
        idNumber: "",
        contactNumber: "",
        email: "",
        password: "",
      });

      if (onSubmit) {
        onSubmit({
          id: initialData?.id || "",
          ...formData,
        });
      }
    } catch (error) {
      console.error("Error al registrar o actualizar el empleado en Firebase:", error);
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
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa la contraseña"
            />
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
