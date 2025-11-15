import { ArrowLeft, Download, Calendar, Filter, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sale, Debt, Reservation } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface HistoryViewProps {
  onBack: () => void;
}

type HistoryItem = {
  type: 'sale' | 'debt' | 'reservation';
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  details?: string;
};

export default function HistoryView({ onBack }: HistoryViewProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'debt' | 'reservation'>('all');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startCalendarMonth, setStartCalendarMonth] = useState(new Date().getMonth());
  const [startCalendarYear, setStartCalendarYear] = useState(new Date().getFullYear());
  const [endCalendarMonth, setEndCalendarMonth] = useState(new Date().getMonth());
  const [endCalendarYear, setEndCalendarYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayStr = firstDay.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    setStartDate(firstDayStr);
    setEndDate(todayStr);
    
    // Inicializar calendários
    setStartCalendarMonth(firstDay.getMonth());
    setStartCalendarYear(firstDay.getFullYear());
    setEndCalendarMonth(today.getMonth());
    setEndCalendarYear(today.getFullYear());
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadHistory();
    }
  }, [startDate, endDate, filterType]);

  // Funções do calendário
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  };

  const handleStartDateSelect = (day: number) => {
    const selectedDate = new Date(startCalendarYear, startCalendarMonth, day);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setStartDate(formattedDate);
    setShowStartCalendar(false);
  };

  const handleEndDateSelect = (day: number) => {
    const selectedDate = new Date(endCalendarYear, endCalendarMonth, day);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setEndDate(formattedDate);
    setShowEndCalendar(false);
  };

  const navigateStartMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (startCalendarMonth === 0) {
        setStartCalendarMonth(11);
        setStartCalendarYear(startCalendarYear - 1);
      } else {
        setStartCalendarMonth(startCalendarMonth - 1);
      }
    } else {
      if (startCalendarMonth === 11) {
        setStartCalendarMonth(0);
        setStartCalendarYear(startCalendarYear + 1);
      } else {
        setStartCalendarMonth(startCalendarMonth + 1);
      }
    }
  };

  const navigateEndMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (endCalendarMonth === 0) {
        setEndCalendarMonth(11);
        setEndCalendarYear(endCalendarYear - 1);
      } else {
        setEndCalendarMonth(endCalendarMonth - 1);
      }
    } else {
      if (endCalendarMonth === 11) {
        setEndCalendarMonth(0);
        setEndCalendarYear(endCalendarYear + 1);
      } else {
        setEndCalendarMonth(endCalendarMonth + 1);
      }
    }
  };

  const renderStartCalendar = () => {
    const daysInMonth = getDaysInMonth(startCalendarMonth, startCalendarYear);
    const firstDay = getFirstDayOfMonth(startCalendarMonth, startCalendarYear);
    const days = [];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const selectedDateObj = startDate ? new Date(startDate) : null;

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return (
      <>
        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-8">
          <button
            onClick={() => navigateStartMonth('prev')}
            className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-4 transition transform active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-4xl font-bold text-slate-800 text-center px-1 sm:px-2">
            {getMonthName(startCalendarMonth)} {startCalendarYear}
          </h2>
          <button
            onClick={() => navigateStartMonth('next')}
            className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-4 transition transform active:scale-95"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-3 mb-1 sm:mb-2 md:mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl font-bold text-slate-600 py-1 sm:py-1.5 md:py-2 lg:py-3">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-3 mb-2 sm:mb-3 md:mb-4 lg:mb-6">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-8 sm:h-9 md:h-10 lg:h-12 xl:h-16"></div>;
            }

            const isToday =
              day === today.getDate() &&
              startCalendarMonth === today.getMonth() &&
              startCalendarYear === today.getFullYear();

            const isSelected =
              selectedDateObj &&
              day === selectedDateObj.getDate() &&
              startCalendarMonth === selectedDateObj.getMonth() &&
              startCalendarYear === selectedDateObj.getFullYear();

            return (
              <button
                key={index}
                onClick={() => handleStartDateSelect(day)}
                className={`h-8 sm:h-9 md:h-10 lg:h-12 xl:h-16 rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl font-bold transition transform active:scale-95 ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : isToday
                    ? 'bg-yellow-200 text-slate-800 border-2 md:border-4 border-yellow-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => {
              const today = new Date();
              setStartCalendarMonth(today.getMonth());
              setStartCalendarYear(today.getFullYear());
              handleStartDateSelect(today.getDate());
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold transition transform active:scale-95"
          >
            Hoje
          </button>
          <button
            onClick={() => setShowStartCalendar(false)}
            className="flex-1 bg-slate-300 hover:bg-slate-400 active:bg-slate-500 text-slate-800 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold transition transform active:scale-95"
          >
            Fechar
          </button>
        </div>
      </>
    );
  };

  const renderEndCalendar = () => {
    const daysInMonth = getDaysInMonth(endCalendarMonth, endCalendarYear);
    const firstDay = getFirstDayOfMonth(endCalendarMonth, endCalendarYear);
    const days = [];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const selectedDateObj = endDate ? new Date(endDate) : null;

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return (
      <>
        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-8">
          <button
            onClick={() => navigateEndMonth('prev')}
            className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-4 transition transform active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-4xl font-bold text-slate-800 text-center px-1 sm:px-2">
            {getMonthName(endCalendarMonth)} {endCalendarYear}
          </h2>
          <button
            onClick={() => navigateEndMonth('next')}
            className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-4 transition transform active:scale-95"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-3 mb-1 sm:mb-2 md:mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl font-bold text-slate-600 py-1 sm:py-1.5 md:py-2 lg:py-3">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-3 mb-2 sm:mb-3 md:mb-4 lg:mb-6">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-8 sm:h-9 md:h-10 lg:h-12 xl:h-16"></div>;
            }

            const isToday =
              day === today.getDate() &&
              endCalendarMonth === today.getMonth() &&
              endCalendarYear === today.getFullYear();

            const isSelected =
              selectedDateObj &&
              day === selectedDateObj.getDate() &&
              endCalendarMonth === selectedDateObj.getMonth() &&
              endCalendarYear === selectedDateObj.getFullYear();

            return (
              <button
                key={index}
                onClick={() => handleEndDateSelect(day)}
                className={`h-8 sm:h-9 md:h-10 lg:h-12 xl:h-16 rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl font-bold transition transform active:scale-95 ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : isToday
                    ? 'bg-yellow-200 text-slate-800 border-2 md:border-4 border-yellow-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => {
              const today = new Date();
              setEndCalendarMonth(today.getMonth());
              setEndCalendarYear(today.getFullYear());
              handleEndDateSelect(today.getDate());
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold transition transform active:scale-95"
          >
            Hoje
          </button>
          <button
            onClick={() => setShowEndCalendar(false)}
            className="flex-1 bg-slate-300 hover:bg-slate-400 active:bg-slate-500 text-slate-800 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold transition transform active:scale-95"
          >
            Fechar
          </button>
        </div>
      </>
    );
  };

  const loadHistory = async () => {
    setLoading(true);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const historyItems: HistoryItem[] = [];

    // Carregar vendas
    if (filterType === 'all' || filterType === 'sale') {
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (sales) {
        // Buscar nomes dos clientes
        const clientIds = [...new Set(sales.map((s: Sale) => s.client_id).filter(Boolean))];
        let clientMap = new Map();
        
        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from('clients')
            .select('id, name')
            .in('id', clientIds);
          
          clientMap = new Map(clients?.map(c => [c.id, c.name]) || []);
        }

        sales.forEach((sale: Sale) => {
          const clientName = sale.client_id ? clientMap.get(sale.client_id) : null;
          const paymentMethodMap: Record<string, string> = {
            dinheiro: '💵 Dinheiro',
            pix: '📱 PIX',
            cartao_debito: '💳 Débito',
            cartao_credito: '💳 Crédito',
            fiado: '📝 Fiado',
          };
          const paymentMethodText = sale.payment_method ? paymentMethodMap[sale.payment_method] || sale.payment_method : '';
          const detailsParts = [
            clientName,
            `R$ ${Number(sale.unit_price).toFixed(2)} cada`,
            paymentMethodText
          ].filter(Boolean);
          
          historyItems.push({
            type: 'sale',
            id: sale.id,
            date: sale.created_at,
            description: `${sale.quantity}x ${sale.product_name}`,
            amount: Number(sale.total_price),
            status: sale.paid ? 'Pago' : 'Fiado',
            details: detailsParts.join(' - '),
          });
        });
      }
    }

    // Carregar dívidas
    if (filterType === 'all' || filterType === 'debt') {
      const { data: debts } = await supabase
        .from('debts')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (debts) {
        // Buscar nomes dos clientes
        const clientIds = [...new Set(debts.map((d: Debt) => d.client_id))];
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds);

        const clientMap = new Map(clients?.map(c => [c.id, c.name]) || []);

        debts.forEach((debt: Debt) => {
          const paymentMethodMap: Record<string, string> = {
            dinheiro: '💵 Dinheiro',
            pix: '📱 PIX',
            cartao_debito: '💳 Débito',
            cartao_credito: '💳 Crédito',
            fiado: '📝 Fiado',
          };
          const paymentMethodText = debt.payment_method ? paymentMethodMap[debt.payment_method] || debt.payment_method : '';
          const clientName = clientMap.get(debt.client_id) || 'Cliente';
          const detailsParts = [clientName, paymentMethodText].filter(Boolean);
          
          historyItems.push({
            type: 'debt',
            id: debt.id,
            date: debt.created_at,
            description: debt.description,
            amount: Number(debt.amount),
            status: debt.paid ? 'Pago' : 'Em aberto',
            details: detailsParts.join(' - '),
          });
        });
      }
    }

    // Carregar reservas
    if (filterType === 'all' || filterType === 'reservation') {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .gte('scheduled_date', start.toISOString())
        .lte('scheduled_date', end.toISOString())
        .order('scheduled_date', { ascending: false });

      if (reservations) {
        reservations.forEach((reservation: Reservation) => {
          const statusMap: Record<string, string> = {
            pending: 'Pendente',
            completed_paid: 'Concluída (Pago)',
            completed_debt: 'Concluída (Fiado)',
            missed: 'Não compareceu',
          };

          historyItems.push({
            type: 'reservation',
            id: reservation.id,
            date: reservation.scheduled_date,
            description: `${reservation.product_name} - ${reservation.client_name}`,
            amount: Number(reservation.amount),
            status: statusMap[reservation.status] || reservation.status,
            details: new Date(reservation.scheduled_date).toLocaleString('pt-BR'),
          });
        });
      }
    }

    // Ordenar por data (mais recente primeiro)
    historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setHistory(historyItems);
    setLoading(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Título
    doc.setFontSize(20);
    doc.text('Histórico da Lanchonete', pageWidth / 2, 20, { align: 'center' });

    // Período
    doc.setFontSize(12);
    const periodText = `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`;
    doc.text(periodText, pageWidth / 2, 30, { align: 'center' });

    // Preparar dados da tabela
    const tableData = history.map(item => {
      // Extrair meio de pagamento dos details se existir
      let paymentMethod = '-';
      if (item.details) {
        const paymentMatch = item.details.match(/(💵 Dinheiro|📱 PIX|💳 Débito|💳 Crédito|📝 Fiado)/);
        if (paymentMatch) {
          paymentMethod = paymentMatch[1];
        } else {
          // Tentar extrair texto após o último hífen
          const parts = item.details.split(' - ');
          if (parts.length > 0) {
            const lastPart = parts[parts.length - 1].trim();
            if (lastPart.includes('Dinheiro') || lastPart.includes('PIX') || lastPart.includes('Débito') || lastPart.includes('Crédito') || lastPart.includes('Fiado')) {
              paymentMethod = lastPart;
            }
          }
        }
      }
      
      return [
        new Date(item.date).toLocaleDateString('pt-BR'),
        item.type === 'sale' ? 'Venda' : item.type === 'debt' ? 'Dívida' : 'Reserva',
        item.description,
        `R$ ${item.amount.toFixed(2)}`,
        item.status,
        paymentMethod,
      ];
    });

    // Criar tabela
    autoTable(doc, {
      head: [['Data', 'Tipo', 'Descrição', 'Valor', 'Status', 'Pagamento']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    // Totais
    const totalSales = history
      .filter(item => item.type === 'sale' && item.status === 'Pago')
      .reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = history
      .filter(item => item.type === 'debt' && item.status === 'Em aberto')
      .reduce((sum, item) => sum + item.amount, 0);
    const totalReservations = history
      .filter(item => item.type === 'reservation')
      .reduce((sum, item) => sum + item.amount, 0);

    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(12);
    doc.text(`Total Recebido: R$ ${totalSales.toFixed(2)}`, margin, finalY + 10);
    doc.text(`Total em Dívidas: R$ ${totalDebts.toFixed(2)}`, margin, finalY + 18);
    doc.text(`Total Reservas: R$ ${totalReservations.toFixed(2)}`, margin, finalY + 26);

    // Salvar PDF
    const fileName = `historico_${startDate}_${endDate}.pdf`;
    doc.save(fileName);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'debt':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'reservation':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sale':
        return 'Venda';
      case 'debt':
        return 'Dívida';
      case 'reservation':
        return 'Reserva';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Pago' || status === 'Concluída (Pago)') {
      return 'text-green-600 font-bold';
    }
    if (status === 'Fiado' || status === 'Em aberto' || status === 'Concluída (Fiado)') {
      return 'text-yellow-600 font-bold';
    }
    if (status === 'Não compareceu') {
      return 'text-red-600 font-bold';
    }
    return 'text-blue-600 font-bold';
  };

  const totalAmount = history.reduce((sum, item) => sum + item.amount, 0);
  const totalReceived = history
    .filter(item => item.status === 'Pago' || item.status === 'Concluída (Pago)')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalDebts = history
    .filter(item => item.status === 'Em aberto' || item.status === 'Fiado')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-3 md:p-4 lg:p-8 max-h-screen overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-2 mb-3 sm:mb-4 md:mb-6">
          <button
            onClick={onBack}
            className="flex-1 bg-white p-2 sm:p-2.5 md:p-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-slate-700" />
            <span className="text-sm sm:text-base md:text-xl lg:text-2xl font-semibold text-slate-700">Voltar</span>
          </button>
          <button
            onClick={onBack}
            className="flex-1 bg-blue-500 hover:bg-blue-600 p-2 sm:p-2.5 md:p-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
            <span className="text-xs sm:text-sm md:text-lg lg:text-2xl font-semibold text-white hidden sm:inline">Voltar ao Início</span>
            <span className="text-xs sm:text-sm md:text-lg lg:text-2xl font-semibold text-white sm:hidden">Início</span>
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-800 mb-3 sm:mb-4 md:mb-6 lg:mb-8 text-center">
          Histórico Completo
        </h1>

        {/* Filtros */}
        <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 shadow-xl mb-3 sm:mb-4 md:mb-6 border-4 border-slate-200">
          <div className="flex items-center gap-2 md:gap-3 mb-2 sm:mb-3 md:mb-4">
            <Filter className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-slate-700" />
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <div>
              <label className="block text-sm sm:text-base md:text-lg font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Data Inicial
              </label>
              <input
                type="text"
                value={startDate ? new Date(startDate).toLocaleDateString('pt-BR') : ''}
                readOnly
                onClick={() => {
                  setShowStartCalendar(true);
                  if (startDate) {
                    const date = new Date(startDate);
                    setStartCalendarMonth(date.getMonth());
                    setStartCalendarYear(date.getFullYear());
                  }
                }}
                placeholder="Selecione a data inicial"
                className="w-full text-sm sm:text-base md:text-lg lg:text-xl p-2.5 sm:p-3 border-4 border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl focus:border-blue-500 focus:outline-none cursor-pointer bg-white"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base md:text-lg font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Data Final
              </label>
              <input
                type="text"
                value={endDate ? new Date(endDate).toLocaleDateString('pt-BR') : ''}
                readOnly
                onClick={() => {
                  setShowEndCalendar(true);
                  if (endDate) {
                    const date = new Date(endDate);
                    setEndCalendarMonth(date.getMonth());
                    setEndCalendarYear(date.getFullYear());
                  }
                }}
                placeholder="Selecione a data final"
                className="w-full text-sm sm:text-base md:text-lg lg:text-xl p-2.5 sm:p-3 border-4 border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl focus:border-blue-500 focus:outline-none cursor-pointer bg-white"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base md:text-lg font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full text-sm sm:text-base md:text-lg lg:text-xl p-2.5 sm:p-3 border-4 border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="sale">Vendas</option>
                <option value="debt">Dívidas</option>
                <option value="reservation">Reservas</option>
              </select>
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                onClick={exportToPDF}
                disabled={history.length === 0}
                className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold">Exportar PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
          <div className="bg-green-100 border-4 border-green-300 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 text-center">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-green-700 mb-1 sm:mb-2">Total Recebido</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600">R$ {totalReceived.toFixed(2)}</p>
          </div>
          <div className="bg-yellow-100 border-4 border-yellow-300 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 text-center">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-yellow-700 mb-1 sm:mb-2">Total em Dívidas</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-600">R$ {totalDebts.toFixed(2)}</p>
          </div>
          <div className="bg-blue-100 border-4 border-blue-300 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 text-center">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-700 mb-1 sm:mb-2">Total Geral</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">R$ {totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Lista de histórico */}
        {loading ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-lg sm:text-xl md:text-2xl text-slate-600">Carregando histórico...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 text-center shadow-xl border-4 border-slate-200">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-3 sm:mb-4 text-slate-400" />
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600">Nenhum registro encontrado no período selecionado</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {history.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl border-4 ${getTypeColor(item.type)}`}
              >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2">
                    <span className="bg-white bg-opacity-50 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 text-xs sm:text-sm md:text-base lg:text-lg font-bold">
                      {getTypeLabel(item.type)}
                    </span>
                    <span className={`text-xs sm:text-sm md:text-base lg:text-lg font-semibold ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 truncate">{item.description}</h3>
                  {item.details && (
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 mb-1 sm:mb-2 truncate">{item.details}</p>
                  )}
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600">
                    {new Date(item.date).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-left md:text-right flex-shrink-0">
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">R$ {item.amount.toFixed(2)}</p>
                </div>
              </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal do Calendário - Data Inicial */}
        {showStartCalendar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-3 md:p-4 z-[60]"
            onClick={() => setShowStartCalendar(false)}
          >
            <div 
              className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-8 max-w-2xl w-full shadow-2xl mx-2 max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-3 sm:mb-4 text-center">
                Selecionar Data Inicial
              </h3>
              {renderStartCalendar()}
            </div>
          </div>
        )}

        {/* Modal do Calendário - Data Final */}
        {showEndCalendar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-3 md:p-4 z-[60]"
            onClick={() => setShowEndCalendar(false)}
          >
            <div 
              className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-8 max-w-2xl w-full shadow-2xl mx-2 max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-3 sm:mb-4 text-center">
                Selecionar Data Final
              </h3>
              {renderEndCalendar()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

