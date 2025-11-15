import { ArrowLeft, Download, Calendar, Filter, Home } from 'lucide-react';
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

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadHistory();
    }
  }, [startDate, endDate, filterType]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex-1 bg-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3"
          >
            <ArrowLeft className="w-8 h-8 text-slate-700" />
            <span className="text-2xl font-semibold text-slate-700">Voltar</span>
          </button>
          <button
            onClick={onBack}
            className="flex-1 bg-blue-500 hover:bg-blue-600 p-4 rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3"
          >
            <Home className="w-8 h-8 text-white" />
            <span className="text-2xl font-semibold text-white">Voltar ao Início</span>
          </button>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-6 md:mb-8 text-center">
          Histórico Completo
        </h1>

        {/* Filtros */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl mb-4 md:mb-6 border-4 border-slate-200">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Filter className="w-6 h-6 md:w-8 md:h-8 text-slate-700" />
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div>
              <label className="block text-base md:text-lg font-semibold text-slate-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-base md:text-xl p-2 md:p-3 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base md:text-lg font-semibold text-slate-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-base md:text-xl p-2 md:p-3 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base md:text-lg font-semibold text-slate-700 mb-2">
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full text-base md:text-xl p-2 md:p-3 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none"
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
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl p-3 md:p-4 flex items-center justify-center gap-2 md:gap-3 transition transform hover:scale-105"
              >
                <Download className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-base md:text-xl font-bold">Exportar PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-green-100 border-4 border-green-300 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center">
            <p className="text-lg md:text-xl text-green-700 mb-2">Total Recebido</p>
            <p className="text-3xl md:text-4xl font-bold text-green-600">R$ {totalReceived.toFixed(2)}</p>
          </div>
          <div className="bg-yellow-100 border-4 border-yellow-300 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center">
            <p className="text-lg md:text-xl text-yellow-700 mb-2">Total em Dívidas</p>
            <p className="text-3xl md:text-4xl font-bold text-yellow-600">R$ {totalDebts.toFixed(2)}</p>
          </div>
          <div className="bg-blue-100 border-4 border-blue-300 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center">
            <p className="text-lg md:text-xl text-blue-700 mb-2">Total Geral</p>
            <p className="text-3xl md:text-4xl font-bold text-blue-600">R$ {totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Lista de histórico */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-2xl text-slate-600">Carregando histórico...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-xl border-4 border-slate-200">
            <Calendar className="w-20 h-20 mx-auto mb-4 text-slate-400" />
            <p className="text-2xl text-slate-600">Nenhum registro encontrado no período selecionado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`rounded-3xl p-6 shadow-xl border-4 ${getTypeColor(item.type)}`}
              >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                    <span className="bg-white bg-opacity-50 rounded-xl px-3 md:px-4 py-1 text-base md:text-lg font-bold">
                      {getTypeLabel(item.type)}
                    </span>
                    <span className={`text-base md:text-lg font-semibold ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{item.description}</h3>
                  {item.details && (
                    <p className="text-base md:text-lg text-slate-600 mb-2">{item.details}</p>
                  )}
                  <p className="text-base md:text-lg text-slate-600">
                    {new Date(item.date).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-3xl md:text-4xl font-bold">R$ {item.amount.toFixed(2)}</p>
                </div>
              </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

