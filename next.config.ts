/** @type {import('next').NextConfig} */
const nextConfig =  {

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
      }
    ];
  },
};

module.exports = nextConfig;