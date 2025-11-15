import { ArrowLeft, ShoppingCart, Plus, Minus, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Client } from '../types';

interface SalesViewProps {
  onBack: () => void;
}

export default function SalesView({ onBack }: SalesViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'fiado'>('dinheiro');

  useEffect(() => {
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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setPaymentMethod('dinheiro');
    setShowPaymentModal(true);
  };

  const handlePaid = async () => {
    if (!selectedProduct) return;
    
    // Mostrar modal de cliente também para vendas pagas
    setShowPaymentModal(false);
    setShowClientModal(true);
  };

  const handleDebt = () => {
    setShowPaymentModal(false);
    setShowClientModal(true);
  };

  const handlePaidWithClient = async (client: Client | null) => {
    if (!selectedProduct) return;

    await supabase.from('sales').insert({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity,
      unit_price: selectedProduct.price,
      total_price: selectedProduct.price * quantity,
      paid: true,
      client_id: client?.id || null,
      payment_method: paymentMethod,
    });

    setShowClientModal(false);
    setSelectedProduct(null);
    setQuantity(1);
    setNewClientName('');
    setPaymentMethod('dinheiro');
  };

  const handleClientSelect = async (client: Client) => {
    if (!selectedProduct) return;

    const totalPrice = selectedProduct.price * quantity;

    const { data: sale } = await supabase
      .from('sales')
      .insert({
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity,
        unit_price: selectedProduct.price,
        total_price: totalPrice,
        paid: false,
        client_id: client.id,
      })
      .select()
      .single();

    if (sale) {
      await supabase.from('debts').insert({
        client_id: client.id,
        sale_id: sale.id,
        amount: totalPrice,
        description: `${quantity}x ${selectedProduct.name}`,
        payment_method: 'fiado',
      });

      await supabase
        .from('clients')
        .update({
          total_debt: Number(client.total_debt) + totalPrice,
        })
        .eq('id', client.id);
    }

    setShowClientModal(false);
    setSelectedProduct(null);
    setQuantity(1);
    loadClients();
  };

  const handleNewClient = async () => {
    if (!newClientName.trim()) return;

    const { data: client } = await supabase
      .from('clients')
      .insert({ name: newClientName.trim(), total_debt: 0 })
      .select()
      .single();

    if (client) {
      // Se tem produto selecionado, é uma venda fiado
      if (selectedProduct) {
        await handleClientSelect(client);
      } else {
        // Se não tem produto, é uma venda paga
        await handlePaidWithClient(client);
      }
      setNewClientName('');
      loadClients();
    }
  };

  const handleClientSelectForPaid = async (client: Client) => {
    await handlePaidWithClient(client);
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
          Nova Venda
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="bg-white hover:bg-slate-50 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border-4 border-slate-200 transform transition hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-blue-500" strokeWidth={2.5} />
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 md:mb-3">{product.name}</h3>
              <p className="text-3xl md:text-4xl font-bold text-green-600">
                R$ {Number(product.price).toFixed(2)}
              </p>
            </button>
          ))}
        </div>

        {showPaymentModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 md:mb-6 text-center">
                {selectedProduct.name}
              </h2>

              <div className="mb-6 md:mb-8">
                <p className="text-xl md:text-2xl text-slate-600 mb-3 md:mb-4 text-center">Quantidade</p>
                <div className="flex items-center justify-center gap-4 md:gap-6">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-2xl p-4 md:p-5 transition transform hover:scale-110"
                  >
                    <Minus className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
                  </button>
                  <span className="text-4xl md:text-6xl font-bold text-slate-800 w-20 md:w-28 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-2xl p-4 md:p-5 transition transform hover:scale-110"
                  >
                    <Plus className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
                <p className="text-xl md:text-2xl text-slate-600 mb-2 text-center">Total</p>
                <p className="text-3xl md:text-5xl font-bold text-green-600 text-center">
                  R$ {(selectedProduct.price * quantity).toFixed(2)}
                </p>
              </div>

              <div className="mb-6 md:mb-8">
                <label className="block text-xl md:text-2xl font-semibold text-slate-700 mb-3 md:mb-4 text-center">
                  Meio de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <button
                    onClick={() => setPaymentMethod('dinheiro')}
                    className={`p-4 md:p-5 rounded-2xl font-bold text-lg md:text-xl transition ${
                      paymentMethod === 'dinheiro'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    💵 Dinheiro
                  </button>
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 md:p-5 rounded-2xl font-bold text-lg md:text-xl transition ${
                      paymentMethod === 'pix'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    📱 PIX
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cartao_debito')}
                    className={`p-4 md:p-5 rounded-2xl font-bold text-lg md:text-xl transition ${
                      paymentMethod === 'cartao_debito'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    💳 Débito
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cartao_credito')}
                    className={`p-4 md:p-5 rounded-2xl font-bold text-lg md:text-xl transition ${
                      paymentMethod === 'cartao_credito'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    💳 Crédito
                  </button>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <button
                  onClick={handlePaid}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl p-5 md:p-6 text-2xl md:text-3xl font-bold transition transform hover:scale-105"
                >
                  PAGOU AGORA
                </button>
                <button
                  onClick={handleDebt}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl p-5 md:p-6 text-2xl md:text-3xl font-bold transition transform hover:scale-105"
                >
                  ANOTAR / FIADO
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedProduct(null);
                    setPaymentMethod('dinheiro');
                  }}
                  className="w-full bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-2xl p-3 md:p-4 text-xl md:text-2xl font-semibold transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showClientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 md:mb-6 text-center">
                {selectedProduct ? 'Selecione o Cliente' : 'Cliente (Opcional)'}
              </h2>

              <div className="mb-4 md:mb-6">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Novo cliente..."
                  className="w-full text-lg md:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none mb-3"
                />
                <button
                  onClick={handleNewClient}
                  disabled={!newClientName.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl p-3 md:p-4 text-lg md:text-2xl font-semibold transition"
                >
                  + Adicionar Novo Cliente
                </button>
              </div>

              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                {clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => {
                      if (selectedProduct) {
                        handleClientSelect(client);
                      } else {
                        handleClientSelectForPaid(client);
                      }
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 rounded-2xl p-4 md:p-5 text-left transition border-2 border-slate-300"
                  >
                    <p className="text-xl md:text-2xl font-bold text-slate-800">{client.name}</p>
                    <p className="text-lg md:text-xl text-red-600 font-semibold mt-1">
                      Deve: R$ {Number(client.total_debt).toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>

              {!selectedProduct && (
                <button
                  onClick={() => handlePaidWithClient(null)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl p-3 md:p-4 text-lg md:text-2xl font-semibold transition mb-3"
                >
                  Continuar sem Cliente
                </button>
              )}

              <button
                onClick={() => {
                  setShowClientModal(false);
                  if (!selectedProduct) {
                    setSelectedProduct(null);
                    setQuantity(1);
                  }
                }}
                className="w-full bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-2xl p-3 md:p-4 text-lg md:text-2xl font-semibold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
