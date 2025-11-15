import { DollarSign, FileText, Calendar, TrendingUp, History, LogOut, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sale } from '../types';

interface DashboardProps {
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

interface SaleSummary {
  product_name: string;
  total_quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method?: string;
}

export default function Dashboard({ onNavigate, onLogout }: DashboardProps) {
  const [receivedToday, setReceivedToday] = useState(0);
  const [debtToday, setDebtToday] = useState(0);
  const [reservationsToday, setReservationsToday] = useState(0);
  const [totalSoldToday, setTotalSoldToday] = useState(0);
  const [showTotalSoldModal, setShowTotalSoldModal] = useState(false);
  const [salesSummary, setSalesSummary] = useState<SaleSummary[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', todayISO)
      .order('created_at', { ascending: false });

    if (sales) {
      const received = sales
        .filter(s => s.paid)
        .reduce((sum, s) => sum + Number(s.total_price), 0);

      const debt = sales
        .filter(s => !s.paid)
        .reduce((sum, s) => sum + Number(s.total_price), 0);

      const total = sales.reduce((sum, s) => sum + Number(s.total_price), 0);

      setReceivedToday(received);
      setDebtToday(debt);
      setTotalSoldToday(total);

      // Agrupar vendas por produto
      const summaryMap = new Map<string, SaleSummary>();
      
      sales.forEach((sale: Sale) => {
        const key = sale.product_name;
        if (summaryMap.has(key)) {
          const existing = summaryMap.get(key)!;
          existing.total_quantity += sale.quantity;
          existing.total_amount += Number(sale.total_price);
        } else {
          summaryMap.set(key, {
            product_name: sale.product_name,
            total_quantity: sale.quantity,
            unit_price: Number(sale.unit_price),
            total_amount: Number(sale.total_price),
            payment_method: sale.payment_method,
          });
        }
      });

      setSalesSummary(Array.from(summaryMap.values()));
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: reservations } = await supabase
      .from('reservations')
      .select('*')
      .gte('scheduled_date', todayISO)
      .lt('scheduled_date', tomorrow.toISOString())
      .eq('status', 'pending');

    setReservationsToday(reservations?.length || 0);
  };

  const handleTotalSoldClick = () => {
    loadDashboardData();
    setShowTotalSoldModal(true);
  };

  const userEmail = localStorage.getItem('user_email') || 'Usuário';
  const username = userEmail.split('@')[0]; // Pega a parte antes do @

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="text-left">
            <p className="text-lg md:text-xl text-slate-600">Olá, <span className="font-bold text-slate-800">{username}</span></p>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-4 md:px-6 py-2 md:py-3 flex items-center gap-2 transition transform hover:scale-105 shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-base md:text-lg">Sair</span>
          </button>
        </div>
        
        <div className="mb-6 md:mb-8 text-center">
          <img 
            src="/logos/logo01.png" 
            alt="Vida Cantina" 
            className="mx-auto max-w-full h-auto max-h-32 sm:max-h-40 md:max-h-48 lg:max-h-64 xl:max-h-80 object-contain"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <button
            onClick={() => onNavigate('sales')}
            className="bg-green-500 hover:bg-green-600 text-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl transform transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:shadow-green-500/50 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <DollarSign className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 transition-transform duration-300 hover:scale-110" strokeWidth={2.5} />
            <p className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">R$ {receivedToday.toFixed(2)}</p>
            <p className="text-lg md:text-xl font-semibold">Recebido Hoje</p>
          </button>

          <button
            onClick={() => onNavigate('debtSale')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl transform transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:shadow-yellow-500/50 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <FileText className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 transition-transform duration-300 hover:scale-110" strokeWidth={2.5} />
            <p className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">R$ {debtToday.toFixed(2)}</p>
            <p className="text-lg md:text-xl font-semibold">Fiado Hoje</p>
          </button>

          <button
            onClick={() => onNavigate('reservations')}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl transform transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:shadow-blue-500/50 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <Calendar className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 transition-transform duration-300 hover:scale-110" strokeWidth={2.5} />
            <p className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{reservationsToday}</p>
            <p className="text-lg md:text-xl font-semibold">Reservas do Dia</p>
          </button>

          <button
            onClick={handleTotalSoldClick}
            className="bg-slate-700 hover:bg-slate-800 text-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl transform transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:shadow-slate-500/50 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <TrendingUp className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 transition-transform duration-300 hover:scale-110" strokeWidth={2.5} />
            <p className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">R$ {totalSoldToday.toFixed(2)}</p>
            <p className="text-lg md:text-xl font-semibold">Total Vendido</p>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <button
            onClick={() => onNavigate('products')}
            className="bg-slate-600 hover:bg-slate-700 text-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xl transform transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:shadow-slate-500/50 text-xl md:text-2xl font-semibold animate-fade-in-up"
            style={{ animationDelay: '0.5s' }}
          >
            Gerenciar Produtos
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xl transform transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:shadow-purple-500/50 flex items-center justify-center gap-3 md:gap-4 animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            <History className="w-8 h-8 md:w-10 md:h-10 transition-transform duration-300 hover:scale-110" strokeWidth={2.5} />
            <span className="text-xl md:text-2xl font-semibold">Histórico Completo</span>
          </button>
        </div>
      </div>

      {/* Modal de Resumo de Vendas do Dia */}
      {showTotalSoldModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-3 md:p-4 z-50 animate-modal-backdrop"
          onClick={() => setShowTotalSoldModal(false)}
        >
          <div 
            className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 max-w-2xl w-full mx-2 shadow-2xl max-h-[95vh] overflow-y-auto animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800">
                Resumo de Vendas - Hoje
              </h2>
              <button
                onClick={() => setShowTotalSoldModal(false)}
                className="text-slate-500 hover:text-slate-700 transition"
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </button>
            </div>

            {salesSummary.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <p className="text-base sm:text-lg md:text-xl text-slate-500">
                  Nenhuma venda realizada hoje
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-4 sm:mb-5 md:mb-6 max-h-[50vh] overflow-y-auto">
                  {salesSummary.map((item, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border-2 border-slate-200 animate-fade-in-up card-hover"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 mb-1 truncate">
                            {item.product_name}
                          </h3>
                          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-slate-600">
                            <span>Qtd: {item.total_quantity}</span>
                            <span>•</span>
                            <span>Unit: R$ {item.unit_price.toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600 flex-shrink-0 ml-2">
                          R$ {item.total_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t-4 border-slate-300 pt-3 sm:pt-4 md:pt-5">
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800">
                      Total do Dia:
                    </span>
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600">
                      R$ {totalSoldToday.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-sm sm:text-base md:text-lg">
                    <div className="bg-green-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <p className="text-slate-600 mb-1">Recebido:</p>
                      <p className="text-green-600 font-bold">R$ {receivedToday.toFixed(2)}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <p className="text-slate-600 mb-1">Fiado:</p>
                      <p className="text-yellow-600 font-bold">R$ {debtToday.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowTotalSoldModal(false)}
                  className="w-full mt-4 sm:mt-5 md:mt-6 bg-slate-300 hover:bg-slate-400 active:bg-slate-500 text-slate-800 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 text-sm sm:text-base md:text-lg lg:text-xl font-semibold transition transform active:scale-95"
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
