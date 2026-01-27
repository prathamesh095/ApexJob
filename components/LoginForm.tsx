
import React, { useState } from 'react';
import { auth } from '../services/auth';
import { Button, Input, Label, Card } from './Shared';
import { Lock, ShieldCheck, UserPlus, KeyRound } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-[1px] border-white/20 rounded-full animate-pulse"></div>
      </div>

      <Card className="w-full max-w-md p-8 relative z-10 bg-white shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
            {isLogin ? <Lock className="text-white" size={32} /> : <UserPlus className="text-white" size={32} />}
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            {isLogin ? 'ApexJob Portal' : 'Initialize Identity'}
          </h1>
          <p className="text-slate-500 text-sm">Secure Career Intelligence Environment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-lg font-medium flex items-center animate-in fade-in slide-in-from-top-1">
              <ShieldCheck size={14} className="mr-2" />
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <Label>Full Name</Label>
              <Input 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Operational Alias"
                className="bg-slate-50 border-slate-200"
              />
            </div>
          )}

          <div>
            <Label>Station Email</Label>
            <Input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="operator@apex.net"
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div>
            <Label>Access Key</Label>
            <div className="relative">
              <Input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="bg-slate-50 border-slate-200 pr-10"
              />
              <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            </div>
            {!isLogin && <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Minimum 8 characters required</p>}
          </div>

          <Button type="submit" className="w-full h-11" size="lg" isLoading={isLoading}>
            {isLogin ? 'Initialize Session' : 'Commit Identity'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
          >
            {isLogin ? 'Request New Identity' : 'Return to Login Gate'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center space-x-4">
            <div className="flex items-center text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                System Online
            </div>
            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
            <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">v1.1.0-Hardened</div>
        </div>
      </Card>
    </div>
  );
};
