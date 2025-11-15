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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'products':
        return <ProductManager onBack={() => setCurrentView('dashboard')} />;
      case 'sales':
        return <SalesView onBack={() => setCurrentView('dashboard')} />;
      case 'clients':
        return <ClientsView onBack={() => setCurrentView('dashboard')} />;
      case 'reservations':
        return <ReservationsView onBack={() => setCurrentView('dashboard')} />;
      case 'history':
        return <HistoryView onBack={() => setCurrentView('dashboard')} />;
      case 'debtSale':
        return <DebtSaleView onBack={() => setCurrentView('dashboard')} />;
          default:
            return <Dashboard onNavigate={(view) => setCurrentView(view as View)} onLogout={handleLogout} />;
    }
  };

  return <>{renderView()}</>;
}

export default App;
