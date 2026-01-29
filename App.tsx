
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Search, Trash2, Zap, Briefcase, LogOut, LayoutDashboard,
  Users, FileText, Copy, ChevronRight, Eye, Settings, PlusCircle,
  UserPlus, History, Upload, LayoutList, LayoutGrid, CheckCircle,
  AlertTriangle, Filter, X, Target, Sparkles, Calendar, Bell, BrainCircuit,
  Clock, ArrowRight, ChevronLeft, Menu, Command, DownloadCloud, AlertCircle, Loader2, Edit3
} from 'lucide-react';
import { storage } from './services/storage';
import { auth } from './services/auth';
import { 
  TrackingRecord, ExecutionLog, ApplicationStatus, User,
  OutreachTemplate, EmailType, Contact, Notification, Reminder
} from './types';
import { STATUS_STYLES } from './constants';
import { Button, Card, Badge, Input, Modal, Label, Textarea, DeleteModal, Select, Checkbox, Pagination, NotificationCenter } from './components/Shared';
import Dashboard from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import { TrackingForm } from './components/TrackingForm';
import { RecordDetails } from './components/RecordDetails';
import { ContactForm } from './components/ContactForm';
import { generateOutreachDraft, generateInterviewQuestions, InterviewPrep } from './services/ai';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(auth.getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<TrackingRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<ApplicationStatus[]>([]);
  
  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu State
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // IMPORT STATE
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'RECORDS' | 'CONTACTS'>('RECORDS');
  const [importStage, setImportStage] = useState<'INPUT' | 'PREVIEW'>('INPUT');
  const [importPreview, setImportPreview] = useState<{valid: any[], invalid: any[], all: any[]}>({ valid: [], invalid: [], all: [] });

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);
  const [prepData, setPrepData] = useState<InterviewPrep | null>(null);
  const [isPrepping, setIsPrepping] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  
  const [editingRecord, setEditingRecord] = useState<Partial<TrackingRecord> | null>(null);
  const [viewingRecord, setViewingRecord] = useState<TrackingRecord | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<OutreachTemplate> | null>(null);
  const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
  
  const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean; type: 'RECORD' | 'CONTACT' | 'TEMPLATE' | null; id: string | null; meta?: any }>({ isOpen: false, type: null, id: null });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Close mobile menu on route change or resize
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  // Reset pagination on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatuses, activeTab]);

  // TOAST AUTO-DISMISS
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000); // Increased duration for readability
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const handleLogout = useCallback(() => {
    auth.logout();
    setUser(null);
    setActiveTab('dashboard');
    setRecords([]);
  }, []);

  const refreshData = useCallback(() => {
    if (!auth.isAuthenticated()) {
      if (user) handleLogout();
      return;
    }
    setRecords([...storage.getRecords()]);
    setContacts([...storage.getContacts()]);
    setTemplates([...storage.getTemplates()]);
    setLogs([...storage.getLogs()]);
    setNotifications([...storage.getNotifications()]);
  }, [user, handleLogout]);

  useEffect(() => {
    if (user) refreshData();
  }, [refreshData, user]);

  // SCHEDULER POLLING (Client-Side Fallback)
  useEffect(() => {
     if (!user) return;
     const interval = setInterval(() => {
         const now = Date.now();
         const reminders = storage.getReminders();
         const pending = reminders.filter(r => r.status === 'PENDING' && r.dueAt <= now);
         
         if (pending.length > 0) {
             pending.forEach(r => {
                 storage.addNotification({
                     type: 'REMINDER',
                     title: 'Follow-Up Due',
                     message: `Reminder for ${r.title}`,
                     linkToId: r.recordId
                 });
                 storage.updateReminderStatus(r.id, 'FIRED');
             });
             refreshData();
         }
     }, 30000); // Check every 30s
     return () => clearInterval(interval);
  }, [user, refreshData]);

  const reminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return records.filter(r => {
      const isActive = [ApplicationStatus.SENT, ApplicationStatus.INTERVIEWING].includes(r.status);
      const isDue = r.nextFollowUpDate && r.nextFollowUpDate <= today && !r.followUpSent;
      return isActive && isDue;
    }).sort((a, b) => (a.nextFollowUpDate || '').localeCompare(b.nextFollowUpDate || ''));
  }, [records]);

  // Actions
  const handleSaveRecord = (data: Partial<TrackingRecord> & { _reminderConfig?: { date: string, time: string } }) => { 
      const savedRecord = storage.saveRecord(data);
      
      if (data._reminderConfig && savedRecord.id) {
         const { date, time } = data._reminderConfig;
         const dueAt = new Date(`${date}T${time || '09:00'}`).getTime();
         if (!isNaN(dueAt)) {
             storage.saveReminder({
                 recordId: savedRecord.id,
                 title: `${savedRecord.roleTitle} at ${savedRecord.company}`,
                 dueAt
             });
             showToast("Record saved & reminder scheduled.");
         } else {
             showToast("Record saved but reminder time invalid.", "error");
         }
      } else {
         showToast("Record committed successfully.");
      }

      setIsModalOpen(false); 
      setEditingRecord(null); 
      refreshData(); 
  };
  
  const handleSaveContact = (data: Partial<Contact>) => { storage.saveContact(data); setIsContactModalOpen(false); setEditingContact(null); refreshData(); showToast("Contact saved successfully."); };
  const handleDeleteRecord = (id: string) => { const rec = records.find(r => r.id === id); setDeleteConfig({ isOpen: true, type: 'RECORD', id, meta: { name: rec ? `${rec.roleTitle} at ${rec.company}` : 'Record' } }); };
  const handleDeleteContact = (id: string) => { const contact = contacts.find(c => c.id === id); setDeleteConfig({ isOpen: true, type: 'CONTACT', id, meta: { name: contact?.name || 'Contact' } }); };
  const handleDeleteTemplate = (id: string) => { const t = templates.find(temp => temp.id === id); setDeleteConfig({ isOpen: true, type: 'TEMPLATE', id, meta: { name: t?.title || 'Template' } }); };
  
  const executeDelete = () => { 
    try {
      if (deleteConfig.type === 'RECORD') { storage.deleteRecord(deleteConfig.id!); if (viewingRecord?.id === deleteConfig.id) { setViewingRecord(null); setIsViewModalOpen(false); } }
      else if (deleteConfig.type === 'CONTACT') storage.deleteContact(deleteConfig.id!);
      else if (deleteConfig.type === 'TEMPLATE') storage.deleteTemplate(deleteConfig.id!);
      
      setDeleteConfig({ isOpen: false, type: null, id: null });
      refreshData();
      showToast("Item deleted permanently.", "success");
    } catch (e: any) {
      showToast(e.message || "Delete failed", "error");
    }
  };

  const handleSaveTemplate = (e: React.FormEvent) => { e.preventDefault(); storage.saveTemplate(editingTemplate!); setIsTemplateModalOpen(false); setEditingTemplate(null); refreshData(); showToast("Template saved."); };
  
  // Notification Actions
  const handleMarkRead = (id: string) => { storage.markNotificationRead(id); refreshData(); };
  const handleClearNotifications = () => { storage.clearNotifications(); refreshData(); };

  // --- IMPORT SYSTEM ---
  const parseCSV = (text: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let inQuote = false;
    let currentCell = '';
    
    // Normalize newlines
    const cleanedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanedText.length; i++) {
      const char = cleanedText[i];
      const nextChar = cleanedText[i + 1];

      if (char === '"') {
        if (inQuote && nextChar === '"') {
          currentCell += '"'; // Escaped quote
          i++; 
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' && !inQuote) {
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        }
      } else {
        currentCell += char;
      }
    }
    // Push last row if exists
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }
    return rows;
  };

  const handleAnalyzeImport = () => {
    if (!importText.trim()) return;
    try {
      const rows = parseCSV(importText);
      if (rows.length < 2) throw new Error("Invalid CSV: No data rows found. Ensure headers are present.");
      
      const headers = rows[0].map(h => h.toLowerCase().replace(/^"|"$/g, '').trim());
      
      const data = rows.slice(1).map((row, idx) => {
        const obj = headers.reduce((acc, header, index) => {
          let key = header;
          if (header.includes('company')) key = 'company';
          if (header.includes('role') || header.includes('title')) key = 'roleTitle';
          if (header.includes('name')) key = 'name';
          if (header.includes('email')) key = 'email';
          acc[key] = row[index] || '';
          return acc;
        }, {} as any);
        obj._originalIdx = idx + 1; // 1-based index (skipping header)
        return obj;
      });
      
      // Separate Valid / Invalid
      const valid: any[] = [];
      const invalid: any[] = [];

      data.forEach(d => {
        let isValid = false;
        if (importMode === 'RECORDS') {
           isValid = !!(d.company && d.roleTitle);
        } else {
           isValid = !!(d.name);
        }

        if (isValid) valid.push(d);
        else invalid.push(d);
      });

      setImportPreview({ valid, invalid, all: data });
      setImportStage('PREVIEW');

    } catch (e: any) {
      showToast(e.message || "Parse failed.", "error");
    }
  };

  const handleCommitImport = () => {
    try {
      if (importPreview.valid.length === 0) {
        showToast("No valid records to import.", "error");
        return;
      }

      if (importMode === 'RECORDS') {
        storage.saveRecordsBatch(importPreview.valid);
      } else {
        storage.saveContactsBatch(importPreview.valid);
      }
      
      setIsImportModalOpen(false);
      setImportText('');
      setImportStage('INPUT');
      
      const summaryMsg = `Import Success: ${importPreview.valid.length} items added. ${importPreview.invalid.length} skipped.`;
      setImportPreview({ valid: [], invalid: [], all: [] });
      refreshData();
      showToast(summaryMsg, "success");
    } catch (e: any) {
      showToast(e.message || "Import commit failed.", "error");
    }
  };

  const handleCancelImport = () => {
    setImportStage('INPUT');
    setImportPreview({ valid: [], invalid: [], all: [] });
    setImportText('');
    setIsImportModalOpen(false);
  };

  // ---

  const handlePrep = async (rec: TrackingRecord) => { setIsPrepModalOpen(true); setIsPrepping(true); const data = await generateInterviewQuestions(rec.roleTitle, rec.company); setPrepData(data); setIsPrepping(false); };

  const filteredRecords = useMemo(() => {
    let result = records;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.company.toLowerCase().includes(q) || r.roleTitle.toLowerCase().includes(q));
    }
    if (filterStatuses.length > 0) result = result.filter(r => filterStatuses.includes(r.status));
    return result;
  }, [records, searchQuery, filterStatuses]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
  }, [contacts, searchQuery]);

  // PAGINATION LOGIC
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContacts, currentPage, itemsPerPage]);
  
  if (!user) return <LoginForm onLogin={() => setUser(auth.getCurrentUser())} />;

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'applications', label: 'Pipeline', icon: <Briefcase size={18} /> },
    { id: 'contacts', label: 'Network', icon: <Users size={18} /> },
    { id: 'templates', label: 'Library', icon: <FileText size={18} /> },
    { id: 'audit', label: 'System Log', icon: <History size={18} /> },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-indigo-500 rounded-lg flex items-center justify-center text-white shadow-glow">
          <Command size={16} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-text-primary tracking-tight">ApexJob OS</h1>
          <p className="text-[10px] text-text-muted font-mono">v3.0.0</p>
        </div>
        {/* Mobile Close Button */}
        <button className="ml-auto md:hidden text-text-muted hover:text-text-primary" onClick={() => setIsMobileMenuOpen(false)}>
           <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Workspace</div>
        {navItems.map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium
              ${activeTab === item.id 
                ? 'bg-surface-highlight text-text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-border' 
                : 'text-text-muted hover:text-text-primary hover:bg-surface-highlight'}`}
          >
            {React.cloneElement(item.icon as React.ReactElement<any>, { size: 16, className: activeTab === item.id ? 'text-primary-400' : 'text-text-muted' })}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-surface border border-border mb-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-white border border-border">
            {user.name[0]}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-text-primary truncate">{user.name}</p>
            <p className="text-[10px] text-text-muted truncate">{user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors">
          <LogOut size={14} /> System Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="h-full flex text-text-primary font-sans selection:bg-primary-500/30 selection:text-white relative overflow-hidden bg-background">
      
      {/* GLOBAL TOAST NOTIFICATION - Fixed Z-Index to stay above modals */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[120] px-4 py-3 rounded-lg shadow-2xl font-bold text-sm animate-slide-up flex items-center gap-3 border backdrop-blur-xl ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {notification.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {notification.message}
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-background border-r border-border flex-col z-40 backdrop-blur-xl h-full">
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR (DRAWER) */}
      <div className={`md:hidden fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)} />
      <aside className={`md:hidden fixed inset-y-0 left-0 z-[70] w-64 bg-background border-r border-border flex-col transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-background">
        {/* HEADER */}
        <header className="h-16 border-b border-border bg-background/60 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
             {/* Mobile Menu Button */}
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-text-muted hover:text-text-primary">
                <Menu size={20} />
             </button>

             <h2 className="text-lg font-bold text-text-primary truncate">{navItems.find(n => n.id === activeTab)?.label}</h2>
             <div className="h-4 w-px bg-border hidden sm:block"></div>
             
             {activeTab === 'applications' && (
                <div className="hidden sm:flex gap-2">
                   <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-surface-highlight text-text-primary' : 'text-text-muted'}`}><LayoutGrid size={14} /></button>
                   <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-surface-highlight text-text-primary' : 'text-text-muted'}`}><LayoutList size={14} /></button>
                </div>
             )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
             <div className="relative group hidden sm:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-text-secondary" size={14} />
               <input 
                 value={searchQuery} 
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="bg-surface-highlight border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary w-32 lg:w-48 focus:w-64 transition-all outline-none focus:border-primary-500/50"
                 placeholder="Search..." 
               />
             </div>
             
             {/* NOTIFICATION CENTER INTEGRATION */}
             <NotificationCenter notifications={notifications} onMarkRead={handleMarkRead} onClearAll={handleClearNotifications} />

             {/* Action Buttons - Responsive Grouping */}
             <div className="flex gap-2">
                 {activeTab === 'applications' && (
                   <>
                     <Button size="sm" variant="secondary" className="hidden sm:inline-flex" onClick={() => { setImportMode('RECORDS'); setImportStage('INPUT'); setIsImportModalOpen(true); }}>
                       <DownloadCloud size={14} className="mr-2" /> Import
                     </Button>
                     {/* Mobile Icon-only Import */}
                     <button className="sm:hidden p-2 bg-surface-highlight rounded-lg text-text-primary" onClick={() => { setImportMode('RECORDS'); setImportStage('INPUT'); setIsImportModalOpen(true); }}>
                        <DownloadCloud size={16} />
                     </button>
                     
                     <Button size="sm" variant="gradient" onClick={() => { setEditingRecord({}); setIsModalOpen(true); }}>
                       <Plus size={14} className="sm:mr-2" /> <span className="hidden sm:inline">New Entry</span>
                     </Button>
                   </>
                 )}
                  {activeTab === 'contacts' && (
                   <>
                     <Button size="sm" variant="secondary" className="hidden sm:inline-flex" onClick={() => { setImportMode('CONTACTS'); setImportStage('INPUT'); setIsImportModalOpen(true); }}>
                        <DownloadCloud size={14} className="mr-2" /> Import
                     </Button>
                      <button className="sm:hidden p-2 bg-surface-highlight rounded-lg text-text-primary" onClick={() => { setImportMode('CONTACTS'); setImportStage('INPUT'); setIsImportModalOpen(true); }}>
                        <DownloadCloud size={16} />
                     </button>
                     <Button size="sm" variant="gradient" onClick={() => { setEditingContact({}); setIsContactModalOpen(true); }}>
                        <UserPlus size={14} className="sm:mr-2" /> <span className="hidden sm:inline">Add Node</span>
                     </Button>
                   </>
                 )}
                 {activeTab === 'templates' && (
                   <Button size="sm" variant="gradient" onClick={() => { setEditingTemplate({}); setIsTemplateModalOpen(true); }}>
                      <Plus size={14} className="sm:mr-2" /> <span className="hidden sm:inline">New Template</span>
                   </Button>
                 )}
             </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar">
          
          {activeTab === 'dashboard' && <Dashboard applications={records} onOpenRecord={(rec) => { setViewingRecord(rec); setIsViewModalOpen(true); }} />}
          
          {activeTab === 'applications' && (
             <div className="animate-fade-in space-y-6 flex flex-col h-full">
                <div className="flex-1">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                     {paginatedRecords.map(rec => (
                       <div key={rec.id} onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} className="glass-panel p-5 rounded-xl hover:border-primary-500/30 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden bg-surface border-border">
                          <div className={`absolute top-0 left-0 w-1 h-full ${rec.status === ApplicationStatus.OFFER ? 'bg-emerald-500' : 'bg-primary-500/50'}`}></div>
                          <div className="flex justify-between items-start mb-3 pl-3">
                             <div>
                                <h3 className="text-base font-bold text-text-primary group-hover:text-primary-400 transition-colors truncate max-w-[150px] sm:max-w-[180px]">{rec.roleTitle}</h3>
                                <p className="text-xs text-text-secondary font-medium truncate max-w-[150px]">{rec.company}</p>
                             </div>
                             <Badge className={STATUS_STYLES[rec.status]}>{rec.status}</Badge>
                          </div>
                          <div className="pl-3 flex justify-between items-end mt-4">
                             <span className="text-[10px] text-text-muted font-mono">{new Date(rec.dateSent).toLocaleDateString()}</span>
                             <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <Button size="xs" variant="secondary" onClick={(e) => {e.stopPropagation(); handlePrep(rec);}}>Prep</Button>
                                <button onClick={(e) => {e.stopPropagation(); handleDeleteRecord(rec.id);}} className="text-text-muted hover:text-red-400 p-1"><Trash2 size={14} /></button>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="bg-surface rounded-xl overflow-hidden border border-border shadow-sm">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
                            <thead className="bg-surface-highlight text-text-muted font-medium border-b border-border">
                            <tr><th className="px-6 py-3 text-xs uppercase tracking-wider">Role</th><th className="px-6 py-3 text-xs uppercase tracking-wider">Company</th><th className="px-6 py-3 text-xs uppercase tracking-wider">Status</th><th className="px-6 py-3 text-right text-xs uppercase tracking-wider">Actions</th></tr>
                            </thead>
                            <tbody>
                            {paginatedRecords.map(rec => (
                                <tr key={rec.id} onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} className="group hover:bg-white/[0.02] cursor-pointer transition-colors border-b border-border last:border-0">
                                    <td className="px-6 py-4 font-medium text-text-primary group-hover:text-primary-400 transition-colors">{rec.roleTitle}</td>
                                    <td className="px-6 py-4 text-text-secondary group-hover:text-text-primary">{rec.company}</td>
                                    <td className="px-6 py-4"><Badge className={STATUS_STYLES[rec.status]}>{rec.status}</Badge></td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={(e) => {e.stopPropagation(); handleDeleteRecord(rec.id);}} className="text-text-muted hover:text-red-400 p-2 rounded-lg hover:bg-surface transition-colors"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                     </div>
                  </div>
                )}
                </div>
                {/* Pagination Controls */}
                <Pagination 
                   currentPage={currentPage} 
                   totalPages={Math.ceil(filteredRecords.length / itemsPerPage)} 
                   onPageChange={setCurrentPage} 
                   totalItems={filteredRecords.length}
                   itemsPerPage={itemsPerPage}
                   onItemsPerPageChange={setItemsPerPage}
                />
             </div>
          )}

          {activeTab === 'contacts' && (
             <div className="animate-fade-in flex flex-col h-full">
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedContacts.map(contact => (
                        <div key={contact.id} className="bg-surface border border-border p-5 rounded-xl flex items-start justify-between group hover:border-primary-500/30 transition-all shadow-sm">
                            <div className="flex items-start gap-4 overflow-hidden">
                              <div className="w-10 h-10 bg-surface-highlight rounded-lg flex items-center justify-center text-text-muted font-bold border border-border shrink-0">{contact.name[0]}</div>
                              <div className="min-w-0">
                                  <h3 className="text-sm font-bold text-text-primary truncate">{contact.name}</h3>
                                  <p className="text-xs text-primary-400 font-medium mb-1 truncate">{contact.company}</p>
                                  <p className="text-[10px] text-text-muted font-mono truncate">{contact.email}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                                <button onClick={() => { setEditingContact(contact); setIsContactModalOpen(true); }} className="text-text-muted hover:text-text-primary transition-colors shrink-0 p-1"><Edit3 size={14} /></button>
                                <button onClick={() => handleDeleteContact(contact.id)} className="text-text-muted hover:text-red-400 transition-colors shrink-0 p-1"><Trash2 size={14} /></button>
                            </div>
                        </div>
                      ))}
                  </div>
                </div>
                <Pagination 
                   currentPage={currentPage} 
                   totalPages={Math.ceil(filteredContacts.length / itemsPerPage)} 
                   onPageChange={setCurrentPage} 
                   totalItems={filteredContacts.length}
                   itemsPerPage={itemsPerPage}
                   onItemsPerPageChange={setItemsPerPage}
                   className="mt-6"
                />
             </div>
          )}

          {activeTab === 'templates' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                {templates.length > 0 ? (
                    templates.map(t => (
                       <div key={t.id} className="bg-surface border border-border p-5 rounded-xl group hover:border-border-strong transition-all shadow-sm">
                          <div className="flex justify-between mb-3">
                             <Badge className="bg-surface-highlight text-text-secondary border-border">{t.category}</Badge>
                             <div className="flex gap-2">
                                <button onClick={() => { setEditingTemplate(t); setIsTemplateModalOpen(true); }} className="text-text-muted hover:text-text-primary"><Settings size={14} /></button>
                                <button onClick={() => handleDeleteTemplate(t.id)} className="text-text-muted hover:text-red-400"><Trash2 size={14} /></button>
                             </div>
                          </div>
                          <h3 className="text-base font-bold text-text-primary mb-2">{t.title}</h3>
                          <p className="text-xs text-text-muted line-clamp-3 font-mono leading-relaxed bg-surface-highlight p-3 rounded-lg border border-border-subtle">{t.content}</p>
                       </div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center h-64 text-text-muted border border-dashed border-border rounded-xl bg-surface/50">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium text-text-secondary">No templates found</p>
                        <p className="text-xs opacity-50">Create a template to streamline your outreach</p>
                    </div>
                )}
             </div>
          )}

          {activeTab === 'audit' && (
             <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-in shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
                    <thead className="bg-surface-highlight text-text-muted font-medium border-b border-border">
                        <tr><th className="px-6 py-3 text-xs">Action</th><th className="px-6 py-3 text-xs">Entity</th><th className="px-6 py-3 text-xs">Message</th><th className="px-6 py-3 text-xs text-right">Time</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-3 font-mono text-xs"><span className={log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>{log.action}</span></td>
                                <td className="px-6 py-3 text-xs text-text-muted">{log.entityType}</td>
                                <td className="px-6 py-3 text-text-secondary max-w-[200px] truncate">{log.message}</td>
                                <td className="px-6 py-3 text-right text-[10px] font-mono text-text-muted">{new Date(log.executedAt).toLocaleTimeString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
             </div>
          )}
        </div>
      </main>

      {/* ALL MODALS - Now fully responsive via Shared component update */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRecord(null); }} title={editingRecord?.id ? 'Edit System Record' : 'Initialize New Record'} size="lg">
        <TrackingForm initialData={editingRecord || {}} contacts={contacts} onSave={handleSaveRecord} onCancel={() => { setIsModalOpen(false); setEditingRecord(null); }} />
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setViewingRecord(null); }} title="Record Dossier" size="lg">
        {viewingRecord && <RecordDetails record={viewingRecord} onEdit={(rec) => { setIsViewModalOpen(false); setEditingRecord(rec); setIsModalOpen(true); }} onDelete={handleDeleteRecord} onPrep={handlePrep} />}
      </Modal>

      <Modal isOpen={isContactModalOpen} onClose={() => { setIsContactModalOpen(false); setEditingContact(null); }} title="Contact Node">
         <ContactForm initialData={editingContact || {}} onSave={handleSaveContact} onCancel={() => { setIsContactModalOpen(false); setEditingContact(null); }} />
      </Modal>

      <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Strategy Template">
        <form onSubmit={handleSaveTemplate} className="space-y-4">
           <div><Label>Name</Label><Input value={editingTemplate?.title || ''} onChange={e => setEditingTemplate(p => ({ ...p, title: e.target.value }))} /></div>
           <div><Label>Type</Label><Select value={editingTemplate?.category} onChange={e => setEditingTemplate(p => ({ ...p, category: e.target.value as EmailType }))}>{Object.values(EmailType).map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
           <div><Label>Content</Label><Textarea rows={10} value={editingTemplate?.content || ''} onChange={e => setEditingTemplate(p => ({ ...p, content: e.target.value }))} /></div>
           <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button><Button type="submit">Save Template</Button></div>
        </form>
      </Modal>

      {/* REFACTORED IMPORT MODAL WITH PREVIEW */}
      <Modal isOpen={isImportModalOpen} onClose={handleCancelImport} title={`Batch Import Protocol (${importMode})`} size="lg">
        {importStage === 'INPUT' ? (
          <div className="space-y-4 h-full flex flex-col">
             <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-lg shrink-0">
               <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-500/20 rounded text-primary-400"><FileText size={18} /></div>
                  <div>
                      <h4 className="text-xs font-bold text-primary-300 uppercase tracking-widest mb-1">CSV Formatting Protocol</h4>
                      <p className="text-xs text-primary-200/80 leading-relaxed mb-2">Data must contain headers. Quotes are supported.</p>
                      <div className="text-[10px] font-mono bg-surface-highlight p-2 rounded border border-border text-text-secondary">
                        {importMode === 'RECORDS' ? "company, role, status" : "name, email, company"}
                      </div>
                  </div>
               </div>
             </div>
             <div className="flex-1 min-h-0">
                  <textarea 
                      placeholder="Paste raw CSV data here..." 
                      value={importText} 
                      onChange={e => setImportText(e.target.value)} 
                      className="w-full h-full p-4 font-mono text-xs bg-surface-highlight border border-border rounded-lg text-text-secondary resize-none focus:ring-1 focus:ring-primary-500/50 outline-none leading-relaxed placeholder:text-text-muted"
                  />
             </div>
             <div className="flex justify-end gap-2 pt-2 shrink-0">
               <Button variant="ghost" onClick={handleCancelImport}>Abort</Button>
               <Button onClick={handleAnalyzeImport} disabled={!importText.trim()}>Analyze Data</Button>
             </div>
          </div>
        ) : (
          <div className="space-y-4 h-full flex flex-col">
              <div className="flex gap-4 shrink-0">
                 <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-400">{importPreview.valid.length}</div>
                    <div className="text-[10px] uppercase font-bold text-emerald-600">Valid Rows</div>
                 </div>
                 <div className="flex-1 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{importPreview.invalid.length}</div>
                    <div className="text-[10px] uppercase font-bold text-red-600">Skipped (Invalid)</div>
                 </div>
              </div>

              <div className="flex-1 overflow-hidden border border-border rounded-lg bg-surface">
                 <div className="overflow-auto h-full">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                       <thead className="bg-surface-highlight text-text-muted sticky top-0">
                          <tr>
                             <th className="px-3 py-2">Status</th>
                             <th className="px-3 py-2">{importMode === 'RECORDS' ? 'Company' : 'Name'}</th>
                             <th className="px-3 py-2">{importMode === 'RECORDS' ? 'Role' : 'Email'}</th>
                             <th className="px-3 py-2">Raw Preview</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-border">
                          {importPreview.all.map((row, i) => {
                             const isValid = importPreview.valid.includes(row);
                             return (
                                <tr key={i} className={isValid ? 'bg-emerald-500/5' : 'bg-red-500/5'}>
                                   <td className="px-3 py-2">
                                      {isValid ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-red-500" />}
                                   </td>
                                   <td className="px-3 py-2 text-text-secondary">{row.company || row.name || '-'}</td>
                                   <td className="px-3 py-2 text-text-muted">{row.roleTitle || row.email || '-'}</td>
                                   <td className="px-3 py-2 font-mono text-[10px] text-text-muted max-w-[200px] truncate">{JSON.stringify(row)}</td>
                                </tr>
                             )
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="flex justify-between items-center pt-2 shrink-0">
                 <div className="text-xs text-text-muted">
                    Reviewing {importPreview.all.length} total rows
                 </div>
                 <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setImportStage('INPUT')}>Back to Edit</Button>
                    <Button onClick={handleCommitImport} variant={importPreview.valid.length > 0 ? 'primary' : 'secondary'} disabled={importPreview.valid.length === 0}>
                       Commit Import
                    </Button>
                 </div>
              </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isPrepModalOpen} onClose={() => setIsPrepModalOpen(false)} title="AI Interview Simulator" size="lg">
         {isPrepping ? (
            <div className="flex flex-col items-center justify-center py-16">
               <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
               <h3 className="text-text-primary font-bold">Synthesizing Scenarios...</h3>
            </div>
         ) : prepData ? (
            <div className="space-y-6">
               {prepData.questions.map((q, i) => (
                  <div key={i} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                     <div className="flex gap-4">
                        <div className="w-6 h-6 rounded bg-primary-900/50 text-primary-400 flex items-center justify-center text-xs font-bold border border-primary-500/20 shrink-0">{i+1}</div>
                        <h3 className="text-sm font-bold text-text-primary leading-relaxed">{q.question}</h3>
                     </div>
                     {revealedAnswers.includes(i) ? (
                        <div className="mt-4 p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-200 leading-relaxed animate-fade-in">
                           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Target Response Key</p>
                           {q.idealAnswerKey}
                        </div>
                     ) : (
                        <div onClick={() => setRevealedAnswers(p => [...p, i])} className="mt-4 p-4 bg-surface-highlight border border-border border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-surface-highlight/80 transition-colors group">
                           <span className="text-xs text-text-muted group-hover:text-primary-400 font-medium flex items-center gap-2"><Eye size={14} /> Reveal Strategy</span>
                        </div>
                     )}
                  </div>
               ))}
            </div>
         ) : null}
      </Modal>

      <DeleteModal isOpen={deleteConfig.isOpen} onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })} onConfirm={executeDelete} title="Confirm Purge" description={<span>Permanently delete <strong>{deleteConfig.meta?.name}</strong>? This action is irreversible.</span>} />
    </div>
  );
};

export default App;
