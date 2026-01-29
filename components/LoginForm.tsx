
import React, { useState } from 'react';
import { auth } from '../services/auth';
import { Button, Input, Label } from './Shared';
import { Lock, Shield, User, ArrowRight, Activity, Command, Hexagon, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-indigo-600/10 rounded-[100%] blur-[120px] opacity-30 animate-pulse"></div>
         <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/10 rounded-[100%] blur-[100px] opacity-20"></div>
         {/* Grid Pattern Overlay */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-10 animate-fade-in">
           <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/20 mb-6 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Command className="text-white w-7 h-7 relative z-10" strokeWidth={2} />
           </div>
           <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2 flex items-center justify-center gap-2">
             ApexJob <span className="text-indigo-400 font-mono text-lg opacity-80">OS</span>
           </h1>
           <p className="text-text-muted text-xs font-medium tracking-wider uppercase">Strategic Career Command</p>
        </div>

        {/* Auth Card */}
        <div className="backdrop-blur-xl bg-surface/50 border border-border rounded-3xl p-1 shadow-2xl animate-scale-in">
          <div className="bg-surface rounded-[20px] p-6 md:p-8 border border-border relative overflow-hidden">
            {/* Gloss Effect */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            {/* Toggle Switch */}
            <div className="flex bg-surface-highlight p-1 rounded-xl mb-8 border border-border relative">
              <div 
                className={`absolute inset-y-1 w-[calc(50%-4px)] bg-primary-600/20 border border-primary-500/30 rounded-lg transition-all duration-300 ease-out shadow-lg shadow-primary-500/10 ${isLogin ? 'left-1' : 'left-[calc(50%)]'}`}
              ></div>
              <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest relative z-10 transition-colors duration-300 ${isLogin ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest relative z-10 transition-colors duration-300 ${!isLogin ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg font-medium flex items-start gap-2 animate-fade-in">
                  <Activity size={14} className="mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {!isLogin && (
                <div className="space-y-1.5 animate-slide-up">
                  <Label className="text-text-muted">Identity</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-400 transition-colors" size={16} />
                    <Input 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="Full Name"
                      className="bg-surface-highlight border-border text-text-primary placeholder:text-text-muted pl-10 focus:border-primary-500 focus:ring-primary-500/20 h-11"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-text-muted">Credentials</Label>
                <div className="relative group">
                   <Hexagon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-400 transition-colors" size={16} />
                   <Input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="email@domain.com"
                    className="bg-surface-highlight border-border text-text-primary placeholder:text-text-muted pl-10 focus:border-primary-500 focus:ring-primary-500/20 h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-400 transition-colors" size={16} />
                  <Input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Password"
                    className="bg-surface-highlight border-border text-text-primary placeholder:text-text-muted pl-10 focus:border-primary-500 focus:ring-primary-500/20 h-11"
                  />
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-primary-600 to-indigo-500 hover:from-primary-500 hover:to-indigo-400 text-white shadow-lg shadow-primary-900/20 border border-primary-400/20 mt-4 group" 
                size="md" 
                isLoading={isLoading}
              >
                <span className="mr-2 font-bold tracking-wide">{isLogin ? 'Initialize Session' : 'Create Identity'}</span>
                {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform opacity-70" />}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer Status */}
        <div className="mt-8 flex justify-center items-center gap-6 opacity-60">
           <div className="flex items-center gap-2">
              <Shield size={12} className="text-emerald-500" />
              <span className="text-[10px] font-mono font-medium text-text-muted">AES-256 Encrypted</span>
           </div>
           <div className="w-1 h-1 rounded-full bg-border"></div>
           <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-primary-500" />
              <span className="text-[10px] font-mono font-medium text-text-muted">v3.0.0 Stable</span>
           </div>
        </div>
      </div>
    </div>
  );
};
