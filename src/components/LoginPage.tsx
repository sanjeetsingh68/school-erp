import React, { useState } from 'react';
import { School, Shield, User, Key, ArrowRight, Info } from 'lucide-react';
import { UserSession } from '../types';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'superadmin' | 'principal' | 'teacher'>('principal');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFillDemo = (type: 'superadmin' | 'principal_xyz' | 'principal_abc' | 'teacher') => {
    setError(null);
    if (type === 'superadmin') {
      setRole('superadmin');
      setEmail('superadmin@erp.com');
      setPassword('super123');
    } else if (type === 'principal_xyz') {
      setRole('principal');
      setEmail('admin@xyz.edu');
      setPassword('admin123');
    } else if (type === 'principal_abc') {
      setRole('principal');
      setEmail('principal@abc.edu');
      setPassword('admin123');
    } else {
      setRole('teacher');
      setEmail('aaravsharma@xyz.edu');
      setPassword('teach123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative ambient background curves */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 -translate-x-12 -translate-y-12"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 translate-x-12 translate-y-12"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 text-white animate-bounce">
            <School className="h-10 w-10" id="login-logo-icon" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-800">
          XYZ SaaS School ERP
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-mono">
          Intelligent Multi-Tenant Scheduling & Portal System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-100 sm:px-10">
          {/* Role selector tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs gap-1">
            <button
              onClick={() => { setRole('superadmin'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg transition-all font-bold ${
                role === 'superadmin'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-850'
              }`}
              id="login-role-superadmin"
              type="button"
            >
              <Shield className="h-3.5 w-3.5" />
              Super Admin
            </button>
            <button
              onClick={() => { setRole('principal'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg transition-all font-bold ${
                role === 'principal'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-850'
              }`}
              id="login-role-admin"
              type="button"
            >
              <School className="h-3.5 w-3.5" />
              Principal
            </button>
            <button
              onClick={() => { setRole('teacher'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg transition-all font-bold ${
                role === 'teacher'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-850'
              }`}
              id="login-role-teacher"
              type="button"
            >
              <User className="h-3.5 w-3.5" />
              Teacher
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Login Email
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
                    role === 'superadmin' 
                      ? 'superadmin@erp.com' 
                      : role === 'principal' 
                        ? 'admin@xyz.edu' 
                        : 'aaravsharma@xyz.edu'
                  }
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                  id="login-email-input"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Password
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
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
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
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-100 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50"
                id="login-submit-button"
              >
                {isLoading ? 'Verifying...' : 'Access ERP'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </form>

          {/* Quick Demo Assist */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-bold mb-3 flex items-center justify-center gap-1">
              <Info className="h-3 w-3" /> Quick-Fill Evaluation Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <button
                type="button"
                onClick={() => handleFillDemo('superadmin')}
                className="text-[10px] px-2 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition-colors border border-slate-100 font-bold"
                id="login-demo-superadmin"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('principal_xyz')}
                className="text-[10px] px-2 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition-colors border border-slate-100 font-bold"
                id="login-demo-principal-xyz"
              >
                XYZ Principal
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('principal_abc')}
                className="text-[10px] px-2 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition-colors border border-slate-100 font-bold"
                id="login-demo-principal-abc"
              >
                ABC Principal
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('teacher')}
                className="text-[10px] px-2 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition-colors border border-slate-100 font-bold"
                id="login-demo-teacher"
              >
                Teacher (XYZ)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
