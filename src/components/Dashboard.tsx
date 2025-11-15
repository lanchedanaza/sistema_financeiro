import { DollarSign, FileText, Calendar, TrendingUp, History, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export default function Dashboard({ onNavigate, onLogout }: DashboardProps) {
  const [receivedToday, setReceivedToday] = useState(0);
  const [debtToday, setDebtToday] = useState(0);
  const [reservationsToday, setReservationsToday] = useState(0);
  const [totalSoldToday, setTotalSoldToday] = useState(0);

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
      .gte('created_at', todayISO);

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
            className="bg-green-500 hover:bg-green-600 text-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl transform transition hover:scale-105 active:scale-95"
          >
            <DollarSign className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-4" strokeWidth={2.5} />
            <p className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">R$ {receivedToday.toFixed(2)}</p>
            <p className="text-lg md:text-xl font-semibold">Recebido Hoje</p>
          </button>

          <button
            onClick={() => onNavigate('debtSale')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl transform transition hover:scale-105 active:scale-95"
          >
            <FileText className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-4" strokeWidth={2.5} />
            <p className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">R$ {debtToday.toFixed(2)}</p>
            <p className="text-lg md:text-xl font-semibold">Fiado Hoje</p>
          </button>

          <button
            onClick={() => onNavigate('reservations')}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl transform transition hover:scale-105 active:scale-95"
          >
            <Calendar className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-4" strokeWidth={2.5} />
            <p className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{reservationsToday}</p>
            <p className="text-lg md:text-xl font-semibold">Reservas do Dia</p>
          </button>

          <button
            onClick={() => onNavigate('sales')}
            className="bg-slate-700 hover:bg-slate-800 text-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl transform transition hover:scale-105 active:scale-95"
          >
            <TrendingUp className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-4" strokeWidth={2.5} />
            <p className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">R$ {totalSoldToday.toFixed(2)}</p>
            <p className="text-lg md:text-xl font-semibold">Total Vendido</p>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <button
            onClick={() => onNavigate('products')}
            className="bg-slate-600 hover:bg-slate-700 text-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xl transform transition hover:scale-105 active:scale-95 text-xl md:text-2xl font-semibold"
          >
            Gerenciar Produtos
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xl transform transition hover:scale-105 active:scale-95 flex items-center justify-center gap-3 md:gap-4"
          >
            <History className="w-8 h-8 md:w-10 md:h-10" strokeWidth={2.5} />
            <span className="text-xl md:text-2xl font-semibold">Histórico Completo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
