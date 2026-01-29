
import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, Bell, Trash2, CheckCircle, Info, Inbox, Search, ArrowUpRight } from 'lucide-react';
import { Attachment, Notification } from '../types';

// --- EMPTY STATE COMPONENT ---
interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-surface/30 h-full min-h-[300px] animate-fade-in">
    <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center text-text-muted mb-4 border border-border">
      <Icon size={32} strokeWidth={1.5} />
    </div>
    <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
    <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">{description}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// --- SYSTEM BUTTON ---
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
  const base = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background relative overflow-hidden active:scale-[0.98]";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-900/20 border border-transparent focus:ring-primary-500",
    accent: "bg-accent-600 text-white hover:bg-accent-500 shadow-lg shadow-accent-900/20 border border-transparent focus:ring-accent-500",
    gradient: "text-white bg-gradient-to-r from-primary-600 to-indigo-500 hover:from-primary-500 hover:to-indigo-400 border border-white/5 shadow-glow",
    secondary: "bg-surface-highlight text-text-secondary border border-border hover:bg-border-strong hover:text-text-primary focus:ring-zinc-500",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 focus:ring-red-500",
    ghost: "bg-transparent text-text-muted hover:text-text-primary hover:bg-surface-highlight focus:ring-zinc-500",
    glass: "glass-button text-text-secondary shadow-sm backdrop-blur-md"
  };

  const sizes = {
    xs: "px-2.5 py-1 text-[10px] tracking-wide uppercase font-bold",
    sm: "px-3 py-1.5 text-xs font-medium",
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
      <span className="relative z-10 flex items-center">{children}</span>
    </button>
  );
};

// --- SYSTEM CARD ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; hoverEffect?: boolean; noPadding?: boolean }> = React.memo(({ 
  children, 
  className = '', 
  hoverEffect = false,
  noPadding = false 
}) => (
  <div className={`bg-surface border border-border rounded-xl overflow-hidden transition-all duration-300 
    ${hoverEffect ? 'hover:border-primary-500/20 hover:shadow-soft' : ''} 
    ${noPadding ? 'p-0' : 'p-5'} 
    ${className}`}>
    {children}
  </div>
));

// --- SYSTEM BADGE ---
export const Badge: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <span 
    onClick={onClick}
    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider select-none transition-all duration-200 
      ${onClick ? 'cursor-pointer hover:brightness-110 active:scale-95' : ''} ${className}`}
  >
    {children}
  </span>
);

// --- SYSTEM INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ error, icon, className = '', ...props }) => (
  <div className="w-full group">
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-400 transition-colors">{icon}</div>}
      <input 
        {...props} 
        className={`w-full ${icon ? 'pl-10' : 'px-3'} py-2.5 bg-surface-highlight border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted transition-all duration-200 outline-none
          focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 hover:border-border-strong
          ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''} 
          ${className}`} 
      />
    </div>
    {error && <p className="mt-1.5 text-[10px] font-bold text-red-400 flex items-center gap-1 animate-fade-in">
      <AlertCircle size={10} /> {error}
    </p>}
  </div>
);

// --- SYSTEM TEXTAREA ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ error, ...props }) => (
  <div className="w-full">
    <textarea 
      {...props} 
      className={`w-full px-3 py-3 bg-surface-highlight border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted transition-all duration-200 outline-none
        focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 hover:border-border-strong
        ${error ? 'border-red-500/50' : ''} 
        ${props.className || ''}`} 
    />
    {error && <p className="mt-1.5 text-[10px] font-bold text-red-400 flex items-center gap-1">
      <AlertCircle size={10} /> {error}
    </p>}
  </div>
);

// --- SYSTEM SELECT ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ error, ...props }) => (
  <div className="w-full relative">
    <select 
      {...props} 
      className={`w-full px-3 py-2.5 bg-surface-highlight border border-border rounded-lg text-sm text-text-primary appearance-none cursor-pointer transition-all duration-200 outline-none
        focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 hover:border-border-strong
        ${error ? 'border-red-500/50' : ''} 
        ${props.className || ''}`} 
    />
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
      <ChevronDown size={14} />
    </div>
    {error && <p className="mt-1.5 text-[10px] font-bold text-red-400 flex items-center gap-1">
      <AlertCircle size={10} /> {error}
    </p>}
  </div>
);

// --- SYSTEM CHECKBOX ---
export const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3 cursor-pointer group select-none py-1">
    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 
      ${checked ? 'bg-primary-600 border-primary-600' : 'bg-transparent border-text-muted group-hover:border-text-secondary'}`}>
      {checked && <Check size={10} className="text-white" />}
    </div>
    <span className={`text-sm transition-colors ${checked ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>{label}</span>
    <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
  </label>
);

// --- SYSTEM LABEL ---
export const Label: React.FC<{ children: React.ReactNode; required?: boolean; className?: string }> = ({ children, required, className = '' }) => (
  <label className={`block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-0.5 ${className}`}>
    {children}
    {required && <span className="text-primary-500 ml-0.5">*</span>}
  </label>
);

// --- SYSTEM PAGINATION ---
export const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  onItemsPerPageChange: (size: number) => void;
  className?: string;
}> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, onItemsPerPageChange, className = '' }) => {
  if (totalItems === 0) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border ${className}`}>
      {/* Records Info & Size Selector */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>
          Showing <span className="text-text-primary font-bold">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to{' '}
          <span className="text-text-primary font-bold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
          <span className="text-text-primary font-bold">{totalItems}</span>
        </span>
        
        <div className="h-4 w-px bg-border hidden sm:block"></div>
        
        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-surface border border-border rounded px-2 py-1 text-text-secondary text-xs focus:ring-1 focus:ring-primary-500/50 outline-none cursor-pointer hover:border-border-strong"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-border bg-surface text-text-muted disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-highlight hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let p = i + 1;
            if (totalPages > 5) {
               if (currentPage > 3) p = currentPage - 2 + i;
               if (p > totalPages) p = totalPages - (4 - i);
            }
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  currentPage === p 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-highlight'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-border bg-surface text-text-muted disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-highlight hover:text-text-primary transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// --- SYSTEM NOTIFICATION CENTER ---
export const NotificationCenter: React.FC<{ 
  notifications: Notification[], 
  onMarkRead: (id: string) => void,
  onClearAll: () => void,
  onNotificationClick?: (n: Notification) => void
}> = ({ notifications, onMarkRead, onClearAll, onNotificationClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-surface-highlight text-text-muted hover:text-text-primary transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-border rounded-xl shadow-2xl z-[90] flex flex-col max-h-[80vh] animate-scale-in origin-top-right">
             <div className="p-4 border-b border-border flex items-center justify-between bg-surface-highlight/30">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Notifications</h3>
                {notifications.length > 0 && (
                   <button onClick={onClearAll} className="text-[10px] text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors">
                      <Trash2 size={12} /> Clear History
                   </button>
                )}
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {notifications.length === 0 ? (
                   <div className="py-12 text-center flex flex-col items-center justify-center">
                      <div className="w-10 h-10 bg-surface-highlight rounded-full flex items-center justify-center text-text-muted mb-3 border border-border">
                         <Bell size={16} />
                      </div>
                      <p className="text-xs font-medium text-text-primary">No new notifications</p>
                      <p className="text-[10px] text-text-muted">You're all caught up!</p>
                   </div>
                ) : (
                   notifications.map(n => (
                      <div 
                         key={n.id} 
                         onClick={() => {
                             if (onNotificationClick) onNotificationClick(n);
                             else onMarkRead(n.id);
                         }}
                         className={`p-3 rounded-lg border transition-all cursor-pointer group relative overflow-hidden ${
                            n.read 
                              ? 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-surface-highlight' 
                              : 'bg-surface-highlight border-border hover:border-border-strong'
                         }`}
                      >
                         <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-primary-500' : 'bg-text-muted'}`}></div>
                            <div className="flex-1 min-w-0">
                               <h4 className={`text-xs font-bold mb-0.5 truncate ${n.read ? 'text-text-secondary' : 'text-text-primary'}`}>{n.title}</h4>
                               <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">{n.message}</p>
                               <span className="text-[10px] text-text-muted font-mono mt-2 block">{new Date(n.createdAt).toLocaleTimeString()}</span>
                            </div>
                            {n.linkToId && (
                                <ArrowUpRight size={14} className="text-primary-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
        </>
      )}
    </div>
  );
};

// --- SYSTEM MODAL ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' }> = ({ 
  isOpen, onClose, title, children, size = 'md'
}) => {
  if (!isOpen) return null;
  const sizes = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`bg-surface w-full ${sizes[size]} sm:rounded-2xl rounded-t-2xl overflow-hidden animate-slide-up sm:animate-scale-in flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] border border-border shadow-2xl`}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-highlight/30 shrink-0">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 bg-surface">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- SYSTEM DELETE MODAL ---
export const DeleteModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  description: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, title, description }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
          <div className="text-sm text-text-secondary leading-relaxed mb-6">
            {description}
          </div>
          
          <div className="flex gap-3">
            <Button onClick={onClose} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={onConfirm} variant="danger" className="flex-1">Confirm</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SYSTEM FILE UPLOAD ---
interface FileUploadProps {
  onUpload: (attachment: Attachment) => void;
  maxSizeInKB?: number;
  allowedMimeTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onUpload, 
  maxSizeInKB = 300,
  allowedMimeTypes = ['application/pdf', 'application/msword', 'text/plain']
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = (file: File) => {
    setError(null);
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        onUpload({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: dataUrl,
          uploadedAt: Date.now()
        });
      }
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
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  return (
    <div className="w-full">
      <div 
        className={`relative group w-full h-24 rounded-xl border border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer
          ${dragActive ? 'border-primary-500 bg-primary-500/10' : 'border-border-strong hover:border-text-muted hover:bg-surface-highlight'}
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          onChange={(e) => { if(e.target.files?.[0]) processFile(e.target.files[0]); }}
        />
        
        {isProcessing ? (
           <div className="flex items-center text-primary-400 gap-2">
             <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-xs font-bold uppercase tracking-wide">Processing</span>
           </div>
        ) : (
           <div className="flex items-center gap-3 text-text-muted group-hover:text-text-secondary transition-colors">
              <UploadCloud size={20} />
              <span className="text-xs font-medium">Drop or Click to Upload</span>
           </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-[10px] font-bold text-red-400 flex items-center gap-1.5 animate-fade-in">
          <AlertCircle size={10} /> {error}
        </div>
      )}
    </div>
  );
};
