import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { Attachment } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass' | 'gradient' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
  const base = "inline-flex items-center justify-center font-bold transition-all duration-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden";
  
  const variants = {
    primary: "bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:shadow-primary-500/40 border border-transparent",
    accent: "bg-accent-500 text-white shadow-lg shadow-accent-500/30 hover:bg-accent-600 hover:shadow-accent-500/40 border border-transparent",
    gradient: "text-white shadow-lg shadow-primary-500/30 bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-500 hover:to-accent-400 border-none",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm focus:ring-slate-200 hover:text-primary-600",
    danger: "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white hover:shadow-rose-500/30 focus:ring-rose-500",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100/50 hover:text-primary-700 focus:ring-slate-200",
    glass: "bg-white/40 backdrop-blur-md border border-white/50 text-slate-700 hover:bg-white/60 shadow-sm hover:text-primary-700"
  };

  const sizes = {
    xs: "px-2.5 py-1 text-[10px]",
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {variant === 'gradient' && (
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer pointer-events-none"></div>
      )}
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      <span className="relative z-10 flex items-center">{children}</span>
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; hoverEffect?: boolean; noPadding?: boolean }> = ({ 
  children, 
  className = '', 
  hoverEffect = false,
  noPadding = false 
}) => (
  <div className={`bg-white rounded-3xl border border-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden
    ${hoverEffect ? 'hover:shadow-[0_20px_40px_-10px_rgba(124,58,237,0.1)] hover:-translate-y-1 hover:border-primary-100' : ''} 
    ${noPadding ? 'p-0' : 'p-6'} 
    ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <span 
    onClick={onClick}
    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border select-none transition-all duration-200 shadow-sm ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
  >
    {children}
  </span>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ error, icon, ...props }) => (
  <div className="w-full group">
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">{icon}</div>}
      <input 
        {...props} 
        className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all duration-200 outline-none
          focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 hover:border-primary-300 text-slate-700 placeholder:text-slate-400 shadow-sm
          ${error ? 'border-rose-300 ring-4 ring-rose-50 bg-rose-50/10 text-rose-900 placeholder:text-rose-300' : ''} 
          ${props.className || ''}`} 
      />
    </div>
    {error && <p className="mt-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1 animate-in slide-in-from-top-1">
      <span className="w-1 h-1 bg-rose-500 rounded-full"></span> {error}
    </p>}
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ error, ...props }) => (
  <div className="w-full">
    <textarea 
      {...props} 
      className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all duration-200 outline-none
        focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 hover:border-primary-300 text-slate-700 placeholder:text-slate-400 shadow-sm
        ${error ? 'border-rose-300 ring-4 ring-rose-50 bg-rose-50/10' : ''} 
        ${props.className || ''}`} 
    />
    {error && <p className="mt-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1">
      <span className="w-1 h-1 bg-rose-500 rounded-full"></span> {error}
    </p>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ error, ...props }) => (
  <div className="w-full relative">
    <select 
      {...props} 
      className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all duration-200 outline-none appearance-none cursor-pointer
        focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 hover:border-primary-300 text-slate-700 shadow-sm
        ${error ? 'border-rose-300' : ''} 
        ${props.className || ''}`} 
    />
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"></path></svg>
    </div>
    {error && <p className="mt-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1">
      <span className="w-1 h-1 bg-rose-500 rounded-full"></span> {error}
    </p>}
  </div>
);

export const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3 cursor-pointer group select-none p-2 rounded-lg hover:bg-slate-50 transition-colors">
    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 shadow-sm ${checked ? 'bg-primary-600 border-primary-600 scale-110' : 'bg-white border-slate-300 group-hover:border-primary-400'}`}>
      {checked && <svg className="w-3.5 h-3.5 text-white animate-in zoom-in duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
    <span className={`text-sm font-medium transition-colors ${checked ? 'text-primary-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>{label}</span>
    <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
  </label>
);

export const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
    {children}
    {required && <span className="text-rose-500 ml-1" title="Required">*</span>}
  </label>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' }> = ({ 
  isOpen, onClose, title, children, size = 'md'
}) => {
  if (!isOpen) return null;
  const sizes = { md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className={`glass-panel bg-white/95 rounded-3xl shadow-2xl w-full ${sizes[size]} overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 my-8 border border-white/50 ring-1 ring-black/5`}>
        <div className="px-8 py-6 border-b border-slate-100/50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export const DeleteModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  description: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, title, description }) => {
  const [confirmation, setConfirmation] = React.useState('');
  
  React.useEffect(() => {
    if (isOpen) setConfirmation('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed = confirmation.trim().toUpperCase() === 'DELETE';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-100/50 ring-4 ring-rose-50/50 scale-100 animate-in zoom-in-95 duration-200 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600"></div>
        <div className="px-8 py-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-rose-100">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{title}</h3>
          <div className="text-sm text-slate-500 leading-relaxed font-medium mb-8">
            {description}
          </div>
          
          <div className="space-y-3 w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left mb-2">
              Security Confirmation
            </label>
            <input 
              type="text" 
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-rose-500 outline-none font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-bold text-center uppercase tracking-widest bg-white transition-colors"
              placeholder="Type DELETE"
              autoFocus
            />
          </div>

          <div className="flex w-full gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => { if (isConfirmed) onConfirm(); }}
              disabled={!isConfirmed}
              className={`flex-1 px-4 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-lg
                ${isConfirmed 
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 hover:shadow-rose-500/30 active:scale-95 cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- FILE UPLOAD COMPONENT ---
interface FileUploadProps {
  onUpload: (attachment: Attachment) => void;
  maxSizeInKB?: number;
  allowedMimeTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onUpload, 
  maxSizeInKB = 300,
  allowedMimeTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'text/plain'
  ]
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mimeToExt: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
    'image/jpeg': '.jpg',
    'image/png': '.png'
  };

  const getReadableExtensions = () => {
    const exts = allowedMimeTypes.map(m => mimeToExt[m] || m.split('/')[1]);
    return [...new Set(exts)].join(', ').toUpperCase();
  };

  const validateFile = (file: File): string | null => {
    if (!allowedMimeTypes.includes(file.type)) {
      return `Invalid type. Allowed: ${getReadableExtensions()}`;
    }
    if (file.size > maxSizeInKB * 1024) {
      return `Too large. Limit: ${maxSizeInKB}KB.`;
    }
    return null;
  };

  const processFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const attachment: Attachment = {
          id: crypto.randomUUID(),
          name: sanitizedName,
          type: file.type,
          size: file.size,
          data: dataUrl,
          uploadedAt: Date.now()
        };
        onUpload(attachment);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setError("Read failed.");
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="w-full">
      <div 
        className={`relative group w-full h-32 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
          ${dragActive ? 'border-primary-500 bg-primary-50/50 scale-[1.01] shadow-lg' : 'border-slate-200 border-dashed hover:border-primary-400 hover:bg-slate-50 bg-slate-50/30'}
          ${error ? 'border-rose-300 bg-rose-50/10' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          onChange={(e) => { if(e.target.files?.[0]) processFile(e.target.files[0]); }}
          accept={allowedMimeTypes.join(',')}
          disabled={isProcessing}
        />
        
        {isProcessing ? (
           <div className="flex flex-col items-center text-primary-600">
             <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2"></div>
             <p className="text-[10px] font-bold uppercase tracking-widest">Encrypting...</p>
           </div>
        ) : (
           <>
            <div className={`p-3 rounded-xl mb-2 transition-all duration-300 ${dragActive ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-slate-400 shadow-sm group-hover:scale-110 group-hover:text-primary-600'}`}>
              <UploadCloud size={20} />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Drop file or <span className="text-primary-600 hover:underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
              {getReadableExtensions()}
            </p>
           </>
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-center text-[10px] font-bold text-rose-500 uppercase tracking-wide animate-in fade-in slide-in-from-top-1 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
          <AlertCircle size={12} className="mr-2" />
          {error}
        </div>
      )}
    </div>
  );
};