'use client';
import React, { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const NextAuthLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Por favor, completa todos los campos.");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@") || email.length < 5) {
      setErrorMessage("Por favor, ingresa un correo electrónico válido.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/inicio",
      });

      if (result?.error) {
        setErrorMessage("Credenciales inválidas. Por favor, verifica tu correo y contraseña.");
      } else {
        // Get the session to ensure user is authenticated
        const session = await getSession();
        if (session) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Ocurrió un error inesperado. Inténtalo de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col sm:flex-row">
      {/* Contenedor izquierdo con la imagen */}
      <div className="sm:w-1/2 w-full bg-gray-100 flex items-center justify-center relative h-full">
        <img src="/LOGO-VIRGOS-MOTEL_completo.png" alt="Logo Virgos Motel" className="max-w-full h-auto" />
        {/* Formulario superpuesto en dispositivos pequeños */}
        <div className="absolute inset-0 flex items-center justify-center sm:hidden">
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-3xl font-bold text-center text-blue-900 mb-6 hidden md:visible">Sistema de Gestión Hotelera</h1>
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
                {errorMessage && (
                  <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor derecho con el formulario */}
      <div className="sm:w-1/2 w-full items-center justify-center sm:flex hidden">
        <div className="flex flex-col items-center justify-center min-h-screen ">
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
              {errorMessage && (
                <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextAuthLogin;
