import { ArrowLeft, ShoppingCart, Plus, Minus, X, User, Package, DollarSign, Check, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Client, Debt } from '../types';

interface DebtSaleViewProps {
  onBack: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ClientWithDebts extends Client {
  debts: Debt[];
  totalDebtAmount: number;
}

export default function DebtSaleView({ onBack }: DebtSaleViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsWithDebts, setClientsWithDebts] = useState<ClientWithDebts[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'payments'>('new');

  useEffect(() => {
    loadProducts();
    loadClients();
    loadClientsWithDebts();
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

  const loadClientsWithDebts = async () => {
    // Buscar todos os clientes com dívidas em aberto
    const { data: debts } = await supabase
      .from('debts')
      .select('*')
      .eq('paid', false)
      .order('created_at', { ascending: false });

    if (!debts || debts.length === 0) {
      setClientsWithDebts([]);
      return;
    }

    // Agrupar dívidas por cliente
    const clientDebtsMap = new Map<string, Debt[]>();
    debts.forEach((debt: Debt) => {
      const existing = clientDebtsMap.get(debt.client_id) || [];
      existing.push(debt);
      clientDebtsMap.set(debt.client_id, existing);
    });

    // Buscar informações dos clientes
    const clientIds = Array.from(clientDebtsMap.keys());
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .in('id', clientIds);

    if (clientsData) {
      const clientsWithDebtsData: ClientWithDebts[] = clientsData.map(client => {
        const clientDebts = clientDebtsMap.get(client.id) || [];
        const totalDebtAmount = clientDebts.reduce((sum, debt) => sum + Number(debt.amount), 0);
        return {
          ...client,
          debts: clientDebts,
          totalDebtAmount,
        };
      });

      // Ordenar por total de dívida (maior primeiro)
      clientsWithDebtsData.sort((a, b) => b.totalDebtAmount - a.totalDebtAmount);
      setClientsWithDebts(clientsWithDebtsData);
    }
  };

  const handlePayClientDebt = async (client: ClientWithDebts) => {
    if (!confirm(`Confirmar pagamento de R$ ${client.totalDebtAmount.toFixed(2)} de ${client.name}?`)) {
      return;
    }

    // Marcar todas as dívidas como pagas
    const debtIds = client.debts.map(d => d.id);
    await supabase
      .from('debts')
      .update({ 
        paid: true, 
        paid_at: new Date().toISOString() 
      })
      .in('id', debtIds);

    // Atualizar as vendas relacionadas para paid: true
    // Mas manter a data original da venda
    const saleIds = client.debts
      .map(d => d.sale_id)
      .filter(Boolean) as string[];
    
    if (saleIds.length > 0) {
      await supabase
        .from('sales')
        .update({ paid: true })
        .in('id', saleIds);
    }

    // Atualizar total_debt do cliente para 0
    await supabase
      .from('clients')
      .update({ total_debt: 0 })
      .eq('id', client.id);

    // Recarregar dados
    loadClients();
    loadClientsWithDebts();
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientName(client.name);
    setShowClientModal(false);
  };

  const handleCreateClient = async () => {
    if (!clientName.trim()) return;

    const { data: client } = await supabase
      .from('clients')
      .insert({ name: clientName.trim(), total_debt: 0 })
      .select()
      .single();

    if (client) {
      setSelectedClient(client);
      setShowClientModal(false);
      loadClients();
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim() || !newProductPrice) return;

    const { data: product } = await supabase
      .from('products')
      .insert({
        name: newProductName.trim(),
        price: Number(newProductPrice),
        active: true,
      })
      .select()
      .single();

    if (product) {
      setProducts([...products, product].sort((a, b) => a.name.localeCompare(b.name)));
      setNewProductName('');
      setNewProductPrice('');
      setShowProductModal(false);
      // Adicionar automaticamente ao carrinho
      addToCart(product);
    }
  };

  const handleSaveDebt = async () => {
    if (cart.length === 0) return;

    let clientId = selectedClient?.id;

    // Se não tem cliente selecionado mas tem nome, criar cliente
    if (!clientId && clientName.trim()) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({ name: clientName.trim(), total_debt: 0 })
        .select()
        .single();

      if (newClient) {
        clientId = newClient.id;
        setSelectedClient(newClient);
        loadClients();
      } else {
        alert('Erro ao criar cliente');
        return;
      }
    }

    if (!clientId) {
      alert('Selecione ou cadastre um cliente');
      return;
    }

    const totalAmount = getTotal();

    // Criar vendas para cada item do carrinho
    for (const item of cart) {
      const totalPrice = Number(item.product.price) * item.quantity;

      const { data: sale } = await supabase
        .from('sales')
        .insert({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: totalPrice,
          paid: false,
          client_id: clientId,
        })
        .select()
        .single();

      if (sale) {
        await supabase.from('debts').insert({
          client_id: clientId,
          sale_id: sale.id,
          amount: totalPrice,
          description: `${item.quantity}x ${item.product.name}`,
          payment_method: 'fiado',
        });
      }
    }

    // Atualizar total de dívida do cliente
    const currentClient = selectedClient || await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
      .then(({ data }) => data);

    if (currentClient) {
      await supabase
        .from('clients')
        .update({
          total_debt: Number(currentClient.total_debt) + totalAmount,
        })
        .eq('id', clientId);
    }

    // Limpar e voltar
    setCart([]);
    setClientName('');
    setSelectedClient(null);
    loadClientsWithDebts();
    // Não voltar, apenas limpar o formulário
    // onBack();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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
          Venda Fiado
        </h1>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-4 md:mb-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 rounded-xl md:rounded-2xl lg:rounded-3xl p-2.5 md:p-3 lg:p-4 text-base md:text-lg lg:text-2xl font-bold transition ${
              activeTab === 'new'
                ? 'bg-blue-500 text-white shadow-xl'
                : 'bg-white text-slate-700 shadow-lg hover:shadow-xl'
            }`}
          >
            Nova Venda
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 rounded-xl md:rounded-2xl lg:rounded-3xl p-2.5 md:p-3 lg:p-4 text-base md:text-lg lg:text-2xl font-bold transition ${
              activeTab === 'payments'
                ? 'bg-yellow-500 text-white shadow-xl'
                : 'bg-white text-slate-700 shadow-lg hover:shadow-xl'
            }`}
          >
            <span className="block sm:inline">Pagamentos</span>
            <span className="block sm:inline"> ({clientsWithDebts.length})</span>
          </button>
        </div>

        {/* Conteúdo da aba de Pagamentos a Receber */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl border-4 border-yellow-300 mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
              Pagamentos a Receber
            </h2>

            {clientsWithDebts.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <p className="text-lg md:text-2xl text-slate-500">Nenhum pagamento pendente</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {clientsWithDebts.map(client => (
                  <div
                    key={client.id}
                    className="bg-slate-50 rounded-xl md:rounded-2xl p-4 md:p-6 border-4 border-slate-200"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 mb-1 md:mb-2">{client.name}</h3>
                        <p className="text-lg md:text-xl lg:text-2xl font-bold text-red-600">
                          Total: R$ {client.totalDebtAmount.toFixed(2)}
                        </p>
                        <p className="text-sm md:text-base lg:text-lg text-slate-600 mt-1 md:mt-2">
                          {client.debts.length} {client.debts.length === 1 ? 'conta' : 'contas'} em aberto
                        </p>
                      </div>
                      <button
                        onClick={() => handlePayClientDebt(client)}
                        className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white rounded-xl md:rounded-2xl px-4 md:px-6 lg:px-8 py-2.5 md:py-3 lg:py-4 flex items-center justify-center gap-2 transition transform hover:scale-105"
                      >
                        <Check className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
                        <span className="text-base md:text-lg lg:text-2xl font-bold">Dar Baixa</span>
                      </button>
                    </div>

                    {/* Lista de dívidas */}
                    <div className="mt-3 md:mt-4 space-y-2">
                      {client.debts.map(debt => (
                        <div
                          key={debt.id}
                          className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 border-2 border-slate-200"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm md:text-base lg:text-lg font-semibold text-slate-800 truncate">{debt.description}</p>
                              <p className="text-xs md:text-sm text-slate-500">
                                {new Date(debt.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <p className="text-base md:text-lg lg:text-xl font-bold text-red-600 flex-shrink-0">
                              R$ {Number(debt.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo da aba de Nova Venda */}
        {activeTab === 'new' && (
          <>
        {/* Cliente */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl mb-4 md:mb-6 border-4 border-yellow-300">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <User className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Cliente</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onFocus={() => setShowClientModal(true)}
              placeholder="Digite ou selecione o cliente..."
              className="flex-1 text-base md:text-lg lg:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-xl md:rounded-2xl focus:border-yellow-500 focus:outline-none"
            />
            <button
              onClick={() => setShowClientModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl md:rounded-2xl px-4 md:px-6 py-3 text-base md:text-lg lg:text-xl font-semibold transition"
            >
              Selecionar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Lista de Produtos */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl mb-4 md:mb-6 border-4 border-slate-200">
              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-3 md:mb-4">
                <input
                  type="text"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  placeholder="Buscar produto..."
                  className="flex-1 text-base md:text-lg lg:text-2xl p-2.5 md:p-3 lg:p-4 border-4 border-slate-300 rounded-xl md:rounded-2xl focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowProductModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-xl md:rounded-2xl px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-4 flex items-center justify-center gap-2 transition transform hover:scale-105"
                >
                  <Package className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                  <span className="text-sm md:text-base lg:text-xl font-semibold">Novo Produto</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 lg:gap-4 max-h-[40vh] md:max-h-[50vh] lg:max-h-[60vh] overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-slate-50 hover:bg-slate-100 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg border-2 border-slate-200 transform transition hover:scale-105 active:scale-95 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg lg:text-xl font-bold text-slate-800 mb-1">{product.name}</h3>
                        <p className="text-lg md:text-xl lg:text-2xl font-bold text-green-600">
                          R$ {Number(product.price).toFixed(2)}
                        </p>
                      </div>
                      <Plus className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-blue-500 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Carrinho */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl p-3 md:p-4 lg:p-6 shadow-xl border-4 border-yellow-300 sticky top-2 md:top-4">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                Carrinho
              </h2>

              {cart.length === 0 ? (
                <p className="text-base md:text-lg text-slate-500 text-center py-6 md:py-8">
                  Nenhum produto adicionado
                </p>
              ) : (
                <>
                  <div className="space-y-2 md:space-y-3 mb-3 md:mb-4 max-h-[35vh] md:max-h-[40vh] overflow-y-auto">
                    {cart.map(item => (
                      <div
                        key={item.product.id}
                        className="bg-slate-50 rounded-xl md:rounded-2xl p-3 md:p-4 border-2 border-slate-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base lg:text-lg font-bold text-slate-800 truncate">
                              {item.product.name}
                            </h3>
                            <p className="text-xs md:text-sm text-slate-600">
                              R$ {Number(item.product.price).toFixed(2)} cada
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                          >
                            <X className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 md:p-2"
                            >
                              <Minus className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                            <span className="text-base md:text-lg lg:text-xl font-bold w-8 md:w-12 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-1.5 md:p-2"
                            >
                              <Plus className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                          </div>
                          <p className="text-base md:text-lg font-bold text-green-600">
                            R$ {(Number(item.product.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-4 border-slate-300 pt-3 md:pt-4">
                    <div className="flex justify-between items-center mb-3 md:mb-4">
                      <span className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">Total:</span>
                      <span className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-600">
                        R$ {getTotal().toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={handleSaveDebt}
                      disabled={cart.length === 0 || !clientName.trim()}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-5 text-base md:text-lg lg:text-2xl font-bold transition transform hover:scale-105"
                    >
                      Salvar Fiado
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Seleção de Cliente */}
        {showClientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50 animate-modal-backdrop">
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-modal-content">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 mb-4 md:mb-6 text-center">
                Selecionar Cliente
              </h2>

              <div className="mb-4 md:mb-6">
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome do cliente..."
                  className="w-full text-base md:text-lg lg:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-xl md:rounded-2xl focus:border-yellow-500 focus:outline-none mb-3"
                />
                <button
                  onClick={handleCreateClient}
                  disabled={!clientName.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl md:rounded-2xl p-3 md:p-4 text-base md:text-lg lg:text-2xl font-semibold transition"
                >
                  + Criar Novo Cliente
                </button>
              </div>

              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 max-h-[50vh] overflow-y-auto">
                {clients
                  .filter(client =>
                    client.name.toLowerCase().includes(clientName.toLowerCase())
                  )
                  .map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="w-full bg-slate-100 hover:bg-slate-200 rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-5 text-left transition border-2 border-slate-300"
                    >
                      <p className="text-base md:text-lg lg:text-2xl font-bold text-slate-800">{client.name}</p>
                      <p className="text-sm md:text-base lg:text-xl text-red-600 font-semibold mt-1">
                        Deve: R$ {Number(client.total_debt).toFixed(2)}
                      </p>
                    </button>
                  ))}
              </div>

              <button
                onClick={() => setShowClientModal(false)}
                className="w-full bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-xl md:rounded-2xl p-3 md:p-4 text-base md:text-lg lg:text-2xl font-semibold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Modal de Cadastro de Produto */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50 animate-modal-backdrop">
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-modal-content">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 mb-4 md:mb-6 text-center">
                Cadastrar Novo Produto
              </h2>

              <div className="mb-4 md:mb-6">
                <label className="block text-base md:text-lg lg:text-2xl font-semibold text-slate-700 mb-2 md:mb-3">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full text-base md:text-lg lg:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-xl md:rounded-2xl focus:border-green-500 focus:outline-none"
                  placeholder="Ex: Pastel"
                  autoFocus
                />
              </div>

              <div className="mb-6 md:mb-8">
                <label className="block text-base md:text-lg lg:text-2xl font-semibold text-slate-700 mb-2 md:mb-3">
                  Preço
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  className="w-full text-base md:text-lg lg:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-xl md:rounded-2xl focus:border-green-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setNewProductName('');
                    setNewProductPrice('');
                  }}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-5 text-base md:text-lg lg:text-2xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProduct}
                  disabled={!newProductName.trim() || !newProductPrice}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-5 text-base md:text-lg lg:text-2xl font-semibold transition"
                >
                  Cadastrar
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

