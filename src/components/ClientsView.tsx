import { ArrowLeft, Users, Plus, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Client, Debt } from '../types';

interface ClientsViewProps {
  onBack: () => void;
}

export default function ClientsView({ onBack }: ClientsViewProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDescription, setDebtDescription] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (data) setClients(data);
  };

  const loadClientDebts = async (clientId: string) => {
    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('client_id', clientId)
      .eq('paid', false)
      .order('created_at', { ascending: false });

    if (data) setDebts(data);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    loadClientDebts(client.id);
  };

  const handlePayAll = async () => {
    if (!selectedClient) return;

    await supabase
      .from('debts')
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('client_id', selectedClient.id)
      .eq('paid', false);

    await supabase
      .from('clients')
      .update({ total_debt: 0 })
      .eq('id', selectedClient.id);

    setSelectedClient(null);
    loadClients();
  };

  const handleAddDebt = async () => {
    if (!selectedClient || !debtAmount) return;

    const amount = Number(debtAmount);

    await supabase.from('debts').insert({
      client_id: selectedClient.id,
      amount,
      description: debtDescription || 'Débito manual',
    });

    await supabase
      .from('clients')
      .update({
        total_debt: Number(selectedClient.total_debt) + amount,
      })
      .eq('id', selectedClient.id);

    setShowAddDebtModal(false);
    setDebtAmount('');
    setDebtDescription('');

    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', selectedClient.id)
      .single();

    if (data) {
      setSelectedClient(data);
      loadClientDebts(data.id);
    }
    loadClients();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              if (selectedClient) {
                setSelectedClient(null);
              } else {
                onBack();
              }
            }}
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

        {!selectedClient ? (
          <>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-6 md:mb-8 text-center">
              Clientes
            </h1>

            <div className="space-y-3 md:space-y-4">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleClientClick(client)}
                  className="w-full bg-white hover:bg-slate-50 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl border-4 border-slate-200 transform transition hover:scale-105 active:scale-95 flex items-center gap-4 md:gap-6"
                >
                  <div className="bg-blue-100 rounded-full p-3 md:p-4">
                    <Users className="w-8 h-8 md:w-12 md:h-12 text-blue-600" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 md:mb-2">{client.name}</h3>
                    <p className="text-xl md:text-2xl font-semibold text-red-600">
                      Deve: R$ {Number(client.total_debt).toFixed(2)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-4 text-center">
              {selectedClient.name}
            </h1>

            <div className="bg-red-100 border-4 border-red-300 rounded-2xl md:rounded-3xl p-6 md:p-8 mb-6 md:mb-8 text-center">
              <p className="text-xl md:text-2xl text-red-700 mb-2">Total em Aberto</p>
              <p className="text-4xl md:text-6xl font-bold text-red-600">
                R$ {Number(selectedClient.total_debt).toFixed(2)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
              <button
                onClick={() => setShowAddDebtModal(true)}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl p-4 md:p-6 flex items-center justify-center gap-2 md:gap-3 transition transform hover:scale-105"
              >
                <Plus className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
                <span className="text-lg md:text-2xl font-bold">Anotar Débito</span>
              </button>

              {Number(selectedClient.total_debt) > 0 && (
                <button
                  onClick={handlePayAll}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-2xl p-4 md:p-6 text-lg md:text-2xl font-bold transition transform hover:scale-105"
                >
                  PAGAR TUDO
                </button>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-700 mb-3 md:mb-4">Histórico</h2>
            <div className="space-y-3">
              {debts.map(debt => (
                <div
                  key={debt.id}
                  className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xl font-semibold text-slate-700">{debt.description}</p>
                    <p className="text-2xl font-bold text-red-600">
                      R$ {Number(debt.amount).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-lg text-slate-500">
                    {new Date(debt.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {showAddDebtModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50">
            <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 md:mb-6 text-center">
                Anotar Débito
              </h2>

              <div className="mb-4 md:mb-6">
                <label className="block text-xl md:text-2xl font-semibold text-slate-700 mb-2 md:mb-3">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(e.target.value)}
                  className="w-full text-2xl md:text-3xl p-3 md:p-4 border-4 border-slate-300 rounded-2xl focus:border-yellow-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="mb-6 md:mb-8">
                <label className="block text-xl md:text-2xl font-semibold text-slate-700 mb-2 md:mb-3">
                  Descrição
                </label>
                <input
                  type="text"
                  value={debtDescription}
                  onChange={(e) => setDebtDescription(e.target.value)}
                  className="w-full text-lg md:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-2xl focus:border-yellow-500 focus:outline-none"
                  placeholder="Ex: Lanche"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button
                  onClick={() => {
                    setShowAddDebtModal(false);
                    setDebtAmount('');
                    setDebtDescription('');
                  }}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-2xl p-4 md:p-5 text-lg md:text-2xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddDebt}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl p-4 md:p-5 text-lg md:text-2xl font-semibold transition"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
