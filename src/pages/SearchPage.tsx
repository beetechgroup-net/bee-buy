import { useState, useMemo } from 'react';
import { usePurchases } from '../hooks/usePurchases';
import { Search, Store, Award, ReceiptText } from 'lucide-react';
import { format } from 'date-fns';

export function SearchPage() {
  const { purchases } = usePurchases();
  const [searchTerm, setSearchTerm] = useState('');

  // Extrair todos os itens de todas as compras em uma única lista
  const allProducts = useMemo(() => {
    return purchases.flatMap(purchase => 
      purchase.products.map(product => ({
        ...product,
        purchaseId: purchase.id,
        storeName: purchase.store.name,
        date: purchase.date,
      }))
    );
  }, [purchases]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    // Filtra por nome e ordena pela data mais recente (opcional, aqui decidimos ordenar por preço)
    return allProducts
      .filter(p => p.name.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allProducts, searchTerm]);

  const minPrice = useMemo(() => {
    if (filteredProducts.length === 0) return null;
    return Math.min(...filteredProducts.map(p => p.price));
  }, [filteredProducts]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-gray-800">Histórico de Preços</h2>
        <p className="text-sm text-gray-500">Busque um produto para comparar onde pagou mais barato.</p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none transition-shadow placeholder:text-gray-400 font-medium text-gray-800"
          placeholder="Ex: Arroz, Feijão, Leite..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {!searchTerm.trim() ? (
        <div className="flex flex-col items-center justify-center p-8 mt-4 text-center">
          <Search className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="text-gray-600 font-semibold">Qual produto você procura?</h3>
          <p className="text-gray-400 text-sm mt-1">Digite o nome acima para ver todas as vezes que o comprou.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <ReceiptText className="w-10 h-10 text-gray-300 mb-3" />
          <h3 className="text-gray-800 font-semibold">Produto não encontrado</h3>
          <p className="text-gray-500 text-sm mt-1">Nenhum registro de "{searchTerm}" nas suas notas fiscais salvas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase" style={{ whiteSpace: 'nowrap' }}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Produto / Local</th>
                  <th className="px-4 py-3 font-semibold text-right">Data</th>
                  <th className="px-4 py-3 font-semibold text-right">Unitário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p, idx) => {
                  const isCheapest = p.price === minPrice;
                  
                  return (
                    <tr 
                      key={`${p.purchaseId}-${idx}`} 
                      className={`hover:bg-gray-50 transition-colors ${
                        isCheapest ? 'bg-lime-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 max-w-[150px]">
                        <div className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Store className="w-3 h-3 shrink-0" />
                          <span className="truncate">{p.storeName}</span>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-right whitespace-nowrap text-xs">
                        <div className="text-gray-900 font-medium">
                          {format(new Date(p.date), "dd/MM/yy")}
                        </div>
                        <div className="text-gray-500 mt-1 flex justify-end items-center gap-1">
                           <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-gray-400">
                             {p.quantity} {p.unit}
                           </span>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-right whitespace-nowrap relative">
                        <div className={`font-bold ${isCheapest ? 'text-lime-700 text-base' : 'text-gray-900'}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                        </div>
                        
                        {isCheapest && (
                          <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-lime-600 mt-1 uppercase tracking-wider">
                            <Award className="w-3 h-3" />
                            Mais barato
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 p-3 text-center border-t border-gray-100 text-xs text-gray-500">
            Foram encontradas {filteredProducts.length} ocorrências desse produto.
          </div>
        </div>
      )}
    </div>
  );
}
