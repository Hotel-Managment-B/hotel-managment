"use client";
import InvoiceEdit from "@/components/data/InvoiceEdit";

export default function InvoicePage() {
    // Crear fechas de ejemplo para evitar problemas de hidratación
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const laterTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 horas después
    const checkOutTime = laterTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    return (
        <InvoiceEdit
            invoiceNumber="001"
            plan="Plan Ejemplo"
            checkInTime={checkInTime}
            checkOutTime={checkOutTime}
            items={[
                { description: "Producto de ejemplo", quantity: 1, subtotal: "5000" }
            ]}
            total={25000}
            roomNumber="101"
            timeInMinutes={240}
            additionalHourCost={5000}
            additionalHourQuantity={1}
            onSave={(data) => {
                console.log('Datos de factura guardados:', data);
                // Aquí puedes implementar la lógica para guardar
            }}
        />
    );
}