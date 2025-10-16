"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../utils/FormatCurrency";

interface InvoiceItem {
  description: string;
  quantity: number | string;
  subtotal: string;
}

interface InvoiceProps {
  invoiceNumber: string;
  plan: string;
  checkInTime: string;
  checkOutTime: string;
  items: InvoiceItem[];
  total: number;
  roomNumber: string;
  timeInMinutes?: number;
  additionalHourCost?: number;
  additionalHourQuantity?: number;
}

const Invoice: React.FC<InvoiceProps> = ({
  invoiceNumber,
  plan,
  checkInTime,
  checkOutTime,
  items,
  total,
  roomNumber,
  timeInMinutes = 0,
  additionalHourCost = 0,
  additionalHourQuantity = 0,
}) => {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleString('es-ES'));
  }, []);
  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      padding: '24px', 
      maxWidth: '320px', 
      margin: '0 auto', 
      color: '#000000',
      width: '80mm', 
      fontSize: '12px', 
      lineHeight: '1.4',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '16px', 
        borderBottom: '1px solid #000000', 
        paddingBottom: '8px' 
      }}>
        {/* Logo */}
        <img 
          src="/LOGO-VIRGOS-MOTEL_completo.png" 
          alt="Virgos Motel Logo" 
          style={{ 
            width: '35px', 
            height: 'auto', 
            marginBottom: '8px',
            display: 'block',
            margin: '0 auto 8px auto'
          }}
        />
        <h1 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          margin: '0 0 8px 0'
        }}>
          ESTADO DE CUENTA
        </h1>
        <p style={{ 
          fontSize: '10px', 
          color: '#666666',
          margin: '0'
        }}>
          Este documento NO ES FACTURA DE VENTA NI SU EQUIVALENTE
        </p>
      </div>

      {/* Invoice Details */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Tiempo:</span>
          <span>{timeInMinutes} minutos</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>No:</span>
          <span>{invoiceNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Habitación:</span>
          <span>{roomNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Plan:</span>
          <span>{plan}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Hora de entrada:</span>
          <span>{checkInTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Hora de salida:</span>
          <span>{checkOutTime}</span>
        </div>
      </div>

      {/* Items Section */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          fontWeight: 'bold', 
          marginBottom: '8px', 
          borderBottom: '1px solid #000000', 
          paddingBottom: '4px',
          margin: '0 0 8px 0'
        }}>
          CONCEPTO
        </h3>
        {items.length > 0 && items.some(item => item.description && item.description.trim() !== '') ? (
          items
            .filter(item => item.description && item.description.trim() !== '')
            .map((item, index) => (
              <div key={index} style={{ marginBottom: '8px', fontSize: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ flex: 1 }}>{item.description}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666666' }}>
                  <span>Cantidad: {item.quantity}</span>
                  <span>{formatCurrency(item.subtotal || 0)}</span>
                </div>
              </div>
            ))
        ) : (
          <div style={{ fontSize: '10px', color: '#666666' }}>Sin consumos adicionales</div>
        )}
      </div>

      {/* Additional Hours Section */}
      {additionalHourQuantity > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            borderBottom: '1px solid #000000', 
            paddingBottom: '4px',
            margin: '0 0 8px 0'
          }}>
            HORAS ADICIONALES
          </h3>
          <div style={{ marginBottom: '8px', fontSize: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ flex: 1 }}>Horas adicionales</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666666' }}>
              <span>Cantidad: {additionalHourQuantity}</span>
              <span>{formatCurrency(additionalHourCost || 0)} c/u</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency((additionalHourCost || 0) * (additionalHourQuantity || 0))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Total */}
      <div style={{ borderTop: '1px solid #000000', paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '16px', 
        fontSize: '10px', 
        color: '#666666' 
      }}>
        <p style={{ margin: '0 0 4px 0' }}>Gracias por su estadía, nos sentimos complacidos por su visita.</p>
        <p style={{ margin: '0' }}>{currentDate}</p>
      </div>
    </div>
  );
};

export default Invoice;
