'use client';
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/Index";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Usuario autenticado:", userCredential.user);
      alert("Inicio de sesión exitoso");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Error al iniciar sesión. Verifica tus credenciales.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">Sistema de Gestión Hotelera</h1>
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border-2 border-blue-300">
        <h2 className="text-2xl font-bold text-center text-blue-900">Iniciar Sesión</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-blue-900">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa tu correo"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;