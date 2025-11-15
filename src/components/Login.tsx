import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Autenticar com Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message || 'Email ou senha incorretos');
        setLoading(false);
        return;
      }

      if (data.user) {
        // Salvar informações do usuário
        localStorage.setItem('user_email', data.user.email || email);
        onLogin();
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      console.error('Login error:', err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <img 
            src="/logos/logo01.png" 
            alt="Vida Cantina" 
            className="mx-auto max-w-48 h-auto mb-6 object-contain"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">
            Vida Cantina
          </h1>
          <p className="text-xl text-slate-600">
            Sistema de Gestão
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-3">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full text-xl p-4 pl-14 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none"
                placeholder="Digite seu email"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-3">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full text-xl p-4 pl-14 border-4 border-slate-300 rounded-2xl focus:border-blue-500 focus:outline-none"
                placeholder="Digite sua senha"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-4 border-red-300 rounded-2xl p-4">
              <p className="text-red-700 font-semibold text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl p-5 text-2xl font-bold transition transform hover:scale-105 active:scale-95 shadow-lg"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  );
}

