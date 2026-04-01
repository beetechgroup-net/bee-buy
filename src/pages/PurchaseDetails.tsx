import { useParams, useNavigate } from 'react-router-dom';
import { usePurchases } from '../hooks/usePurchases';
import { ArrowLeft, MapPin, Receipt, ExternalLink, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Category } from '../types';

export function PurchaseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { purchases, updatePurchase, removePurchase } = usePurchases();

  const purchase = purchases.find((p) => p.id === id);

  if (!purchase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <Receipt className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Compra não encontrada</h2>
        <p className="text-gray-500 text-sm mt-2">Esta nota pode ter sido excluída ou não existe.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-6 bg-lime-600 text-white font-medium py-2 px-6 rounded-full hover:bg-lime-700 transition"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePurchase({ ...purchase, category: e.target.value as Category });
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta nota fiscal do histórico?')) {
      removePurchase(purchase.id);
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Detalhes da Compra</h2>
        <button 
          onClick={handleDelete}
          className="p-2 -mr-2 rounded-full hover:bg-red-50 text-red-500 transition"
          title="Excluir Compra"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Store Info Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-lime-400 to-emerald-500"></div>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{purchase.store.name}</h1>
        <p className="text-sm text-gray-500 mt-1">CNPJ: {purchase.store.cnpj}</p>
        
        {purchase.store.address && (
          <div className="flex items-start gap-2 mt-4 text-sm text-gray-600">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-lime-600" />
            <span className="leading-snug">{purchase.store.address}</span>
          </div>
        )}
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Data
          </div>
          <div className="font-semibold text-gray-900">
            {format(new Date(purchase.date), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Categoria</div>
          <select 
            className="w-full bg-transparent font-semibold text-lime-700 outline-none cursor-pointer appearance-none"
            value={purchase.category}
            onChange={handleCategoryChange}
          >
            <option value="Mercado">Mercado</option>
            <option value="Restaurante">Restaurante</option>
            <option value="Farmácia">Farmácia</option>
            <option value="Padaria">Padaria</option>
            <option value="Posto de Combustível">Posto de Combustível</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-semibold text-gray-800">Itens da Nota</h3>
          <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
            {purchase.products.length} itens
          </span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {purchase.products.length > 0 ? (
            purchase.products.map(product => (
              <div key={product.id} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors">
                <div className="bg-gray-100 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-gray-400 text-xs">
                  {product.quantity}x
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-sm font-semibold text-gray-800 leading-tight">{product.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {product.unit} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)} un
                  </p>
                </div>
                <div className="font-bold text-gray-900 self-center">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price * product.quantity)}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              <p>Os itens detalhados não puderam ser extraídos da nota.</p>
            </div>
          )}
        </div>

        {/* Total Footer */}
        <div className="p-5 bg-lime-50 border-t border-lime-100 flex justify-between items-end">
          <span className="text-lime-800 font-medium">Total</span>
          <span className="text-3xl font-black text-lime-900 tracking-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(purchase.total)}
          </span>
        </div>
      </div>

      {purchase.qrCodeUrl && (
        <a 
          href={purchase.qrCodeUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition shadow-sm"
        >
          <ExternalLink className="w-4 h-4" />
          Ver Nota Original na SEFAZ
        </a>
      )}
    </div>
  );
}
