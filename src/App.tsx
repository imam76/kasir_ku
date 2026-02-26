import { useState } from 'react';
import { Package, ShoppingCart, History } from 'lucide-react';
import StockManagement from './components/StockManagement';
import Transaction from './components/Transaction';
import TransactionHistory from './components/History';

type View = 'stock' | 'transaction' | 'history';

function App() {
  const [currentView, setCurrentView] = useState<View>('transaction');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-800">Aplikasi Kasir POS</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('stock')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${currentView === 'stock'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Package size={20} />
                Stok
              </button>
              <button
                onClick={() => setCurrentView('transaction')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${currentView === 'transaction'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <ShoppingCart size={20} />
                Transaksi
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${currentView === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <History size={20} />
                Riwayat
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        {currentView === 'stock' && <StockManagement />}
        {currentView === 'transaction' && <Transaction />}
        {currentView === 'history' && <TransactionHistory />}
      </main>
    </div>
  );
}

export default App;
