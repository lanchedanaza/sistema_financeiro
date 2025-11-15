import { Plus, Edit, Trash2, ArrowLeft, Home, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface ProductManagerProps {
  onBack: () => void;
}

export default function ProductManager({ onBack }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [searchProduct, setSearchProduct] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');

    if (data) setProducts(data);
  };

  const handleSave = async () => {
    if (!name || !price) return;

    if (editingProduct) {
      await supabase
        .from('products')
        .update({ name, price: Number(price) })
        .eq('id', editingProduct.id);
    } else {
      await supabase
        .from('products')
        .insert({ name, price: Number(price) });
    }

    setShowModal(false);
    setName('');
    setPrice('');
    setEditingProduct(null);
    loadProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id);
    loadProducts();
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setShowModal(true);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-3 md:p-4 lg:p-8 max-h-screen overflow-y-auto">
      <div className="max-w-4xl mx-auto">
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
          Produtos
        </h1>

        {/* Campo de Busca Rápida */}
        <div className="mb-3 sm:mb-4 md:mb-6">
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

        <button
          onClick={openNewProductModal}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8 shadow-2xl transform transition hover:scale-105 active:scale-95"
        >
          <Plus className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 mx-auto mb-1 sm:mb-2 md:mb-3" strokeWidth={3} />
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold">Adicionar Produto</p>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-8 md:py-12 animate-fade-in">
              <p className="text-lg md:text-xl text-slate-500">
                {searchProduct ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              </p>
            </div>
          ) : (
            filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl border-4 border-slate-200 card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800 mb-2 sm:mb-3 md:mb-4 truncate">{product.name}</h3>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-green-600 mb-3 sm:mb-4 md:mb-6">
                  R$ {Number(product.price).toFixed(2)}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 flex items-center justify-center gap-1.5 sm:gap-2 transition transform active:scale-95"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                    <span className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold">Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 flex items-center justify-center gap-1.5 sm:gap-2 transition transform active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                    <span className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold">Excluir</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-3 md:p-4 z-50 animate-modal-backdrop">
            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-8 max-w-md w-full mx-2 shadow-2xl max-h-[95vh] overflow-y-auto animate-modal-content">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 mb-3 sm:mb-4 md:mb-6">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>

              <div className="mb-3 sm:mb-4 md:mb-6">
                <label className="block text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-slate-700 mb-1.5 sm:mb-2 md:mb-3">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl p-2.5 sm:p-3 md:p-4 border-4 border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl focus:border-blue-500 focus:outline-none"
                  placeholder="Ex: Pastel"
                  autoFocus
                />
              </div>

              <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
                <label className="block text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-slate-700 mb-1.5 sm:mb-2 md:mb-3">
                  Preço
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl p-2.5 sm:p-3 md:p-4 border-4 border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    setName('');
                    setPrice('');
                  }}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 active:bg-slate-500 text-slate-800 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-5 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold transition transform active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-5 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold transition transform active:scale-95"
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
