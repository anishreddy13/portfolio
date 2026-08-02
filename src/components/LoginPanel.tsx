import React, { useState } from 'react';

interface LoginPanelProps {
  onLogin: (username: string, password: string) => void;
  isLoading: boolean;
}

export function LoginPanel({ onLogin, isLoading }: LoginPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username) {
      onLogin(username, password);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
      <div className="p-8 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-[400px]">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
            EA
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Enterprise Access</h2>
        <p className="text-slate-400 text-sm text-center mb-4">Sign in to your trading workspace</p>
        {/* Demo mode notice — authentication is mocked. Replace useIdentity with a real API call before production deployment. */}
        <div className="flex items-center justify-center gap-2 mb-5 px-3 py-1.5 bg-amber-900/30 border border-amber-700/40 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span className="text-xs text-amber-300 font-medium">Demo Mode — credentials are not validated</span>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input 
              type="text" 
              className="w-full p-2.5 bg-slate-800 rounded border border-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full p-2.5 bg-slate-800 rounded border border-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
