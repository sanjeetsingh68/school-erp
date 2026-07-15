import React, { useState } from 'react';
import { School, Shield, User, Key, ArrowRight, Info, Sparkles } from 'lucide-react';
import { UserSession } from '../types';
import { apiFetch } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher'>('admin');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFillDemo = (type: 'admin' | 'teacher') => {
    setError(null);
    if (type === 'admin') {
      setRole('admin');
      setEmail('admin@xyz.edu');
      setPassword('admin123');
    } else {
      setRole('teacher');
      setEmail('aaravsharma@xyz.edu');
      setPassword('teach123');
    }
  };

  const handleLoginAsDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@school.com', password: 'demo123', role: 'admin' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      onLoginSuccess(data.session);
    } catch (err: any) {
      setError(err.message || 'Server connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLoginSuccess(data.session);
    } catch (err: any) {
      setError(err.message || 'Server connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F1]/40 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative ambient background curves */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#FED7AA]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 -translate-x-12 -translate-y-12"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FED7AA]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 translate-x-12 translate-y-12"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="p-3 bg-[#F59E0B] rounded-2xl shadow-xl shadow-amber-500/20 text-white animate-bounce">
            <School className="h-9 w-9" id="login-logo-icon" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-2xl font-black tracking-tight text-slate-900">
          Aura Academic Control
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">
          Intelligent Automatic Substitution & Scheduling
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-150 sm:px-10">
          {/* Role selector tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs gap-1">
            <button
              onClick={() => { setRole('admin'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all font-bold ${
                role === 'admin'
                  ? 'bg-white text-[#F59E0B] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="login-role-admin"
              type="button"
            >
              <Shield className="h-3.5 w-3.5" />
              Administrator
            </button>
            <button
              onClick={() => { setRole('teacher'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all font-bold ${
                role === 'teacher'
                  ? 'bg-white text-[#F59E0B] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="login-role-teacher"
              type="button"
            >
              <User className="h-3.5 w-3.5" />
              Teacher Portal
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Portal Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={
                    role === 'admin' 
                      ? 'admin@aura-academic.com' 
                      : 'teacher@aura-academic.com'
                  }
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent text-xs transition-all"
                  id="login-email-input"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Secret PIN / Password
                </label>
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent text-xs transition-all"
                  id="login-password-input"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-100 text-xs font-bold text-white bg-[#F59E0B] hover:bg-[#FBBF24] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F59E0B] transition-all cursor-pointer disabled:opacity-50"
                id="login-submit-button"
              >
                {isLoading ? 'Verifying Credentials...' : 'Access Portal'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </form>

          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or explore demo</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleLoginAsDemo}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-100 text-xs font-bold text-white bg-[#F59E0B]/90 hover:bg-[#FBBF24] focus:outline-none focus:ring-2 focus:ring-[#F59E0B] transition-all cursor-pointer disabled:opacity-50"
              id="login-demo-button"
            >
              <Sparkles className="mr-2 h-4 w-4 animate-pulse text-amber-200" />
              Try Demo (Single-Click)
            </button>
          </div>

          {/* Quick Demo Assist */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-bold mb-3 flex items-center justify-center gap-1">
              <Info className="h-3.5 w-3.5" /> Quick-Fill Demo Portals:
            </p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="text-[10px] px-2 py-1.5 bg-[#FFF8F1] hover:bg-[#FED7AA]/30 text-slate-700 hover:text-[#F59E0B] rounded-lg transition-colors border border-slate-150 font-bold"
                id="login-demo-admin"
              >
                Administrator
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('teacher')}
                className="text-[10px] px-2 py-1.5 bg-[#FFF8F1] hover:bg-[#FED7AA]/30 text-slate-700 hover:text-[#F59E0B] rounded-lg transition-colors border border-slate-150 font-bold"
                id="login-demo-teacher"
              >
                Teacher Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
