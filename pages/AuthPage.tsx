import React, { useState } from 'react';
import { login, register } from '../services/mockDataService';
import { User } from '../types';
import { Activity, ShieldCheck } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

export const AuthPage: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        if (isLogin) {
            const user = await login(username, password);
            onLogin(user);
        } else {
            const user = await register(username, email, password);
            onLogin(user); // Auto login after register
        }
    } catch (err: any) {
        setError(err.message || 'Error de autenticación');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="bg-slate-900 p-6 text-center">
            <div className="mx-auto bg-teal-500 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <Activity className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Desafío Saludable</h1>
            <p className="text-slate-400 text-sm">Combate el sedentarismo con amigos</p>
        </div>
        
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Usuario</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full border-b-2 border-slate-200 p-2 outline-none focus:border-teal-500 transition-colors"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                </div>
                
                {!isLogin && (
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full border-b-2 border-slate-200 p-2 outline-none focus:border-teal-500 transition-colors"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contraseña</label>
                    <input 
                        type="password" 
                        required 
                        className="w-full border-b-2 border-slate-200 p-2 outline-none focus:border-teal-500 transition-colors"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</p>}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 mt-4"
                >
                    {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-sm text-teal-600 font-medium hover:underline"
                >
                    {isLogin ? '¿No tienes cuenta? Crea una' : '¿Ya tienes cuenta? Ingresa'}
                </button>
            </div>
        </div>
        
        {/* Admin Tip */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck size={12}/> Admin Demo: admin / admin1234
            </p>
        </div>
      </div>
    </div>
  );
};