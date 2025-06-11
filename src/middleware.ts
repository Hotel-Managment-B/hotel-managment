import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/add-employee/:path*',
    '/administrative/:path*',
    '/administrative-list/:path*',
    '/bank/:path*',
    '/employee-list/:path*',
    '/list-loans/:path*',
    '/loans/:path*',
    '/minibar-list/:path*',
    '/minibar-purchase/:path*',
    '/permissions-setup/:path*',
    '/product-list/:path*',
    '/products-mb/:path*',
    '/room-data/:path*',
    '/room-status/:path*',
    '/service-history/:path*',
    '/toiletries/:path*',
    '/toiletries-list/:path*',
    '/toiletries-spent/:path*'
  ]
}
