import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import SalesView from './components/SalesView';
import ClientsView from './components/ClientsView';
import ReservationsView from './components/ReservationsView';
import HistoryView from './components/HistoryView';
import DebtSaleView from './components/DebtSaleView';
import Login from './components/Login';
import { supabase } from './lib/supabase';

type View = 'dashboard' | 'products' | 'sales' | 'clients' | 'reservations' | 'history' | 'debtSale';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual do Supabase
    checkSession();

    // Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setIsAuthenticated(true);
          localStorage.setItem('user_email', session.user.email || '');
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('user_email');
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      // Verificar se as variáveis de ambiente estão configuradas
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
        setIsLoading(false);
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setIsAuthenticated(false);
      } else if (session?.user) {
        setIsAuthenticated(true);
        localStorage.setItem('user_email', session.user.email || '');
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    // A autenticação já foi feita no componente Login
    // Este callback apenas força a atualização
    checkSession();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      localStorage.removeItem('user_email');
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center animate-fade-in">
        <div className="text-white text-2xl font-bold animate-pulse-slow">Carregando...</div>
      </div>
    );
  }

  // Verificar se as variáveis de ambiente estão configuradas
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-600 to-red-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">⚠️ Erro de Configuração</h1>
          <p className="text-lg text-slate-700 mb-4">
            As variáveis de ambiente do Supabase não estão configuradas.
          </p>
          <div className="bg-slate-100 rounded-2xl p-4 text-left mb-4">
            <p className="text-sm font-semibold mb-2">Configure na Vercel:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• VITE_SUPABASE_URL</li>
              <li>• VITE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
          <p className="text-sm text-slate-500">
            Consulte o arquivo CONFIGURAR_VERCEL.md para mais detalhes.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'products':
        return <div className="animate-fade-in-up"><ProductManager onBack={() => setCurrentView('dashboard')} /></div>;
      case 'sales':
        return <div className="animate-fade-in-up"><SalesView onBack={() => setCurrentView('dashboard')} /></div>;
      case 'clients':
        return <div className="animate-fade-in-up"><ClientsView onBack={() => setCurrentView('dashboard')} /></div>;
      case 'reservations':
        return <div className="animate-fade-in-up"><ReservationsView onBack={() => setCurrentView('dashboard')} /></div>;
      case 'history':
        return <div className="animate-fade-in-up"><HistoryView onBack={() => setCurrentView('dashboard')} /></div>;
      case 'debtSale':
        return <div className="animate-fade-in-up"><DebtSaleView onBack={() => setCurrentView('dashboard')} /></div>;
          default:
            return <div className="animate-fade-in"><Dashboard onNavigate={(view) => setCurrentView(view as View)} onLogout={handleLogout} /></div>;
    }
  };

  return <>{renderView()}</>;
}

export default App;
