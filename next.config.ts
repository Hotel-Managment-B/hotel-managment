/** @type {import('next').NextConfig} */
const nextConfig =  {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  async rewrites() {
    return [
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_INIT_ROUTE || '/inicio',
        destination: '/dashboard',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_P || '/registrar',
        destination: '/products-mb',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_S || '/registrar-empleados',
        destination: '/add-employee',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_X || '/bancos',
        destination: '/bank',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_W || '/lista-empleados',
        destination: '/employee-list',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_C || '/compras',
        destination: '/minibar-list',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_I || '/inventario',
        destination: '/product-list',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_H || '/habitaciones',
        destination: '/room-data',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_G || '/gastos',
        destination: '/Administrative',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_L || '/historial-gastos',
        destination: '/administrative-list',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_T || '/insumos',
        destination: '/toiletries-spent',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_Z || '/historial-servicios',
        destination: '/service-history',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_N || '/prestamos-empleados',
        destination: '/loans',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_O || '/prestamos-empleados-lista',
        destination: '/list-loans',
      },
      {
        source: process.env.NEXT_PUBLIC_CUSTOM_ROUTE_Y || '/permisos',
        destination: '/permissions',
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/add-employee',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/bank',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/employee-list',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/products-mb',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/minibar-list',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/product-list',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/room-data',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/Administrative',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/administrative-list',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/toiletries-spent',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/service-history',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/loans',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/list-loans',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/permissions',
        destination: '/404',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;