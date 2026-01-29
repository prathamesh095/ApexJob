
import React, { useState } from 'react';
import { auth } from '../services/auth';
import { Button, Input, Label } from './Shared';
import { Lock, Shield, User, ArrowRight, Activity, Command, Hexagon } from 'lucide-react';

export const LoginForm: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await auth.login(email, password);
      } else {
        await auth.signup(name, email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Optimized CSS Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 animate-spin-slow opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header Logo Area */}
        <div className="text-center mb-8 relative">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-500/30 mb-6 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Command className="text-white w-8 h-8 relative z-10" strokeWidth={1.5} />
              {/* Spinning Ring */}
              <div className="absolute -inset-1 rounded-3xl border border-indigo-500/30 border-dashed animate-[spin_10s_linear_infinite]"></div>
           </div>
           <h1 className="text-3xl font-black text-white tracking-tight mb-2">ApexJob <span className="text-indigo-500">OS</span></h1>
           <p className="text-slate-400 text-sm font-medium tracking-wide">Career Intelligence Platform</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-1 shadow-2xl">
          <div className="bg-slate-950/50 rounded-[20px] p-6 md:p-8 border border-white/5">
            
            {/* Tab Switcher */}
            <div className="flex bg-slate-900/80 p-1 rounded-xl mb-8 border border-white/5">
              <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Access
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${!isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Initialize
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl font-medium flex items-center animate-in slide-in-from-top-2">
                  <Activity size={14} className="mr-2 flex-shrink-0 animate-pulse" />
                  {error}
                </div>
              )}

              {!isLogin && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-left-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-400">Identity Alias</Label>
                  </div>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                    <Input 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="Enter full name"
                      className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 pl-10 focus:border-indigo-500 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-slate-400">Secure Protocol ID</Label>
                <div className="relative group">
                   <Hexagon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                   <Input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="name@domain.com"
                    className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 pl-10 focus:border-indigo-500 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-400">Passkey</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                  <Input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 pl-10 focus:border-indigo-500 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <Button 
                type="button" // Change to submit
                onClick={handleSubmit}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-900/50 border-0 mt-2 group" 
                size="lg" 
                isLoading={isLoading}
              >
                <span className="mr-2">{isLogin ? 'Authenticate' : 'Establish Link'}</span>
                {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer Status */}
        <div className="mt-8 flex justify-between items-center px-4">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">System Nominal</span>
           </div>
           <div className="flex items-center gap-2 text-slate-600">
              <Shield size={12} />
              <span className="text-[10px] font-mono font-medium">E2E Encrypted</span>
           </div>
        </div>
      </div>
    </div>
  );
};
