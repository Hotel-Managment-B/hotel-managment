import { withAuth } from "next-auth/middleware"
import { NextRequestWithAuth } from "next-auth/middleware"

// Route to permission mapping
const routePermissions: Record<string, string[]> = {
  '/dashboard': ['1'], // Inicio
  '/inicio': ['1'], // Inicio (rewrite route)
  
  // Employee management
  '/add-employee': ['2'], // Lista de Empleados (includes adding)
  '/registrar-empleados': ['2'], // Lista de Empleados (rewrite route)
  '/employee-list': ['2'], // Lista de Empleados
  '/lista-empleados': ['2'], // Lista de Empleados (rewrite route)
  
  // Financial management
  '/bank': ['3'], // Cuentas Bancarias
  '/bancos': ['3'], // Cuentas Bancarias (rewrite route)
  '/Administrative': ['4'], // Gastos
  '/gastos': ['4'], // Gastos (rewrite route)
  '/administrative-list': ['5'], // Historial de Gastos
  '/historial-gastos': ['5'], // Historial de Gastos (rewrite route)
  '/close-history': ['16'], // Historial de Cierres
  '/historial-cierres': ['16'], // Historial de Cierres (rewrite route)
  '/close': ['17'], // Cierre de Caja
  '/cierre': ['17'], // Cierre de Caja (rewrite route)
  '/loans': ['6'], // Préstamos
  '/prestamos-empleados': ['6'], // Préstamos (rewrite route)
  '/list-loans': ['7'], // Lista de Préstamos
  '/prestamos-empleados-lista': ['7'], // Lista de Préstamos (rewrite route)
  
  // Inventory management
  '/products-mb': ['8'], // Registrar Productos
  '/registrar': ['8'], // Registrar Productos (rewrite route)
  '/minibar-purchase': ['9'], // Compras Productos
  '/minibar-list': ['9'], // Compras Productos (minibar purchases)
  '/compras': ['9'], // Compras Productos (rewrite route)
  '/product-list': ['10'], // Inventario
  '/inventario': ['10'], // Inventario (rewrite route)
  
  // Room management
  '/room-data': ['11'], // Habitaciones
  '/habitaciones': ['11'], // Habitaciones (rewrite route)
  '/room-status': ['11'], // Habitaciones (room status)
  '/toiletries': ['12'], // Insumos Habitaciones
  '/toiletries-list': ['12'], // Insumos Habitaciones (list)
  '/toiletries-spent': ['12'], // Insumos Habitaciones (spent)
  '/insumos': ['12'], // Insumos Habitaciones (rewrite route)
  '/service-history': ['13'], // Historial de Servicios
  '/historial-servicios': ['13'], // Historial de Servicios (rewrite route)
  
  // Special permissions
  '/permissions': ['14'], // Permiso Especial
  '/permissions-setup': ['14'], // Permiso Especial
  '/invoice': ['15'], // Editor de Factura
  '/factura': ['15'], // Editor de Factura (rewrite route)
}

// Helper function to check if user has required permissions for a route
function hasRequiredPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

// Helper function to get the base route from a path
function getBaseRoute(pathname: string): string {
  // Remove query parameters and fragments
  const cleanPath = pathname.split('?')[0].split('#')[0];
  
  // Check for exact matches first
  if (routePermissions[cleanPath]) {
    return cleanPath;
  }
  
  // Check for dynamic routes (remove path segments after the base)
  const segments = cleanPath.split('/').filter(Boolean);
  for (let i = segments.length; i > 0; i--) {
    const testPath = '/' + segments.slice(0, i).join('/');
    if (routePermissions[testPath]) {
      return testPath;
    }
  }
  
  return cleanPath;
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const permissionIds = req.nextauth.token?.permissionsIds || [];
    const pathname = req.nextUrl.pathname;
    
    // Get the base route that matches our permission mapping
    const baseRoute = getBaseRoute(pathname);
    console.log('Base route:', baseRoute);
    const requiredPermissions = routePermissions[baseRoute];
    
    // If the route doesn't require specific permissions, allow access
    if (!requiredPermissions) {
      return;
    }
    
    // Check if user has the required permissions
    if (!hasRequiredPermissions(permissionIds, requiredPermissions)) {
      // Redirect to access denied page
      const url = req.nextUrl.clone();
      url.pathname = '/access-denied';
      return Response.redirect(url);
    }
    
    // User has required permissions, continue
    return;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    // Protected routes - original paths
    '/dashboard/:path*',
    '/add-employee/:path*',
    '/administrative/:path*',
    '/administrative-list/:path*',
    '/close-history/:path*',
    '/close/:path*',
    '/bank/:path*',
    '/employee-list/:path*',
    '/list-loans/:path*',
    '/loans/:path*',
    '/minibar-list/:path*',
    '/minibar-purchase/:path*',
    '/permissions/:path*',
    '/permissions-setup/:path*',
    '/product-list/:path*',
    '/products-mb/:path*',
    '/room-data/:path*',
    '/room-status/:path*',
    '/service-history/:path*',
    '/toiletries/:path*',
    '/toiletries-list/:path*',
    '/toiletries-spent/:path*',
    '/invoice/:path*',
    
    // Protected routes - rewrite paths (from next.config.ts)
    '/inicio/:path*',
    '/registrar/:path*',
    '/registrar-empleados/:path*',
    '/bancos/:path*',
    '/lista-empleados/:path*',
    '/compras/:path*',
    '/inventario/:path*',
    '/habitaciones/:path*',
    '/gastos/:path*',
    '/historial-gastos/:path*',
    '/historial-cierres/:path*',
    '/cierre/:path*',
    '/insumos/:path*',
    '/historial-servicios/:path*',
    '/prestamos-empleados/:path*',
    '/prestamos-empleados-lista/:path*',
    '/factura/:path*',
  ]
}
