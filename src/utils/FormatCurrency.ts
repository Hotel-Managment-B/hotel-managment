export const formatCurrency = (value: string | number): string => {
  if (value === "" || value === null || value === undefined) {
    return "$0";
  }

  // Convertir el valor a número si es una cadena
  const numValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9]/g, "")) : value;

  // Si el valor no es un número válido, devolver una cadena vacía para permitir la entrada
  if (isNaN(numValue)) return "";

  // Formatear con separadores de miles y sin decimales
  return "$" + numValue.toLocaleString("es-ES", {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};