import React, { useState } from 'react';
import axios from 'axios';
import { Zap, Lock, User, AlertCircle } from 'lucide-react';
import { AeroButton, cn } from './ui/AeroUI';

const API_BASE = 'http://localhost:3001/api/v1';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
      onLoginSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] anima-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px] anima-pulse" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/60 backdrop-blur-2xl p-10 rounded-[40px] border border-white/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-6">
              <Zap className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">Bienvenido</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">CapacitaFlow Admin Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Usuario</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/80 border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder:text-slate-300 shadow-sm"
                  placeholder="admin / contra1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/80 border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder:text-slate-300 shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in duration-300">
                <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? 'Iniciando...' : 'Entrar al Sistema'}
            </button>
          </form>

          <div className="mt-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            © 2026 CapacitaFlow / Grupo OVAL
          </div>
        </div>
      </div>
    </div>
  );
}
