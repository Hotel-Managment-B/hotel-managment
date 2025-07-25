# 📚 Documentación del Sistema de Gestión Hotelera

## 📋 Índice
1. [Información General del Proyecto](#información-general-del-proyecto)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Módulos del Sistema](#módulos-del-sistema)
6. [Sistema de Autenticación y Permisos](#sistema-de-autenticación-y-permisos)
7. [Base de Datos Firebase](#base-de-datos-firebase)
8. [Funcionalidades Principales](#funcionalidades-principales)
9. [Guía de Instalación](#guía-de-instalación)
10. [Guía de Usuario](#guía-de-usuario)
11. [Mantenimiento y Soporte](#mantenimiento-y-soporte)

---

## 📊 Información General del Proyecto

### Nombre del Proyecto
**Sistema de Gestión Hotelera - Hotel Management System**

### Descripción
Sistema integral de gestión hotelera desarrollado con Next.js y Firebase que permite administrar todas las operaciones de un hotel incluyendo:
- Gestión de empleados y permisos
- Control financiero (gastos, ingresos, cuentas bancarias)
- Gestión de habitaciones y servicios
- Control de inventario y productos
- Sistema de cierre de caja con aislamiento de turnos
- Reportes e historial detallado

### Versión
v1.0.0

### Fecha de Desarrollo
2025

### Desarrollado por
Sistema desarrollado para la gestión integral de operaciones hoteleras

---

## 🏗️ Arquitectura del Sistema

### Arquitectura General
El sistema utiliza una arquitectura moderna basada en:
- **Frontend**: Next.js 14+ con React 18+
- **Backend**: Firebase (Firestore, Authentication)
- **Estilos**: Tailwind CSS
- **Autenticación**: NextAuth.js con Firebase
- **Estado**: React Hooks y Context API

### Patrón de Diseño
- **Componentes Reutilizables**: Estructura modular de componentes
- **Páginas Dinámicas**: Sistema de rutas de Next.js
- **Middleware de Autenticación**: Control de acceso por rutas
- **Gestión de Estado**: Context API para autenticación global

---

## 💻 Tecnologías Utilizadas

### Frontend
- **Next.js 14+**: Framework de React para aplicaciones web
- **React 18+**: Librería de JavaScript para interfaces de usuario
- **TypeScript**: Superset tipado de JavaScript
- **Tailwind CSS**: Framework de CSS para estilos
- **React Icons**: Librería de iconos para React

### Backend y Base de Datos
- **Firebase Firestore**: Base de datos NoSQL en tiempo real
- **Firebase Authentication**: Sistema de autenticación
- **NextAuth.js**: Librería de autenticación para Next.js

### Herramientas de Desarrollo
- **ESLint**: Linter para mantener calidad de código
- **PostCSS**: Procesador de CSS
- **npm**: Gestor de paquetes

### Dependencias Principales
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "firebase": "^10.0.0",
  "next-auth": "^4.0.0",
  "tailwindcss": "^3.0.0",
  "typescript": "^5.0.0"
}
```

---

## 📁 Estructura del Proyecto

```
hotel-management/
├── src/
│   ├── app/                          # Páginas de la aplicación (App Router)
│   │   ├── dashboard/               # Panel principal
│   │   ├── login/                   # Página de inicio de sesión
│   │   ├── add-employee/           # Registrar empleados
│   │   ├── employee-list/          # Lista de empleados
│   │   ├── bank/                   # Gestión de cuentas bancarias
│   │   ├── Administrative/         # Gastos administrativos
│   │   ├── administrative-list/    # Historial de gastos
│   │   ├── close/                  # Cierre de caja
│   │   ├── close-history/          # Historial de cierres
│   │   ├── loans/                  # Préstamos a empleados
│   │   ├── list-loans/             # Lista de préstamos
│   │   ├── products-mb/            # Registrar productos
│   │   ├── minibar-purchase/       # Compras para minibar
│   │   ├── product-list/           # Lista de productos
│   │   ├── room-data/              # Datos de habitaciones
│   │   ├── room-status/            # Estado de habitaciones
│   │   ├── service-history/        # Historial de servicios
│   │   ├── toiletries/             # Insumos de habitaciones
│   │   ├── toiletries-list/        # Lista de insumos
│   │   ├── toiletries-spent/       # Consumo de insumos
│   │   └── permissions/            # Gestión de permisos
│   ├── components/                  # Componentes reutilizables
│   │   ├── auth/                   # Componentes de autenticación
│   │   ├── data/                   # Componentes de datos/formularios
│   │   ├── layout/                 # Componentes de diseño
│   │   ├── login/                  # Componentes de login
│   │   ├── providers/              # Proveedores de contexto
│   │   └── ui/                     # Componentes de interfaz
│   ├── firebase/                    # Configuración de Firebase
│   ├── hooks/                       # React Hooks personalizados
│   ├── lib/                         # Librerías y utilidades
│   ├── types/                       # Definiciones de tipos TypeScript
│   └── utils/                       # Funciones utilitarias
├── public/                          # Archivos estáticos
└── Archivos de configuración
```

---

## 🔧 Módulos del Sistema

### 1. 👥 Gestión de Empleados
**Componentes**: `AddEmployee.tsx`, `ListEmployee.tsx`
**Funcionalidades**:
- Registro de nuevos empleados
- Edición de información de empleados
- Lista completa con búsqueda y filtros
- Integración con Firebase Authentication
- Gestión de salarios y datos de contacto

### 2. 💰 Gestión Financiera
**Componentes**: `BankAccount.tsx`, `AdministrativeExpenses.tsx`, `LoanEmployee.tsx`
**Funcionalidades**:
- Gestión de cuentas bancarias
- Registro de gastos administrativos
- Sistema de préstamos a empleados
- Control automático de saldos
- Historial detallado de transacciones

### 3. 🏨 Gestión de Habitaciones
**Componentes**: `RoomStatus.tsx`, `RoomList.tsx`, `AddRoom.tsx`
**Funcionalidades**:
- Control de estado de habitaciones (ocupado/desocupado)
- Gestión de servicios de habitación
- Registro de consumos y productos
- Cálculo automático de tarifas
- Generación de facturas

### 4. 📦 Gestión de Inventario
**Componentes**: `RegisterProducts.tsx`, `ListProducts.tsx`, `AddPurchase.tsx`
**Funcionalidades**:
- Registro de productos para minibar
- Control de stock en tiempo real
- Gestión de compras y proveedores
- Actualización automática de inventarios
- Reportes de productos más/menos vendidos

### 5. 🧴 Gestión de Insumos
**Componentes**: `RegisterToiletries.tsx`, `ToiletriesSpent.tsx`, `ToiletriesPurchase.tsx`
**Funcionalidades**:
- Registro de insumos para habitaciones
- Control de consumo por habitación
- Gestión de compras de insumos
- Actualización automática de cantidades

### 6. 💼 Sistema de Cierre de Caja
**Componentes**: `Close.tsx`, `CloseHistory.tsx`
**Funcionalidades**:
- Cierre de caja por turnos (Diurno/Nocturno)
- Aislamiento de datos entre turnos consecutivos
- Captura automática de saldos iniciales
- Cálculo automático de ventas y gastos
- Persistencia de estado con localStorage
- Historial completo con filtros avanzados

### 7. 🔐 Sistema de Permisos
**Componentes**: `PermissionsManagement.tsx`, `ProtectedRoute.tsx`
**Funcionalidades**:
- Gestión granular de permisos por empleado
- 17 niveles diferentes de permisos
- Control de acceso por rutas
- Middleware de autenticación
- Permisos categorizados por módulos

---

## 🔐 Sistema de Autenticación y Permisos

### Autenticación
- **Proveedor**: Firebase Authentication
- **Método**: Email y contraseña
- **Sesión**: Manejada por NextAuth.js
- **Middleware**: Control automático de rutas protegidas

### Niveles de Permisos

| ID | Nombre | Descripción | Categoría |
|----|--------|-------------|-----------|
| 1 | Inicio | Acceso al panel principal | General |
| 2 | Lista de Empleados | Ver y editar empleados | Empleados |
| 3 | Cuentas Bancarias | Gestionar cuentas bancarias | Finanzas |
| 4 | Gastos | Registrar gastos administrativos | Finanzas |
| 5 | Historial de Gastos | Ver listado de gastos | Finanzas |
| 6 | Préstamos | Registrar préstamos a empleados | Finanzas |
| 7 | Lista de Préstamos | Ver histórico de préstamos | Finanzas |
| 8 | Registrar Productos | Agregar productos al inventario | Inventario |
| 9 | Compras Productos | Registrar compras para minibar | Inventario |
| 10 | Inventario | Ver listado de productos | Inventario |
| 11 | Habitaciones | Gestionar información de habitaciones | Habitaciones |
| 12 | Insumos Habitaciones | Administrar insumos | Habitaciones |
| 13 | Historial de Servicios | Ver registro de servicios | Habitaciones |
| 14 | Permiso Especial | Funcionalidades especiales | Permisos |
| 15 | Editor de Factura | Editor visual de facturas | Permisos |
| 16 | Historial de Cierres | Ver historial de cierres de caja | Finanzas |
| 17 | Cierre de Caja | Realizar cierre de caja y turnos | Finanzas |

### Middleware de Rutas
```typescript
// Configuración de rutas protegidas
const routePermissions: Record<string, string[]> = {
  '/dashboard': ['1'],
  '/add-employee': ['2'],
  '/bank': ['3'],
  '/Administrative': ['4'],
  '/close': ['17'],
  '/close-history': ['16'],
  // ... más rutas
}
```

---

## 🗄️ Base de Datos Firebase

### Colecciones Principales

#### 1. `employee`
```javascript
{
  id: "documento_id",
  fullName: "string",
  email: "string",
  salary: "string",
  idNumber: "string",
  contactNumber: "string",
  uid: "firebase_auth_uid",
  createdAt: "timestamp"
}
```

#### 2. `bankAccount`
```javascript
{
  id: "documento_id",
  accountName: "string",
  initialAmount: number
}
```

#### 3. `roomHistory`
```javascript
{
  id: "documento_id",
  date: Timestamp,
  roomNumber: "string",
  total: number,
  paymentMethod: "string",
  details: [
    {
      type: "serviceInfo | product",
      checkInTime: "string",
      checkOutTime: "string",
      selectedRate: number,
      description: "string",
      quantity: number,
      unitPrice: "string",
      subtotal: "string"
    }
  ]
}
```

#### 4. `administrativeExpenses`
```javascript
{
  id: "documento_id",
  date: Timestamp,
  concept: "string",
  value: "string",
  bank: "string",
  expenseType: "string"
}
```

#### 5. `close`
```javascript
{
  id: "documento_id",
  fecha: "string",
  turno: "Diurno | Nocturno | Completo",
  empleadoResponsable: "string",
  totalInicial: number,
  totalVentas: number,
  totalGastos: number,
  totalGeneral: number,
  fechaCreacion: Timestamp,
  saldosIniciales: {
    "account_id": number
  },
  ventasEfectivo: number,
  ventasTransferencia: number,
  ventasIncluidas: ["room_history_id"],
  gastosIncluidos: ["expense_id"]
}
```

#### 6. `products`
```javascript
{
  id: "documento_id",
  code: "string",
  productName: "string",
  quantity: number,
  unitSaleValue: "string",
  unitPurchaseValue: "string"
}
```

#### 7. `permissions_by_email`
```javascript
{
  id: "email_empleado",
  permissionIds: ["1", "2", "3"],
  email: "string",
  employeeId: "string",
  updatedAt: "timestamp"
}
```

#### 8. Subcolecciones
- `employee/{id}/permissions/user_permissions`: Permisos por empleado
- `roomHistory/{id}/details`: Detalles de servicios por habitación
- `miniBarPurchases/{id}/details`: Detalles de compras de minibar
- `toiletriesPurchase/{id}/details`: Detalles de compras de insumos

---

## ⚙️ Funcionalidades Principales

### 🔄 Sistema de Cierre de Caja con Aislamiento de Turnos

#### Problema Solucionado
El sistema previene que los datos de ventas y gastos del mismo día se repitan entre turnos consecutivos (6am-6pm y 6pm-6am).

#### Mecanismo de Aislamiento
1. **Consulta de Datos Procesados**: Antes de cargar ventas/gastos, consulta la colección `close` para obtener IDs ya procesados
2. **Filtrado Automático**: Excluye registros que ya fueron incluidos en cierres anteriores del día
3. **Registro de IDs**: Guarda los IDs de registros procesados en cada cierre para referencia futura

#### Flujo de Operación
```
1. Iniciar Turno → Capturar saldos bancarios actuales
2. Cargar Datos → Verificar registros ya procesados → Mostrar solo datos nuevos
3. Procesar Cierre → Guardar IDs de registros procesados → Finalizar turno
```

### 📊 Dashboard con Estadísticas
- Ventas del día/mes
- Gastos del día/mes
- Compras del día/mes
- Productos más vendidos
- Habitaciones más utilizadas
- Gráficos interactivos

### 🔍 Sistema de Búsqueda y Filtros
- Filtros por fecha en todos los módulos
- Búsqueda en tiempo real
- Filtros por estado, empleado, tipo, etc.
- Paginación automática

### 💱 Gestión de Moneda
- Formato automático de moneda colombiana (COP)
- Conversión de strings a números
- Validación de montos
- Cálculos automáticos

### 📱 Diseño Responsive
- Optimizado para desktop y móvil
- Menú hamburguesa en dispositivos móviles
- Tablas responsivas con scroll horizontal
- Componentes adaptables

---

## 🚀 Guía de Instalación

### Prerrequisitos
- Node.js 18 o superior
- npm o yarn
- Cuenta de Firebase
- Git

### Instalación Paso a Paso

#### 1. Clonar el Repositorio
```bash
git clone https://github.com/usuario/hotel-management.git
cd hotel-management
```

#### 2. Instalar Dependencias
```bash
npm install
```

#### 3. Configuración de Firebase
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Authentication (Email/Password)
3. Crear base de datos Firestore
4. Obtener credenciales de configuración

#### 4. Variables de Entorno
Crear archivo `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secret_key
```

#### 5. Ejecutar en Desarrollo
```bash
npm run dev
```

#### 6. Construir para Producción
```bash
npm run build
npm start
```

### Configuración Inicial de la Base de Datos

#### Crear Usuario Administrador Inicial
1. Registrar usuario en Firebase Authentication
2. Crear documento en colección `employee`:
```javascript
{
  fullName: "Administrador",
  email: "admin@hotel.com",
  uid: "firebase_uid_del_usuario"
}
```
3. Crear permisos en `permissions_by_email`:
```javascript
{
  email: "admin@hotel.com",
  permissionIds: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17"],
  employeeId: "employee_document_id"
}
```

---

## 👤 Guía de Usuario

### Inicio de Sesión
1. Acceder a la URL del sistema
2. Ingresar email y contraseña
3. El sistema redirige al dashboard según permisos

### Dashboard Principal
- **Vista General**: Estadísticas del día actual
- **Navegación**: Menú hamburguesa en la esquina superior izquierda
- **Accesos Rápidos**: Enlaces a módulos principales

### Gestión de Empleados
1. **Registrar**: Menú → "Lista de Empleados" → "Registrar Empleado"
2. **Editar**: Buscar empleado → Clic en ícono de edición
3. **Permisos**: Menú → "Permiso Especial" → Seleccionar empleado

### Operaciones de Habitaciones
1. **Ocupar Habitación**: Menú → "Habitaciones" → Seleccionar habitación → "Ocupar"
2. **Registrar Servicios**: Agregar productos/servicios → Calcular total
3. **Liberar Habitación**: Completar servicio → Seleccionar método de pago → "Liberar"

### Cierre de Caja
1. **Iniciar Turno**: Menú → "Cierre de Caja" → "Iniciar Turno"
2. **Monitorear**: El sistema carga automáticamente ventas y gastos
3. **Procesar Cierre**: Seleccionar empleado responsable → "Procesar Cierre"
4. **Ver Historial**: Menú → "Historial de Cierres"

### Gestión de Inventario
1. **Registrar Productos**: Menú → "Registrar Productos"
2. **Realizar Compras**: Menú → "Compras" → Seleccionar productos
3. **Ver Stock**: Menú → "Inventario"

### Reportes y Consultas
- **Historial de Servicios**: Ver todos los servicios por fecha
- **Historial de Gastos**: Consultar gastos administrativos
- **Lista de Préstamos**: Ver préstamos activos y completados
- **Historial de Cierres**: Consultar cierres realizados

---

## 🔧 Mantenimiento y Soporte

### Estructura de Logs
El sistema registra automáticamente:
- Errores de autenticación
- Operaciones de base de datos
- Cambios en permisos
- Cierres de caja
- Transacciones financieras

### Respaldos de Base de Datos
**Firebase Firestore** maneja automáticamente:
- Replicación multi-región
- Respaldos automáticos
- Recuperación ante desastres

### Monitoreo de Performance
- **Firebase Analytics**: Métricas de uso
- **Console Logs**: Debugging en desarrollo
- **Error Boundaries**: Manejo de errores en React

### Actualizaciones del Sistema
```bash
# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit

# Actualizar Next.js
npm install next@latest

# Actualizar Firebase
npm install firebase@latest
```

### Solución de Problemas Comunes

#### Error de Autenticación
```
Error: Firebase Auth user not found
Solución: Verificar que el usuario existe en Firebase Authentication
```

#### Error de Permisos
```
Error: Access denied to route
Solución: Verificar permisos en PermissionsManagement
```

#### Error de Base de Datos
```
Error: Firestore permission denied
Solución: Verificar reglas de seguridad de Firestore
```

#### Error de Cierre de Caja
```
Error: Datos duplicados entre turnos
Solución: El sistema automáticamente previene esto, verificar logs
```

### Contacto de Soporte
- **Desarrollador**: [Información de contacto]
- **Documentación Técnica**: [Enlace a documentación adicional]
- **Repositorio**: [Enlace al repositorio]

---

## 📝 Notas Adicionales

### Mejores Prácticas
1. **Respaldos Regulares**: Aunque Firebase maneja respaldos, mantener exportaciones periódicas
2. **Permisos Mínimos**: Asignar solo los permisos necesarios a cada empleado
3. **Monitoreo Regular**: Revisar logs y métricas de uso
4. **Actualizaciones**: Mantener dependencias actualizadas por seguridad

### Consideraciones de Seguridad
- Todas las contraseñas se almacenan hasheadas en Firebase
- Las sesiones tienen expiración automática
- El middleware valida permisos en cada petición
- Los datos sensibles están protegidos por reglas de Firestore

### Escalabilidad
El sistema está diseñado para:
- Múltiples usuarios concurrent
- Crecimiento de datos históricos
- Expansión de funcionalidades
- Integración con sistemas externos

---

**© 2025 Sistema de Gestión Hotelera - Todos los derechos reservados**

---

*Documento generado automáticamente desde el análisis del código fuente del proyecto.*
*Última actualización: Julio 25, 2025*
