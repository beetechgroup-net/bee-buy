import { ReactNode } from 'react';
import { ShoppingBasket, QrCode, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col font-sans text-gray-900 pb-20">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-center sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-bold flex items-center gap-2 text-lime-600">
          <ShoppingBasket className="w-6 h-6" /> Bee Buy
        </h1>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto p-4 flex flex-col gap-4">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe-area">
        <div className="flex justify-around max-w-lg mx-auto relative px-4">
          <Link 
            to="/" 
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${location.pathname === '/' ? 'text-lime-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ShoppingBasket className="w-6 h-6" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Compras</span>
          </Link>
          
          <div className="flex-1 flex justify-center">
            <Link 
              to="/scan" 
              className="absolute -top-6 flex flex-col items-center justify-center group"
            >
              <div className={`p-4 rounded-full shadow-lg text-white transition-transform group-hover:scale-105 active:scale-95 ${location.pathname === '/scan' ? 'bg-lime-700 ring-4 ring-lime-100' : 'bg-lime-500'}`}>
                 <QrCode className="w-7 h-7" />
              </div>
            </Link>
          </div>

          <Link 
            to="/search" 
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${location.pathname === '/search' ? 'text-lime-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Buscar</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
