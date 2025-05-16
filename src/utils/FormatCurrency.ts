export const formatCurrency = (value: string | number): string => {
  // Si el valor es vacío, devolver una cadena vacía para permitir la entrada
  if (!value) return "";

  // Convertir el valor a número si es una cadena
  const numValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9]/g, "")) : value;

  // Formatear con separadores de miles usando punto
  return "$" + numValue.toLocaleString("es-ES", {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};