import React, { useState } from 'react';
import { School, Shield, User, Key, ArrowRight, Info } from 'lucide-react';
import { UserSession } from '../types';

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
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-800">
          XYZ School Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-mono">
          Intelligent Scheduling & Timetable ERP
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-100 sm:px-10">
          {/* Role selector tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6">
            <button
              onClick={() => { setRole('admin'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                role === 'admin'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="login-role-admin"
              type="button"
            >
              <Shield className="h-4 w-4" />
              Administrator
            </button>
            <button
              onClick={() => { setRole('teacher'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                role === 'teacher'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="login-role-teacher"
              type="button"
            >
              <User className="h-4 w-4" />
              Teacher Portal
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                School Email
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
                  placeholder={role === 'admin' ? 'admin@xyz.edu' : 'teacher@xyz.edu'}
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
            <p className="text-xs text-slate-400 font-medium mb-3 flex items-center justify-center gap-1">
              <Info className="h-3 w-3" /> Click below to load demo accounts:
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="text-xs px-2.5 py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100 font-semibold"
                id="login-demo-admin"
              >
                Admin Credentials
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('teacher')}
                className="text-xs px-2.5 py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100 font-semibold"
                id="login-demo-teacher"
              >
                Teacher Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
