import { Plus, Edit, Trash2, ArrowLeft, Home } from 'lucide-react';
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
          Produtos
        </h1>

        <button
          onClick={openNewProductModal}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl md:rounded-3xl p-6 md:p-8 mb-6 md:mb-8 shadow-2xl transform transition hover:scale-105 active:scale-95"
        >
          <Plus className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-3" strokeWidth={3} />
          <p className="text-2xl md:text-3xl font-bold">Adicionar Produto</p>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {products.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl border-4 border-slate-200"
            >
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3 md:mb-4">{product.name}</h3>
              <p className="text-3xl md:text-4xl font-bold text-green-600 mb-4 md:mb-6">
                R$ {Number(product.price).toFixed(2)}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-3 md:p-4 flex items-center justify-center gap-2 transition transform hover:scale-105"
                >
                  <Edit className="w-5 h-5 md:w-7 md:h-7" />
                  <span className="text-base md:text-xl font-semibold">Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl p-3 md:p-4 flex items-center justify-center gap-2 transition transform hover:scale-105"
                >
                  <Trash2 className="w-5 h-5 md:w-7 md:h-7" />
                  <span className="text-base md:text-xl font-semibold">Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50">
            <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 md:mb-6">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>

              <div className="mb-4 md:mb-6">
                <label className="block text-xl md:text-2xl font-semibold text-slate-700 mb-2 md:mb-3">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-lg md:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none"
                  placeholder="Ex: Pastel"
                />
              </div>

              <div className="mb-6 md:mb-8">
                <label className="block text-xl md:text-2xl font-semibold text-slate-700 mb-2 md:mb-3">
                  Preço
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full text-lg md:text-2xl p-3 md:p-4 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-2xl p-4 md:p-5 text-lg md:text-2xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-2xl p-4 md:p-5 text-lg md:text-2xl font-semibold transition"
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
