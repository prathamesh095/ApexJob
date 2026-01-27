
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Zap,
  Briefcase,
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  Copy,
  ChevronRight,
  Eye,
  Settings,
  PlusCircle,
  UserPlus,
  History,
  Upload,
  LayoutList,
  LayoutGrid,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { storage } from './services/storage';
import { auth } from './services/auth';
import { 
  TrackingRecord, 
  ExecutionLog, 
  ApplicationStatus,
  User,
  OutreachTemplate,
  EmailType,
  Contact 
} from './types';
import { STATUS_COLORS } from './constants';
import { Button, Card, Badge, Input, Modal, Label, Textarea } from './components/Shared';
import Dashboard from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import { TrackingForm } from './components/TrackingForm';
import { RecordDetails } from './components/RecordDetails';
import { ContactForm } from './components/ContactForm';
import { generateOutreachDraft } from './services/ai';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(auth.getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<TrackingRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  
  const [editingRecord, setEditingRecord] = useState<Partial<TrackingRecord> | null>(null);
  const [viewingRecord, setViewingRecord] = useState<TrackingRecord | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<OutreachTemplate> | null>(null);
  const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
  
  const [outreachDraft, setOutreachDraft] = useState('');
  const [isDraftingOutreach, setIsDraftingOutreach] = useState(false);

  // Notification System
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
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
    setContacts([]);
    setTemplates([]);
    setLogs([]);
  }, []);

  // Centralized Error Handler for Auth Failures
  const handleOperationError = useCallback((err: any) => {
    const msg = err?.message || 'Unknown error occurred';
    if (msg.includes('UNAUTHORIZED')) {
      showToast("Session expired. Please sign in again.", 'error');
      handleLogout();
    } else {
      showToast(msg, 'error');
    }
  }, [handleLogout]);

  const refreshData = useCallback(() => {
    if (!auth.isAuthenticated()) {
      // If auth check fails during refresh, force logout to clean state
      if (user) handleLogout();
      return;
    }
    setRecords([...storage.getRecords()]);
    setContacts([...storage.getContacts()]);
    setTemplates([...storage.getTemplates()]);
    setLogs([...storage.getLogs()]);
  }, [user, handleLogout]);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [refreshData, user]);

  const handleSaveRecord = (data: Partial<TrackingRecord>) => {
    try {
      storage.saveRecord(data);
      setIsModalOpen(false);
      setEditingRecord(null);
      refreshData();
      showToast("Pipeline record successfully committed.");
    } catch (err: any) {
      handleOperationError(err);
    }
  };

  const handleSaveContact = (data: Partial<Contact>) => {
    try {
      storage.saveContact(data);
      setIsContactModalOpen(false);
      setEditingContact(null);
      refreshData();
      showToast("Contact node updated.");
    } catch (err: any) {
      handleOperationError(err);
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('IRREVERSIBLE ACTION: Purge this record from tactical memory?')) {
      try {
        storage.deleteRecord(id);
        
        // Immediate UI Update
        if (viewingRecord?.id === id) {
          setViewingRecord(null);
          setIsViewModalOpen(false);
        }
        if (editingRecord?.id === id) {
          setEditingRecord(null);
          setIsModalOpen(false);
        }
        
        refreshData();
        showToast("Record purged from registry.", 'success');
      } catch (err: any) {
        handleOperationError(err);
      }
    }
  };

  const handleDeleteContact = (id: string) => {
    if (window.confirm('IRREVERSIBLE ACTION: Purge this contact? Tracking records will be preserved.')) {
      try {
        storage.deleteContact(id);
        refreshData();
        showToast("Contact node deleted.", 'success');
      } catch (err: any) {
        handleOperationError(err);
      }
    }
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate?.title || !editingTemplate?.content) return;
    try {
      storage.saveTemplate(editingTemplate);
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      refreshData();
      showToast("Strategy template saved.");
    } catch (err: any) {
      handleOperationError(err);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Purge this outreach strategy permanently?')) {
      try {
        storage.deleteTemplate(id);
        refreshData();
        showToast("Template deleted.", 'success');
      } catch (err: any) {
        handleOperationError(err);
      }
    }
  };

  const handleAIDraft = async (rec: TrackingRecord) => {
    setIsDraftingOutreach(true);
    const draft = await generateOutreachDraft({
      company: rec.company,
      role: rec.roleTitle,
      contactName: rec.name,
      tone: "Professional yet enthusiastic"
    });
    setOutreachDraft(draft);
    setIsDraftingOutreach(false);
    showToast("Intelligence draft generated.", 'success');
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    try {
      // Simple CSV parser: Company, Role, Name, Email, Status
      const lines = importText.split('\n').filter(l => l.trim().length > 0);
      const newRecords: Partial<TrackingRecord>[] = [];
      
      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          newRecords.push({
            company: parts[0],
            roleTitle: parts[1],
            name: parts[2] || 'Imported Contact',
            emailAddress: parts[3] || '',
            status: (parts[4] as ApplicationStatus) || ApplicationStatus.SENT
          });
        }
      });

      if (newRecords.length > 0) {
        storage.saveRecordsBatch(newRecords);
        refreshData();
        setIsImportModalOpen(false);
        setImportText('');
        showToast(`Successfully ingested ${newRecords.length} records into the matrix.`);
      } else {
        showToast("No valid records parsed from input.", 'error');
      }
    } catch (err: any) {
      handleOperationError(err);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(r => 
      r.company.toLowerCase().includes(q) || r.roleTitle.toLowerCase().includes(q) || 
      r.name.toLowerCase().includes(q) || r.emailAddress.toLowerCase().includes(q) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
  }, [records, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || 
      c.company.toLowerCase().includes(q) || (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery]);

  if (!user) {
    return <LoginForm onLogin={() => setUser(auth.getCurrentUser())} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard applications={records} />;
      
      case 'applications':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tracking Pipeline</h2>
                  <Badge className="bg-indigo-600 text-white border-none">{filteredRecords.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                 <div className="bg-white rounded-lg p-1 border border-slate-200 flex items-center">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}>
                      <LayoutGrid size={16} />
                    </button>
                    <button onClick={() => setViewMode('table')} className={`p-1.5 rounded transition-all ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}>
                      <LayoutList size={16} />
                    </button>
                 </div>
                 <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                   <Upload size={16} className="mr-2" /> Import CSV
                 </Button>
                 <Button onClick={() => { setEditingRecord({}); setIsModalOpen(true); }}>
                   <PlusCircle size={18} className="mr-2" /> Initial Action
                 </Button>
              </div>
            </div>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredRecords.length === 0 ? (
                  <Card className="p-16 text-center text-slate-400 bg-slate-50/50 border-dashed border-2">
                     <Briefcase size={64} className="mx-auto mb-6 opacity-10" />
                     <p className="font-bold text-slate-500">No records matching active query.</p>
                  </Card>
                ) : filteredRecords.map(rec => (
                  <Card key={rec.id} className="p-6 hover:shadow-xl hover:border-indigo-100 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1 space-y-2 cursor-pointer" onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }}>
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">{rec.roleTitle}</h3>
                          <Badge className={STATUS_COLORS[rec.status]}>{rec.status}</Badge>
                        </div>
                        <div className="flex items-center text-sm font-medium text-slate-500 space-x-4">
                          <span className="text-slate-900 font-bold">{rec.company}</span>
                          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                          <span>{rec.name}</span>
                          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                          <span className="text-indigo-600">{rec.emailAddress}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="bg-indigo-50 text-indigo-700" onClick={() => handleAIDraft(rec)}>
                          <Zap size={14} className="mr-1.5" /> AI Draft
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }}>
                          <Eye size={14} className="mr-1.5" /> View
                        </Button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }} 
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          title="Purge Record"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="overflow-hidden border-none shadow-lg">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-900 text-white">
                     <tr>
                       <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Role Title</th>
                       <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Company</th>
                       <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Status</th>
                       <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Sent Date</th>
                       <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredRecords.map(rec => (
                       <tr key={rec.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }}>
                         <td className="px-6 py-4 font-bold text-slate-900">{rec.roleTitle}</td>
                         <td className="px-6 py-4 font-medium text-slate-600">{rec.company}</td>
                         <td className="px-6 py-4">
                           <Badge className={STATUS_COLORS[rec.status]}>{rec.status}</Badge>
                         </td>
                         <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(rec.dateSent).toLocaleDateString()}</td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleAIDraft(rec); }}><Zap size={14} /></Button>
                             <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setViewingRecord(rec); setIsViewModalOpen(true); }}><Eye size={14} /></Button>
                             <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></Button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {filteredRecords.length === 0 && <div className="p-8 text-center text-slate-400">No records found.</div>}
              </Card>
            )}
          </div>
        );

      case 'contacts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Professional Network</h2>
                  <Badge className="bg-indigo-600 text-white border-none">{filteredContacts.length}</Badge>
              </div>
              <Button onClick={() => { setEditingContact({}); setIsContactModalOpen(true); }}>
                <UserPlus size={18} className="mr-2" /> New Node
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContacts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed">
                   <Users size={48} className="mx-auto mb-4 opacity-10" />
                   <p className="font-bold">Registry currently empty.</p>
                </div>
              ) : filteredContacts.map(contact => (
                <Card key={contact.id} className="p-6 hover:border-indigo-200 transition-all group">
                   <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors uppercase">
                        {contact.name[0]}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingContact(contact); setIsContactModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"><Settings size={16} /></button>
                        <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                   </div>
                   <h3 className="font-black text-slate-900 mb-1">{contact.name}</h3>
                   <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">{contact.company}</p>
                   <p className="text-xs text-slate-500 font-mono">{contact.email}</p>
                   <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(contact.email); setActiveTab('applications'); }}>
                        View Interactions <ChevronRight size={14} className="ml-1" />
                      </Button>
                   </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Communication Drafts</h2>
                <Badge className="bg-indigo-600 text-white border-none">{templates.length}</Badge>
              </div>
              <Button onClick={() => { setEditingTemplate({}); setIsTemplateModalOpen(true); }}>
                <Plus size={18} className="mr-2" /> New Template
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                   <FileText size={64} className="mx-auto mb-4 opacity-10" />
                   <p className="font-bold">No outreach strategies defined.</p>
                </div>
              ) : templates.map(t => (
                <Card key={t.id} className="p-6 group">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge className="bg-slate-100 text-slate-600 mb-2 uppercase">{t.category}</Badge>
                        <h3 className="font-black text-slate-900">{t.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(t.content); showToast("Strategy payload secured to clipboard."); }} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"><Copy size={16} /></button>
                        <button onClick={() => { setEditingTemplate(t); setIsTemplateModalOpen(true); }} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"><Settings size={16} /></button>
                        <button onClick={() => handleDeleteTemplate(t.id)} className="p-2 hover:bg-rose-50 text-rose-400 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                   </div>
                   <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed bg-slate-50 p-4 rounded-xl italic font-medium">"{t.content}"</p>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'audit':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Integrity Log</h2>
                <Badge className="bg-rose-600 text-white border-none uppercase">Immutable</Badge>
            </div>
            <Card className="overflow-hidden shadow-xl border-slate-200">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Entity</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Payload</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{log.entityType}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-medium">{log.message}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{new Date(log.executedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        );

      default:
        return <div className="p-12 text-center text-slate-400 bg-white rounded-xl">Module logic offline or tab missing mapping.</div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Notifications */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm animate-in fade-in slide-in-from-right-10 flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {notification.message}
        </div>
      )}

      {/* Navigation Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex-shrink-0 flex flex-col fixed h-full z-30 shadow-2xl">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">A</div>
            <div className="flex flex-col">
                <span className="text-lg font-black text-white leading-none tracking-tight">ApexJob</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Strategic CRM</span>
            </div>
          </div>
          
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Command Center', icon: <LayoutDashboard size={18} /> },
              { id: 'applications', label: 'Tracking Pipeline', icon: <Briefcase size={18} /> },
              { id: 'contacts', label: 'Network Matrix', icon: <Users size={18} /> },
              { id: 'templates', label: 'Draft Strategies', icon: <FileText size={18} /> },
              { id: 'audit', label: 'System Audit', icon: <History size={18} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 translate-x-1' 
                    : 'hover:bg-slate-900 hover:text-white text-slate-500'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-900 bg-slate-950/50 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                    {user.name[0].toUpperCase()}
                </div>
                <div className="text-[10px]">
                  <p className="text-white font-black uppercase tracking-tight">{user.name}</p>
                  <p className="text-slate-500 font-medium">Session: Locked</p>
                </div>
              </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-900 hover:bg-rose-950 hover:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all border border-slate-800"
          >
            <LogOut size={12} />
            <span>Terminate session</span>
          </button>
        </div>
      </aside>

      {/* Primary Content Interface */}
      <main className="flex-1 ml-64 p-10 min-w-0">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Area</h1>
            </div>
            <p className="text-slate-900 font-black text-3xl tracking-tight">Matrix Status: Nominal</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input 
                placeholder="Search global records..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 h-12 w-80 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none" 
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">Clear</button>
              )}
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {renderContent()}
        </div>

        {/* Modal: Import Data */}
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Batch Operations Ingestion"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Paste CSV data below to bulk create records. Format: <span className="font-mono bg-slate-100 px-1 rounded">Company, Role, Name, Email, Status</span>
            </p>
            <Textarea 
              rows={10} 
              placeholder={`Acme Corp, Senior Engineer, John Doe, john@acme.com, SENT\nGlobex, Product Lead, Jane Smith, jane@globex.com, INTERVIEWING`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="font-mono text-xs"
            />
            <div className="flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
               <Button onClick={handleImport}>Execute Batch Import</Button>
            </div>
          </div>
        </Modal>

        {/* Modal: View Tracking Dossier */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => { setIsViewModalOpen(false); setViewingRecord(null); }}
          title="Operational Record Dossier"
          size="lg"
        >
          {viewingRecord && (
            <RecordDetails 
              record={viewingRecord} 
              onEdit={(rec) => {
                setIsViewModalOpen(false);
                setEditingRecord(rec);
                setIsModalOpen(true);
              }}
              onDelete={(id) => handleDeleteRecord(id)}
            />
          )}
        </Modal>

        {/* Modal: Create/Edit Tracking File */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingRecord(null); }} 
          title={editingRecord?.id ? 'Modify Career Entity' : 'Initialize New Pipeline Entry'}
          size="lg"
        >
          <TrackingForm 
            initialData={editingRecord || {}} 
            contacts={contacts}
            onSave={handleSaveRecord} 
            onCancel={() => { setIsModalOpen(false); setEditingRecord(null); }} 
          />
        </Modal>

        {/* Modal: Contact Management */}
        <Modal
          isOpen={isContactModalOpen}
          onClose={() => { setIsContactModalOpen(false); setEditingContact(null); }}
          title={editingContact?.id ? 'Modify Professional Node' : 'Initialize New Contact Node'}
        >
          <ContactForm 
            initialData={editingContact || {}}
            onSave={handleSaveContact}
            onCancel={() => { setIsContactModalOpen(false); setEditingContact(null); }}
          />
        </Modal>

        {/* Modal: Outreach Templates */}
        <Modal
          isOpen={isTemplateModalOpen}
          onClose={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }}
          title={editingTemplate?.id ? 'Edit Strategy Template' : 'Initialize Strategy Template'}
        >
          <form onSubmit={handleSaveTemplate} className="space-y-4">
             <div>
               <Label>Template Label</Label>
               <Input required value={editingTemplate?.title || ''} onChange={e => setEditingTemplate({...editingTemplate, title: e.target.value})} placeholder="Referral Pitch V1" />
             </div>
             <div>
               <Label>Category</Label>
               <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" value={editingTemplate?.category || EmailType.COLD} onChange={e => setEditingTemplate({...editingTemplate, category: e.target.value as EmailType})}>
                 {Object.values(EmailType).map(v => <option key={v} value={v}>{v}</option>)}
               </select>
             </div>
             <div>
               <Label>Draft Synthesis</Label>
               <textarea className="w-full px-3 py-2 border border-slate-200 rounded-xl h-40 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required value={editingTemplate?.content || ''} onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})} placeholder="Salutations, [Name]..." />
             </div>
             <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" type="button" onClick={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }}>Abort</Button>
                <Button type="submit">Commit Strategy</Button>
             </div>
          </form>
        </Modal>

        {/* AI Synthesis Layer Notification */}
        {outreachDraft && (
          <div className="fixed bottom-10 right-10 w-[420px] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-3xl border border-indigo-100 animate-in slide-in-from-right-8 fade-in duration-500 overflow-hidden z-50">
            <div className="px-6 py-5 bg-indigo-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                    <Zap size={18} fill="white" />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-xs uppercase tracking-widest">Intelligence Layer</span>
                    <span className="text-[10px] opacity-70">Synthesized Draft Active</span>
                </div>
              </div>
              <button onClick={() => setOutreachDraft('')} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">&times;</button>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 p-5 rounded-2xl text-sm leading-relaxed text-slate-700 whitespace-pre-wrap max-h-[400px] overflow-y-auto mb-6 border border-slate-100 font-medium">
                {outreachDraft}
              </div>
              <div className="flex gap-3">
                <Button className="w-full h-11" size="md" onClick={() => {
                  navigator.clipboard.writeText(outreachDraft);
                  showToast('Content secured to clipboard.');
                }}>Secure Copy</Button>
                <Button className="w-full h-11" variant="secondary" size="md" onClick={() => setOutreachDraft('')}>Dismiss</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
