import { useState, useMemo } from 'react';
import { usePurchases } from '../hooks/usePurchases';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Store, 
  Tag, 
  DollarSign,
  Calendar,
  ArrowUpRight,
  ShoppingBag
} from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Dashboard() {
  const { purchases, loading } = usePurchases();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthPurchases = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return purchases.filter(p => {
      const pDate = new Date(p.date);
      return isWithinInterval(pDate, { start, end });
    });
  }, [purchases, currentDate]);

  const totalSpent = monthPurchases.reduce((sum, p) => sum + p.total, 0);

  const categoryBreakdown = useMemo(() => {
    const stats: Record<string, number> = {};
    monthPurchases.forEach(p => {
      stats[p.category] = (stats[p.category] || 0) + p.total;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [monthPurchases]);

  const storeBreakdown = useMemo(() => {
    const stats: Record<string, { total: number, count: number }> = {};
    monthPurchases.forEach(p => {
      const name = p.store.name;
      if (!stats[name]) stats[name] = { total: 0, count: 0 };
      stats[name].total += p.total;
      stats[name].count += 1;
    });
    return Object.entries(stats).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  }, [monthPurchases]);

  const topItems = useMemo(() => {
    const allItems = monthPurchases.flatMap(p => p.products.map(item => ({ ...item, store: p.store.name })));
    return allItems.sort((a, b) => b.price - a.price).slice(0, 3);
  }, [monthPurchases]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentDate(prev => subMonths(prev, 1));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <button 
          onClick={prevMonth}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-amber-600"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-0.5">Mês de Referência</span>
          <h2 className="text-xl font-black text-slate-800 capitalize">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>

        <button 
          onClick={nextMonth}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-amber-600"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Main Totals */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-[2.5rem] shadow-xl shadow-amber-200 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-110 duration-700">
            <DollarSign className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">Total Gasto no Mês</span>
            </div>
            <h3 className="text-4xl font-black">{formatCurrency(totalSpent)}</h3>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium bg-black/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
              <Calendar className="w-4 h-4" />
              {monthPurchases.length} notas processadas
            </div>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-pink-50 p-2 rounded-xl text-pink-600">
            <Tag className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Por Categoria</h3>
        </div>

        {categoryBreakdown.length === 0 ? (
          <p className="text-center py-6 text-gray-400 text-sm italic">Sem compras neste período</p>
        ) : (
          <div className="flex flex-col gap-5">
            {categoryBreakdown.map(([cat, total]) => (
              <div key={cat} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-700">{cat}</span>
                  <span className="text-sm font-black text-amber-600">{formatCurrency(total)}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(total / totalSpent) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Establishments */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Maiores Gastos por Local</h3>
          </div>

          <div className="flex flex-col gap-4">
            {storeBreakdown.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm italic">Sem registros</p>
            ) : (
              storeBreakdown.map(([name, stats]) => (
                <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 line-clamp-1">{name}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">{stats.count} {stats.count === 1 ? 'visita' : 'visitas'}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{formatCurrency(stats.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top 3 Expensive Items */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Top 3 Itens Mais Caros</h3>
          </div>

          <div className="flex flex-col gap-3">
            {topItems.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm italic">Sem itens registrados</p>
            ) : (
              topItems.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl relative overflow-hidden group">
                  <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-amber-600 shadow-sm z-10">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 z-10">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{item.store}</p>
                  </div>
                  <div className="text-right z-10">
                    <p className="text-sm font-black text-slate-900">{formatCurrency(item.price)}</p>
                    <p className="text-[10px] text-amber-600 font-bold">Un: {item.unit}</p>
                  </div>
                  <ArrowUpRight className="absolute -right-2 -bottom-2 w-12 h-12 text-black/5 transition-transform group-hover:scale-125 duration-500" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
