import { ArrowLeft, Calendar, Plus, Check, X, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Reservation, Product, Client } from '../types';

interface ReservationsViewProps {
  onBack: () => void;
}

export default function ReservationsView({ onBack }: ReservationsViewProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [productName, setProductName] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [amount, setAmount] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadReservations();
    loadProducts();
    loadClients();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');

    if (data) setProducts(data);
  };

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (data) setClients(data);
  };

  const loadReservations = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('reservations')
      .select('*')
      .gte('scheduled_date', today.toISOString())
      .order('scheduled_date');

    if (data) setReservations(data);
  };

  const handleCreateReservation = async () => {
    if (!clientName || !productName || !amount || !scheduledDate) return;

    // Se o cliente não existe, criar
    let finalClientName = clientName;
    const existingClient = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    
    if (!existingClient && clientName.trim()) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({ name: clientName.trim(), total_debt: 0 })
        .select()
        .single();
      
      if (newClient) {
        finalClientName = newClient.name;
        loadClients();
      }
    } else if (existingClient) {
      finalClientName = existingClient.name;
    }

    // Usar início do dia como horário padrão
    const dateTime = new Date(scheduledDate);
    dateTime.setHours(0, 0, 0, 0);

    await supabase.from('reservations').insert({
      client_name: finalClientName,
      product_name: productName,
      amount: Number(amount),
      scheduled_date: dateTime.toISOString(),
    });

    setShowModal(false);
    setClientName('');
    setClientSearch('');
    setProductName('');
    setProductSearch('');
    setAmount('');
    setScheduledDate('');
    loadReservations();
  };

  const handleClientSelect = (client: Client) => {
    setClientName(client.name);
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleProductSelect = (product: Product) => {
    setProductName(product.name);
    setAmount(product.price.toString());
    setProductSearch(product.name);
    setShowProductDropdown(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Funções do calendário
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(calendarYear, calendarMonth, day);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setScheduledDate(formattedDate);
    setShowCalendar(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(calendarYear - 1);
      } else {
        setCalendarMonth(calendarMonth - 1);
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(calendarYear + 1);
      } else {
        setCalendarMonth(calendarMonth + 1);
      }
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
    const days = [];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const selectedDateObj = scheduledDate ? new Date(scheduledDate) : null;

    // Espaços vazios para os dias antes do primeiro dia do mês
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return (
      <>
        {/* Cabeçalho do calendário */}
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <button
            onClick={() => navigateMonth('prev')}
            className="bg-slate-200 hover:bg-slate-300 rounded-xl p-2 md:p-4 transition transform hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <h2 className="text-2xl md:text-4xl font-bold text-slate-800 text-center px-2">
            {getMonthName(calendarMonth)} {calendarYear}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="bg-slate-200 hover:bg-slate-300 rounded-xl p-2 md:p-4 transition transform hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 md:gap-3 mb-2 md:mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm md:text-2xl font-bold text-slate-600 py-2 md:py-3">
              {day}
            </div>
          ))}
        </div>

        {/* Dias do mês */}
        <div className="grid grid-cols-7 gap-1 md:gap-3 mb-4 md:mb-6">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-10 md:h-16"></div>;
            }

            const isToday =
              day === today.getDate() &&
              calendarMonth === today.getMonth() &&
              calendarYear === today.getFullYear();

            const isSelected =
              selectedDateObj &&
              day === selectedDateObj.getDate() &&
              calendarMonth === selectedDateObj.getMonth() &&
              calendarYear === selectedDateObj.getFullYear();

            return (
              <button
                key={index}
                onClick={() => handleDateSelect(day)}
                className={`h-10 md:h-16 rounded-xl md:rounded-2xl text-base md:text-2xl font-bold transition transform hover:scale-110 ${
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

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <button
            onClick={() => {
              const today = new Date();
              setCalendarMonth(today.getMonth());
              setCalendarYear(today.getFullYear());
              handleDateSelect(today.getDate());
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-3 md:p-4 text-lg md:text-2xl font-semibold transition transform hover:scale-105"
          >
            Selecionar Hoje
          </button>
          <button
            onClick={() => setShowCalendar(false)}
            className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-2xl p-3 md:p-4 text-lg md:text-2xl font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </>
    );
  };

  const handleUpdateStatus = async (id: string, status: Reservation['status']) => {
    await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id);

    loadReservations();
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'completed_paid':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'completed_debt':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'missed':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-white border-slate-300 text-slate-800';
    }
  };

  const getStatusLabel = (status: Reservation['status']) => {
    switch (status) {
      case 'completed_paid':
        return 'Veio e Pagou';
      case 'completed_debt':
        return 'Veio e Anotou';
      case 'missed':
        return 'Não Veio';
      default:
        return 'Pendente';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
          Reservas
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-2xl md:rounded-3xl p-6 md:p-8 mb-6 md:mb-8 shadow-2xl transform transition hover:scale-105 active:scale-95"
        >
          <Plus className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-3" strokeWidth={3} />
          <p className="text-2xl md:text-3xl font-bold">Nova Reserva</p>
        </button>

        <div className="space-y-4">
          {reservations.map(reservation => (
            <div
              key={reservation.id}
              className={`rounded-3xl p-6 shadow-xl border-4 ${getStatusColor(reservation.status)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-8 h-8" strokeWidth={2.5} />
                    <h3 className="text-3xl font-bold">{reservation.client_name}</h3>
                  </div>
                  <p className="text-2xl font-semibold mb-1">{reservation.product_name}</p>
                  <p className="text-3xl font-bold text-green-600 mb-2">
                    R$ {Number(reservation.amount).toFixed(2)}
                  </p>
                  <p className="text-xl">
                    {new Date(reservation.scheduled_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="bg-white bg-opacity-50 rounded-2xl px-4 py-2">
                  <p className="text-lg font-bold whitespace-nowrap">
                    {getStatusLabel(reservation.status)}
                  </p>
                </div>
              </div>

              {reservation.status === 'pending' && (
                <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4">
                  <button
                    onClick={() => handleUpdateStatus(reservation.id, 'completed_paid')}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center gap-1 md:gap-2 transition transform hover:scale-105"
                  >
                    <Check className="w-6 h-6 md:w-8 md:h-8" strokeWidth={3} />
                    <span className="text-xs md:text-sm font-bold">Pagou</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(reservation.id, 'completed_debt')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center gap-1 md:gap-2 transition transform hover:scale-105"
                  >
                    <AlertCircle className="w-6 h-6 md:w-8 md:h-8" strokeWidth={3} />
                    <span className="text-xs md:text-sm font-bold">Anotou</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(reservation.id, 'missed')}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center gap-1 md:gap-2 transition transform hover:scale-105"
                  >
                    <X className="w-6 h-6 md:w-8 md:h-8" strokeWidth={3} />
                    <span className="text-xs md:text-sm font-bold">Faltou</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50"
            onClick={() => {
              setShowModal(false);
              setShowProductDropdown(false);
              setShowClientDropdown(false);
              setShowCalendar(false);
            }}
          >
            <div 
              className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 md:mb-6 text-center">
                Nova Reserva
              </h2>

              <div className="mb-4 md:mb-5 relative">
                <label className="block text-xl md:text-2xl font-semibold text-slate-700 mb-2 md:mb-3">
                  Nome do Cliente
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                      if (!e.target.value) {
                        setClientName('');
                      }
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    className="w-full text-lg md:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none pr-10 md:pr-12"
                    placeholder="Digite para buscar cliente..."
                  />
                  <ChevronDown className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-slate-400 pointer-events-none" />
                  
                  {showClientDropdown && clientSearch && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-4 border-slate-300 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {filteredClients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleClientSelect(client)}
                          className="w-full text-left p-4 hover:bg-blue-50 border-b-2 border-slate-100 last:border-b-0 transition"
                        >
                          <p className="text-xl font-bold text-slate-800">{client.name}</p>
                          <p className="text-lg text-red-600 font-semibold">
                            Deve: R$ {Number(client.total_debt).toFixed(2)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {clientSearch && !filteredClients.find(c => c.name.toLowerCase() === clientSearch.toLowerCase()) && (
                  <p className="text-sm text-slate-500 mt-2">
                    Cliente não encontrado. Será criado um novo cliente ao salvar.
                  </p>
                )}
              </div>

              <div className="mb-4 md:mb-5 relative">
                <label className="block text-xl md:text-2xl font-semibold text-slate-700 mb-2 md:mb-3">
                  Produto
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                      if (!e.target.value) {
                        setProductName('');
                        setAmount('');
                      }
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full text-lg md:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none pr-10 md:pr-12"
                    placeholder="Digite para buscar produto..."
                  />
                  <ChevronDown className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-slate-400 pointer-events-none" />
                  
                  {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-4 border-slate-300 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleProductSelect(product)}
                          className="w-full text-left p-4 hover:bg-blue-50 border-b-2 border-slate-100 last:border-b-0 transition"
                        >
                          <p className="text-xl font-bold text-slate-800">{product.name}</p>
                          <p className="text-lg text-green-600 font-semibold">
                            R$ {Number(product.price).toFixed(2)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4 md:mb-5">
                <label className="block text-xl md:text-2xl font-semibold text-slate-700 mb-2 md:mb-3">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-lg md:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="mb-4 md:mb-5">
                <label className="block text-xl md:text-2xl font-semibold text-slate-700 mb-2 md:mb-3">
                  Data
                </label>
                <input
                  type="text"
                  value={scheduledDate ? new Date(scheduledDate).toLocaleDateString('pt-BR') : ''}
                  readOnly
                  onClick={() => {
                    setShowCalendar(true);
                    if (scheduledDate) {
                      const date = new Date(scheduledDate);
                      setCalendarMonth(date.getMonth());
                      setCalendarYear(date.getFullYear());
                    }
                  }}
                  placeholder="Clique para selecionar a data"
                  className="w-full text-lg md:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none cursor-pointer pr-10 md:pr-12"
                />
              </div>


              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowProductDropdown(false);
                  }}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-2xl p-4 md:p-5 text-lg md:text-2xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateReservation}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-4 md:p-5 text-lg md:text-2xl font-semibold transition"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal do Calendário */}
        {showCalendar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-[60]"
            onClick={() => setShowCalendar(false)}
          >
            <div 
              className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 max-w-2xl w-full shadow-2xl mx-2"
              onClick={(e) => e.stopPropagation()}
            >
              {renderCalendar()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
