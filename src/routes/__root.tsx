import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Package, ShoppingCart, History } from 'lucide-react'

const RootLayout = () => {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-800">Aplikasi Kasir POS</h1>
            <div className="flex gap-2">
              <Link
                to="/stock"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive('/stock')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Package size={20} />
                Stok
              </Link>
              <Link
                to="/transaction"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive('/transaction')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <ShoppingCart size={20} />
                Transaksi
              </Link>
              <Link
                to="/history"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive('/history')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <History size={20} />
                Riwayat
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>

      <TanStackRouterDevtools />
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })