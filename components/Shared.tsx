
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading,
  ...props 
}) => {
  const base = "inline-flex items-center justify-center font-medium transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
    {children}
  </span>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input: React.FC<InputProps> = ({ error, ...props }) => (
  <div className="w-full">
    <input 
      {...props} 
      className={`w-full px-3 py-2 bg-white border rounded-lg text-sm transition-all outline-none 
        ${error ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'} 
        ${props.className || ''}`} 
    />
    {error && <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{error}</p>}
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ error, ...props }) => (
  <div className="w-full">
    <textarea 
      {...props} 
      className={`w-full px-3 py-2 bg-white border rounded-lg text-sm transition-all outline-none 
        ${error ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'} 
        ${props.className || ''}`} 
    />
    {error && <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{error}</p>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ error, ...props }) => (
  <div className="w-full">
    <select 
      {...props} 
      className={`w-full px-3 py-2 bg-white border rounded-lg text-sm transition-all outline-none 
        ${error ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'} 
        ${props.className || ''}`} 
    />
    {error && <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{error}</p>}
  </div>
);

export const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3 cursor-pointer group">
    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`}>
      {checked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>}
    </div>
    <span className="text-sm font-medium text-slate-700 select-none">{label}</span>
    <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
  </label>
);

export const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
    {children}
    {required && <span className="text-rose-500 ml-1 font-black">*</span>}
  </label>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' }> = ({ 
  isOpen, onClose, title, children, size = 'md'
}) => {
  if (!isOpen) return null;
  const sizes = { md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} overflow-hidden animate-in fade-in zoom-in duration-200 my-8`}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl transition-colors">&times;</button>
        </div>
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
