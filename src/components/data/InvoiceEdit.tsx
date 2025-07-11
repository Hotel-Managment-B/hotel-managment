"use client";
import React, { useState, useRef, useEffect } from "react";
import { formatCurrency } from "../../utils/FormatCurrency";

interface InvoiceItem {
  description: string;
  quantity: number | string;
  subtotal: string;
}

interface InvoiceEditProps {
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
  onSave?: (data: InvoiceEditData) => void;
}

interface InvoiceEditData {
  invoiceNumber: string;
  plan: string;
  checkInTime: string;
  checkOutTime: string;
  roomNumber: string;
  timeInMinutes: number;
  additionalHourCost: number;
  additionalHourQuantity: number;
  items: InvoiceItem[];
  total: number;
  settings: InvoiceSettings;
}

interface InvoiceSettings {
  logoUrl: string;
  title: string;
  subtitle: string;
  footerMessage: string;
  showDateTime: boolean;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  width: number;
  padding: number;
}

const InvoiceEdit: React.FC<InvoiceEditProps> = ({
  invoiceNumber: initialInvoiceNumber,
  plan: initialPlan,
  checkInTime: initialCheckInTime,
  checkOutTime: initialCheckOutTime,
  items: initialItems,
  total: initialTotal,
  roomNumber: initialRoomNumber,
  timeInMinutes: initialTimeInMinutes = 0,
  additionalHourCost: initialAdditionalHourCost = 0,
  additionalHourQuantity: initialAdditionalHourQuantity = 0,
  onSave,
}) => {
  // Estados para los datos de la factura
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoiceNumber);
  const [plan, setPlan] = useState(initialPlan);
  const [checkInTime, setCheckInTime] = useState(initialCheckInTime);
  const [checkOutTime, setCheckOutTime] = useState(initialCheckOutTime);
  const [roomNumber, setRoomNumber] = useState(initialRoomNumber);
  const [timeInMinutes, setTimeInMinutes] = useState(initialTimeInMinutes);
  const [additionalHourCost, setAdditionalHourCost] = useState(initialAdditionalHourCost);
  const [additionalHourQuantity, setAdditionalHourQuantity] = useState(initialAdditionalHourQuantity);
  const [items, setItems] = useState<InvoiceItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);

  // Estados para la configuración de la factura
  const [settings, setSettings] = useState<InvoiceSettings>({
    logoUrl: "/LOGO-VIRGOS-MOTEL_completo.png",
    title: "ESTADO DE CUENTA",
    subtitle: "Este documento NO ES FACTURA DE VENTA NI SU EQUIVALENTE",
    footerMessage: "Gracias por su estadía, nos sentimos complacidos por su visita.",
    showDateTime: true,
    backgroundColor: "#ffffff",
    textColor: "#000000",
    fontSize: 12,
    width: 320,
    padding: 24,
  });

  // Estado para controlar el modo de edición
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeEditSection, setActiveEditSection] = useState<string | null>(null);
  
  // Estado para manejar la fecha del cliente para evitar errores de hidratación
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // useEffect para establecer la fecha del cliente después de la hidratación
  useEffect(() => {
    setCurrentDateTime(new Date().toLocaleString('es-ES'));
  }, []);

  // Función para manejar el cambio de logo
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSettings(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para agregar un nuevo item
  const addNewItem = () => {
    setItems(prev => [...prev, { description: "Nuevo producto", quantity: 1, subtotal: "0" }]);
  };

  // Función para actualizar un item
  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Función para eliminar un item
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Función para calcular el total automáticamente
  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => 
      sum + parseFloat((item.subtotal || '0').toString().replace(/[^\d.-]/g, '')), 0
    );
    const additionalTotal = additionalHourCost * additionalHourQuantity;
    const newTotal = itemsTotal + additionalTotal;
    setTotal(newTotal);
  };

  // Función para guardar los cambios
  const handleSave = () => {
    if (onSave) {
      onSave({
        invoiceNumber,
        plan,
        checkInTime,
        checkOutTime,
        roomNumber,
        timeInMinutes,
        additionalHourCost,
        additionalHourQuantity,
        items,
        total,
        settings,
      });
    }
    setIsEditMode(false);
    setActiveEditSection(null);
  };

  // Componente para el panel de edición
  const EditPanel = () => (
    <div className="bg-gray-50 p-4 border-l border-gray-300 min-h-screen overflow-y-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Panel de Edición</h3>
      
      {/* Configuración general */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-2">Configuración General</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Título</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Subtítulo</label>
            <textarea
              value={settings.subtitle}
              onChange={(e) => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Ancho (px)</label>
            <input
              type="number"
              value={settings.width}
              onChange={(e) => setSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 320 }))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Tamaño de Fuente</label>
            <input
              type="number"
              value={settings.fontSize}
              onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 12 }))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Color de Fondo</label>
            <input
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Color de Texto</label>
            <input
              type="color"
              value={settings.textColor}
              onChange={(e) => setSettings(prev => ({ ...prev, textColor: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-2">Logo</h4>
        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
          >
            Cambiar Logo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">URL del Logo</label>
            <input
              type="text"
              value={settings.logoUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Datos de la factura */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-2">Datos de la Factura</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Número de Factura</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Habitación</label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Plan</label>
            <input
              type="text"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Tiempo (minutos)</label>
            <input
              type="number"
              value={timeInMinutes}
              onChange={(e) => setTimeInMinutes(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Hora de Entrada</label>
            <input
              type="text"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Hora de Salida</label>
            <input
              type="text"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Horas adicionales */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-2">Horas Adicionales</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Cantidad</label>
            <input
              type="number"
              value={additionalHourQuantity}
              onChange={(e) => setAdditionalHourQuantity(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Costo por Hora</label>
            <input
              type="number"
              value={additionalHourCost}
              onChange={(e) => setAdditionalHourCost(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-gray-700">Productos</h4>
          <button
            onClick={addNewItem}
            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
          >
            + Agregar
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="border border-gray-300 p-3 rounded-md bg-white">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-700">Producto {index + 1}</span>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Descripción"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Cantidad"
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={item.subtotal}
                    onChange={(e) => updateItem(index, 'subtotal', e.target.value)}
                    placeholder="Subtotal"
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-2">Pie de Página</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Mensaje de Agradecimiento</label>
            <textarea
              value={settings.footerMessage}
              onChange={(e) => setSettings(prev => ({ ...prev, footerMessage: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDateTime"
              checked={settings.showDateTime}
              onChange={(e) => setSettings(prev => ({ ...prev, showDateTime: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="showDateTime" className="text-sm text-gray-600">Mostrar fecha y hora</label>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="space-y-3">
        <button
          onClick={calculateTotal}
          className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
        >
          Recalcular Total
        </button>
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
        >
          Guardar Cambios
        </button>
        <button
          onClick={() => setIsEditMode(false)}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Vista previa de la factura */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-center items-center mb-6">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-md transition-colors ${
              isEditMode
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isEditMode ? 'Salir del Modo Edición' : 'Entrar al Modo Edición'}
          </button>
        </div>

        {/* Factura editable */}
        <div className="flex justify-center">
          <div
            style={{
              backgroundColor: settings.backgroundColor,
              padding: `${settings.padding}px`,
              maxWidth: `${settings.width}px`,
              margin: '0 auto',
              color: settings.textColor,
              width: '80mm',
              fontSize: `${settings.fontSize}px`,
              lineHeight: '1.4',
              fontFamily: 'Arial, sans-serif',
              border: isEditMode ? '2px dashed #3B82F6' : 'none',
              position: 'relative',
            }}
            className={isEditMode ? 'hover:shadow-lg transition-shadow' : ''}
          >
            {/* Header */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: '16px',
                borderBottom: `1px solid ${settings.textColor}`,
                paddingBottom: '8px',
              }}
              className={isEditMode ? 'hover:bg-blue-50 cursor-pointer p-2 rounded' : ''}
              onClick={() => isEditMode && setActiveEditSection('header')}
            >
              {/* Logo */}
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  style={{
                    width: '35px',
                    height: 'auto',
                    marginBottom: '8px',
                    display: 'block',
                    margin: '0 auto 8px auto',
                  }}
                  className={isEditMode ? 'hover:opacity-80' : ''}
                />
              )}
              <h1
                style={{
                  fontSize: `${settings.fontSize + 6}px`,
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  margin: '0 0 8px 0',
                }}
              >
                {settings.title}
              </h1>
              <p
                style={{
                  fontSize: `${settings.fontSize - 2}px`,
                  color: '#666666',
                  margin: '0',
                }}
              >
                {settings.subtitle}
              </p>
            </div>

            {/* Invoice Details */}
            <div
              style={{ marginBottom: '16px' }}
              className={isEditMode ? 'hover:bg-blue-50 cursor-pointer p-2 rounded' : ''}
              onClick={() => isEditMode && setActiveEditSection('details')}
            >
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
            <div
              style={{ marginBottom: '16px' }}
              className={isEditMode ? 'hover:bg-blue-50 cursor-pointer p-2 rounded' : ''}
              onClick={() => isEditMode && setActiveEditSection('items')}
            >
              <h3
                style={{
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  borderBottom: `1px solid ${settings.textColor}`,
                  paddingBottom: '4px',
                  margin: '0 0 8px 0',
                }}
              >
                CONCEPTO
              </h3>
              {items.length > 0 && items.some(item => item.description && item.description.trim() !== '') ? (
                items
                  .filter(item => item.description && item.description.trim() !== '')
                  .map((item, index) => (
                    <div key={index} style={{ marginBottom: '8px', fontSize: `${settings.fontSize - 2}px` }}>
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
                <div style={{ fontSize: `${settings.fontSize - 2}px`, color: '#666666' }}>
                  Sin consumos adicionales
                </div>
              )}
            </div>

            {/* Additional Hours Section */}
            {additionalHourQuantity > 0 && (
              <div
                style={{ marginBottom: '16px' }}
                className={isEditMode ? 'hover:bg-blue-50 cursor-pointer p-2 rounded' : ''}
                onClick={() => isEditMode && setActiveEditSection('additionalHours')}
              >
                <h3
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    borderBottom: `1px solid ${settings.textColor}`,
                    paddingBottom: '4px',
                    margin: '0 0 8px 0',
                  }}
                >
                  HORAS ADICIONALES
                </h3>
                <div style={{ marginBottom: '8px', fontSize: `${settings.fontSize - 2}px` }}>
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
            <div
              style={{ borderTop: `1px solid ${settings.textColor}`, paddingTop: '8px' }}
              className={isEditMode ? 'hover:bg-blue-50 cursor-pointer p-2 rounded' : ''}
              onClick={() => isEditMode && setActiveEditSection('total')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: `${settings.fontSize + 2}px` }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '16px',
                fontSize: `${settings.fontSize - 2}px`,
                color: '#666666',
              }}
              className={isEditMode ? 'hover:bg-blue-50 cursor-pointer p-2 rounded' : ''}
              onClick={() => isEditMode && setActiveEditSection('footer')}
            >
              <p style={{ margin: '0 0 4px 0' }}>{settings.footerMessage}</p>
              {settings.showDateTime && currentDateTime && (
                <p style={{ margin: '0' }}>{currentDateTime}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Panel de edición */}
      {isEditMode && (
        <div className="w-80 bg-white border-l border-gray-300">
          <EditPanel />
        </div>
      )}
    </div>
  );
};

export default InvoiceEdit;
