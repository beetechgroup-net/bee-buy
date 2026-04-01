import { usePurchases } from '../hooks/usePurchases';
import { Link } from 'react-router-dom';
import { Store, Calendar, ArrowRight, ReceiptText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Home() {
  const { purchases, loading, clearAll } = usePurchases();

  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja apagar TODAS as suas notas fiscais? Esta ação não pode ser desfeita.')) {
      clearAll();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-gray-800">Minhas Compras</h2>
          <p className="text-sm text-gray-500">Acompanhe seus gastos via NFC-e</p>
        </div>
        
        {purchases.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-full transition-all shadow-sm"
            title="Limpar Histórico"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm gap-4 text-center">
          <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center">
            <ReceiptText className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold mb-1">Nenhuma compra listada</h3>
            <p className="text-gray-500 text-sm">Escaneie um QR Code de Nota Fiscal para começar a organizar seus gastos.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-4">
          {purchases.map(purchase => (
            <Link 
              to={`/purchase/${purchase.id}`} 
              key={purchase.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group"
            >
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{purchase.store.name}</h3>
                  <span className="font-bold text-slate-900 ml-2">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(purchase.total)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(purchase.date), "dd 'de' MMM", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    {purchase.category}
                  </span>
                </div>
              </div>
              
              <div className="text-gray-300 group-hover:text-amber-600 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
