import { ArrowLeft, ShoppingCart, Plus, Minus, Home, Search } from 'lucide-react';
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
  const [searchProduct, setSearchProduct] = useState('');

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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 mb-4">
          <button
            onClick={onBack}
            className="flex-1 bg-white p-2 md:p-4 rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 md:w-8 md:h-8 text-slate-700" />
            <span className="text-base md:text-2xl font-semibold text-slate-700">Voltar</span>
          </button>
          <button
            onClick={onBack}
            className="flex-1 bg-blue-500 hover:bg-blue-600 p-2 md:p-4 rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5 md:w-8 md:h-8 text-white" />
            <span className="text-sm md:text-2xl font-semibold text-white hidden sm:inline">Voltar ao Início</span>
            <span className="text-sm md:text-2xl font-semibold text-white sm:hidden">Início</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4 md:mb-6 lg:mb-8 text-center">
          Nova Venda
        </h1>

        {/* Campo de Busca Rápida */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-400" />
            <input
              type="text"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="🔍 Buscar produto rapidamente..."
              className="w-full text-base md:text-lg lg:text-xl p-3 md:p-4 pl-10 md:pl-14 border-4 border-blue-300 rounded-xl md:rounded-2xl focus:border-blue-500 focus:outline-none bg-white shadow-lg"
              autoFocus
            />
            {searchProduct && (
              <button
                onClick={() => setSearchProduct('')}
                className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="text-xl md:text-2xl">×</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-8 md:py-12 animate-fade-in">
              <p className="text-lg md:text-xl text-slate-500">Nenhum produto encontrado</p>
            </div>
          ) : (
            filteredProducts.map((product, index) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white hover:bg-slate-50 rounded-xl md:rounded-2xl lg:rounded-3xl p-3 md:p-4 lg:p-6 shadow-lg hover:shadow-xl border-2 md:border-4 border-slate-200 transform transition-all duration-300 ease-out hover:scale-105 active:scale-95 card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <ShoppingCart className="w-6 h-6 md:w-8 md:h-10 lg:w-12 lg:h-14 mx-auto mb-2 md:mb-3 text-blue-500" strokeWidth={2.5} />
                <h3 className="text-sm md:text-base lg:text-lg xl:text-xl font-bold text-slate-800 mb-1 md:mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-green-600">
                  R$ {Number(product.price).toFixed(2)}
                </p>
              </button>
            ))
          )}
        </div>

        {showPaymentModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-3 md:p-4 z-50 animate-modal-backdrop">
            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 max-w-md w-full mx-2 shadow-2xl max-h-[95vh] overflow-y-auto animate-modal-content">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 mb-3 sm:mb-4 md:mb-6 text-center line-clamp-2">
                {selectedProduct.name}
              </h2>

              <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-slate-600 mb-2 sm:mb-3 text-center">Quantidade</p>
                <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 transition transform active:scale-95"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" strokeWidth={3} />
                  </button>
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-800 w-12 sm:w-16 md:w-20 lg:w-28 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 transition transform active:scale-95"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-6 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-slate-600 mb-1 sm:mb-2 text-center">Total</p>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-green-600 text-center">
                  R$ {(selectedProduct.price * quantity).toFixed(2)}
                </p>
              </div>

              <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
                <label className="block text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-slate-700 mb-2 sm:mb-3 text-center">
                  Meio de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                  <button
                    onClick={() => setPaymentMethod('dinheiro')}
                    className={`p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl transition ${
                      paymentMethod === 'dinheiro'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-700 active:bg-slate-300'
                    }`}
                  >
                    💵 Dinheiro
                  </button>
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl transition ${
                      paymentMethod === 'pix'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-700 active:bg-slate-300'
                    }`}
                  >
                    📱 PIX
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cartao_debito')}
                    className={`p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl transition ${
                      paymentMethod === 'cartao_debito'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-700 active:bg-slate-300'
                    }`}
                  >
                    💳 Débito
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cartao_credito')}
                    className={`p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl transition ${
                      paymentMethod === 'cartao_credito'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-700 active:bg-slate-300'
                    }`}
                  >
                    💳 Crédito
                  </button>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4">
                <button
                  onClick={handlePaid}
                  className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-5 xl:p-6 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold transition transform active:scale-95"
                >
                  PAGOU AGORA
                </button>
                <button
                  onClick={handleDebt}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-5 xl:p-6 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold transition transform active:scale-95"
                >
                  ANOTAR / FIADO
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedProduct(null);
                    setPaymentMethod('dinheiro');
                  }}
                  className="w-full bg-slate-300 hover:bg-slate-400 active:bg-slate-500 text-slate-800 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold transition transform active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showClientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50 animate-modal-backdrop">
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-modal-content">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 mb-4 md:mb-6 text-center">
                {selectedProduct ? 'Selecione o Cliente' : 'Cliente (Opcional)'}
              </h2>

              <div className="mb-4 md:mb-6">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Novo cliente..."
                  className="w-full text-base md:text-lg lg:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-xl md:rounded-2xl focus:border-blue-500 focus:outline-none mb-3"
                />
                <button
                  onClick={handleNewClient}
                  disabled={!newClientName.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl md:rounded-2xl p-3 md:p-4 text-base md:text-lg lg:text-2xl font-semibold transition"
                >
                  + Adicionar Novo Cliente
                </button>
              </div>

              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 max-h-[40vh] overflow-y-auto">
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
                    className="w-full bg-slate-100 hover:bg-slate-200 rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-5 text-left transition border-2 border-slate-300"
                  >
                    <p className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-slate-800">{client.name}</p>
                    <p className="text-sm md:text-base lg:text-lg xl:text-xl text-red-600 font-semibold mt-1">
                      Deve: R$ {Number(client.total_debt).toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>

              {!selectedProduct && (
                <button
                  onClick={() => handlePaidWithClient(null)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl md:rounded-2xl p-3 md:p-4 text-base md:text-lg lg:text-2xl font-semibold transition mb-3"
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
                className="w-full bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-xl md:rounded-2xl p-3 md:p-4 text-base md:text-lg lg:text-2xl font-semibold transition"
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
