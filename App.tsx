import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Search, Trash2, Zap, Briefcase, LogOut, LayoutDashboard,
  Users, FileText, Copy, ChevronRight, Eye, Settings, PlusCircle,
  UserPlus, History, Upload, LayoutList, LayoutGrid, CheckCircle,
  AlertTriangle, Filter, X, Target, Sparkles, Calendar, Bell, BrainCircuit,
  Clock, ArrowRight, ChevronLeft
} from 'lucide-react';
import { storage } from './services/storage';
import { auth } from './services/auth';
import { 
  TrackingRecord, ExecutionLog, ApplicationStatus, User,
  OutreachTemplate, EmailType, Contact 
} from './types';
import { STATUS_COLORS } from './constants';
import { Button, Card, Badge, Input, Modal, Label, Textarea, DeleteModal, Select } from './components/Shared';
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<ApplicationStatus[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'RECORDS' | 'CONTACTS'>('RECORDS');
  
  // Notification State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  // AI Prep Modal
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);
  const [prepData, setPrepData] = useState<InterviewPrep | null>(null);
  const [isPrepping, setIsPrepping] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  
  const [editingRecord, setEditingRecord] = useState<Partial<TrackingRecord> | null>(null);
  const [viewingRecord, setViewingRecord] = useState<TrackingRecord | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<OutreachTemplate> | null>(null);
  const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
  
  const [outreachDraft, setOutreachDraft] = useState('');
  const [isDraftingOutreach, setIsDraftingOutreach] = useState(false);

  const [deleteConfig, setDeleteConfig] = useState<{
    isOpen: boolean;
    type: 'RECORD' | 'CONTACT' | 'TEMPLATE' | null;
    id: string | null;
    meta?: any;
  }>({ isOpen: false, type: null, id: null });

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
  }, []);

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

  // Reset pagination when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterStatuses, dateRange]);

  // --- Reminders Logic ---
  const reminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return records.filter(r => {
      // Logic: Status allows follow-up AND date is passed/today AND not yet sent
      const isActive = [ApplicationStatus.SENT, ApplicationStatus.INTERVIEWING].includes(r.status);
      const isDue = r.nextFollowUpDate && r.nextFollowUpDate <= today && !r.followUpSent;
      return isActive && isDue;
    }).sort((a, b) => (a.nextFollowUpDate || '').localeCompare(b.nextFollowUpDate || ''));
  }, [records]);

  const handleMarkFollowUpSent = (record: TrackingRecord) => {
    try {
      storage.saveRecord({ 
        ...record, 
        followUpSent: true,
        // Optionally append a note
        notes: (record.notes || '') + `\n[System] Follow-up marked sent on ${new Date().toLocaleDateString()}`
      });
      refreshData();
      showToast("Follow-up status updated.");
    } catch (err: any) {
      handleOperationError(err);
    }
  };
  // -----------------------

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
    const rec = records.find(r => r.id === id);
    setDeleteConfig({
      isOpen: true,
      type: 'RECORD',
      id,
      meta: { name: rec ? `${rec.roleTitle} at ${rec.company}` : 'Unknown Record' }
    });
  };

  const handleDeleteContact = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    setDeleteConfig({
      isOpen: true,
      type: 'CONTACT',
      id,
      meta: { name: contact?.name || 'Unknown Contact' }
    });
  };

  const handleDeleteTemplate = (id: string) => {
    const t = templates.find(temp => temp.id === id);
    setDeleteConfig({
      isOpen: true,
      type: 'TEMPLATE',
      id,
      meta: { name: t?.title || 'Unknown Template' }
    });
  };

  const executeDelete = () => {
    const { type, id } = deleteConfig;
    if (!type || !id) return;
    try {
      if (type === 'RECORD') {
        storage.deleteRecord(id);
        if (viewingRecord?.id === id) {
          setViewingRecord(null);
          setIsViewModalOpen(false);
        }
        if (editingRecord?.id === id) {
          setEditingRecord(null);
          setIsModalOpen(false);
        }
        showToast("Record purged.", 'success');
      } else if (type === 'CONTACT') {
        storage.deleteContact(id);
        if (editingContact?.id === id) { setEditingContact(null); setIsContactModalOpen(false); }
        showToast("Contact deleted.", 'success');
      } else if (type === 'TEMPLATE') {
        storage.deleteTemplate(id);
        if (editingTemplate?.id === id) { setEditingTemplate(null); setIsTemplateModalOpen(false); }
        showToast("Template deleted.", 'success');
      }
      refreshData();
    } catch (err: any) {
      handleOperationError(err);
    } finally {
      setDeleteConfig({ isOpen: false, type: null, id: null });
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
      showToast("Template saved.");
    } catch (err: any) {
      handleOperationError(err);
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
  
  const handlePrep = async (rec: TrackingRecord) => {
    setIsPrepModalOpen(true);
    setPrepData(null);
    setRevealedAnswers([]);
    setIsPrepping(true);
    const data = await generateInterviewQuestions(rec.roleTitle, rec.company);
    setPrepData(data);
    setIsPrepping(false);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    try {
      const lines = importText.split('\n').filter(l => l.trim().length > 0);
      
      if (importMode === 'RECORDS') {
        const newRecords: Partial<TrackingRecord>[] = [];
        lines.forEach(line => {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length >= 2) {
            newRecords.push({
              company: parts[0], roleTitle: parts[1], name: parts[2] || 'Imported Contact',
              emailAddress: parts[3] || '', status: (parts[4] as ApplicationStatus) || ApplicationStatus.SENT
            });
          }
        });
        if (newRecords.length > 0) {
          storage.saveRecordsBatch(newRecords);
          showToast(`Imported ${newRecords.length} records.`);
        } else {
          showToast("No valid records found.", 'error');
        }
      } else {
        // CONTACTS Import
        const newContacts: Partial<Contact>[] = [];
        lines.forEach(line => {
           const parts = line.split(',').map(p => p.trim());
           if (parts.length >= 2) {
             newContacts.push({
               name: parts[0], email: parts[1], company: parts[2] || 'Unknown',
               linkedInOrSource: parts[3] || '', notes: parts[4] || 'Imported via CSV'
             });
           }
        });
        if (newContacts.length > 0) {
          storage.saveContactsBatch(newContacts);
          showToast(`Imported ${newContacts.length} contacts.`);
        } else {
           showToast("No valid contacts found.", 'error');
        }
      }

      refreshData();
      setIsImportModalOpen(false);
      setImportText('');
      
    } catch (err: any) {
      handleOperationError(err);
    }
  };

  const toggleStatusFilter = (status: ApplicationStatus) => {
    setFilterStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  // Filtered Logic
  const filteredRecords = useMemo(() => {
    let result = records;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.company.toLowerCase().includes(q) || r.roleTitle.toLowerCase().includes(q) || 
        r.name.toLowerCase().includes(q) || r.emailAddress.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    }
    if (filterStatuses.length > 0) result = result.filter(r => filterStatuses.includes(r.status));
    if (dateRange.start) result = result.filter(r => r.dateSent >= dateRange.start);
    if (dateRange.end) result = result.filter(r => r.dateSent <= dateRange.end);
    return result;
  }, [records, searchQuery, filterStatuses, dateRange]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || 
      c.company.toLowerCase().includes(q) || (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery]);

  // Pagination Logic
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContacts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredContacts, currentPage]);

  const totalRecordPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const totalContactPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);

  const PaginationControls = ({ currentPage, totalPages, totalItems, label }: { currentPage: number, totalPages: number, totalItems: number, label: string }) => {
    if (totalItems === 0) return null;
    return (
      <div className="flex items-center justify-between mt-6 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <span className="text-xs font-bold text-slate-400 pl-2">
          Showing <span className="text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of {totalItems} {label}
        </span>
        <div className="flex items-center gap-2">
          <Button 
            size="xs" 
            variant="secondary" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} className="mr-1" /> Prev
          </Button>
          <div className="text-xs font-bold text-slate-900 px-2">Page {currentPage} of {totalPages}</div>
          <Button 
            size="xs" 
            variant="secondary" 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  if (!user) return <LoginForm onLogin={() => setUser(auth.getCurrentUser())} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard applications={records} />; // Pass all records for stats
      case 'applications':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pipeline</h2>
                 <p className="text-slate-500 text-sm font-medium">Manage your active applications</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-white rounded-full p-1 border border-slate-200 shadow-sm flex items-center">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
                    <button onClick={() => setViewMode('table')} className={`p-2 rounded-full transition-all ${viewMode === 'table' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList size={18} /></button>
                 </div>
                 <Button variant="secondary" onClick={() => { setImportMode('RECORDS'); setIsImportModalOpen(true); }} className="hidden md:flex"><Upload size={16} className="mr-2" /> Import</Button>
                 <Button onClick={() => { setEditingRecord({}); setIsModalOpen(true); }} variant="gradient"><PlusCircle size={18} className="mr-2" /> New Application</Button>
              </div>
            </div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4">
                {paginatedRecords.length === 0 ? (
                   <div className="py-24 text-center bg-white/50 rounded-3xl border border-dashed border-slate-300">
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Briefcase size={24} className="text-slate-300" /></div>
                     <h3 className="text-base font-bold text-slate-900">No Records Found</h3>
                     <p className="text-slate-500 text-xs mt-1">Initialize a new opportunity to get started.</p>
                   </div>
                ) : paginatedRecords.map(rec => (
                  <Card key={rec.id} className="p-0 group overflow-hidden border-slate-200/60" hoverEffect>
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${rec.status === ApplicationStatus.OFFER ? 'bg-emerald-500' : rec.status === ApplicationStatus.REJECTED ? 'bg-rose-500' : 'bg-primary-500'}`}></div>
                      <div className="flex-1 pl-4 cursor-pointer" onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }}>
                        <div className="flex items-center gap-3 mb-1.5">
                          <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary-600 transition-colors">{rec.roleTitle}</h3>
                          <Badge className={STATUS_COLORS[rec.status]}>{rec.status}</Badge>
                        </div>
                        <div className="flex items-center text-xs font-medium text-slate-500 space-x-3">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700"><Briefcase size={12} className="text-slate-400" />{rec.company}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span>{new Date(rec.dateSent).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-4 md:pl-0">
                        <Button variant="accent" size="xs" onClick={(e) => {e.stopPropagation(); handlePrep(rec);}} className="text-white"><BrainCircuit size={14} className="mr-1.5" /> Prep</Button>
                        <Button variant="glass" size="xs" onClick={() => handleAIDraft(rec)} className="text-primary-600"><Zap size={14} className="mr-1.5" /> Draft</Button>
                        <Button variant="secondary" size="xs" onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }}><Eye size={14} className="mr-1.5" /> View</Button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="overflow-hidden border-none shadow-xl" noPadding>
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                     <tr>
                       <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Role</th>
                       <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Company</th>
                       <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Status</th>
                       <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {paginatedRecords.map(rec => (
                       <tr key={rec.id} className="hover:bg-primary-50/30 transition-colors group cursor-pointer" onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }}>
                         <td className="px-6 py-4 font-bold text-slate-900">{rec.roleTitle}</td>
                         <td className="px-6 py-4 text-slate-600">{rec.company}</td>
                         <td className="px-6 py-4"><Badge className={STATUS_COLORS[rec.status]}>{rec.status}</Badge></td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <Button size="xs" variant="accent" onClick={(e) => { e.stopPropagation(); handlePrep(rec); }}><BrainCircuit size={14} /></Button>
                             <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); handleAIDraft(rec); }}><Zap size={14} /></Button>
                             <Button size="xs" variant="secondary" onClick={(e) => { e.stopPropagation(); setViewingRecord(rec); setIsViewModalOpen(true); }}><Eye size={14} /></Button>
                             <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></Button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </Card>
            )}
            
            <PaginationControls 
              currentPage={currentPage} 
              totalPages={totalRecordPages} 
              totalItems={filteredRecords.length} 
              label="Records" 
            />
          </div>
        );
      case 'contacts':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Network</h2><p className="text-slate-500 text-sm font-medium">Key relationships</p></div>
              <div className="flex gap-2">
                 <Button variant="secondary" onClick={() => { setImportMode('CONTACTS'); setIsImportModalOpen(true); }}><Upload size={16} className="mr-2" /> Import</Button>
                 <Button onClick={() => { setEditingContact({}); setIsContactModalOpen(true); }} variant="gradient"><UserPlus size={18} className="mr-2" /> New Contact</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedContacts.map(contact => (
                <Card key={contact.id} className="p-6 group relative border-slate-200/60" hoverEffect>
                   <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-lg group-hover:bg-primary-600 group-hover:text-white transition-all shadow-inner">{contact.name[0]}</div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingContact(contact); setIsContactModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary-600 rounded-lg"><Settings size={16} /></button>
                        <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                   </div>
                   <h3 className="font-bold text-lg text-slate-900 mb-1">{contact.name}</h3>
                   <p className="text-xs font-bold text-primary-500 uppercase tracking-wide mb-4">{contact.company}</p>
                   <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-xs text-slate-400 truncate max-w-[120px]">{contact.email}</span>
                      <Button variant="ghost" size="xs" onClick={() => { setSearchQuery(contact.email); setActiveTab('applications'); }} className="text-xs">History <ChevronRight size={10} className="ml-1" /></Button>
                   </div>
                </Card>
              ))}
            </div>
            <PaginationControls 
              currentPage={currentPage} 
              totalPages={totalContactPages} 
              totalItems={filteredContacts.length} 
              label="Contacts" 
            />
          </div>
        );
      case 'templates':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center">
              <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Templates</h2><p className="text-slate-500 text-sm font-medium">Re-usable strategies</p></div>
              <Button onClick={() => { setEditingTemplate({}); setIsTemplateModalOpen(true); }} variant="gradient"><Plus size={18} className="mr-2" /> New Template</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map(t => (
                <Card key={t.id} className="p-6 group flex flex-col h-full border-slate-200/60" hoverEffect>
                   <div className="flex justify-between items-start mb-4">
                      <div><Badge className="bg-slate-100 text-slate-600 mb-2 border-transparent">{t.category}</Badge><h3 className="font-bold text-lg text-slate-900">{t.title}</h3></div>
                      <div className="flex gap-1">
                        <button onClick={() => { navigator.clipboard.writeText(t.content); showToast("Copied to clipboard."); }} className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg"><Copy size={16} /></button>
                        <button onClick={() => { setEditingTemplate(t); setIsTemplateModalOpen(true); }} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg"><Settings size={16} /></button>
                        <button onClick={() => handleDeleteTemplate(t.id)} className="p-2 hover:bg-rose-50 text-rose-400 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                   </div>
                   <div className="flex-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100 group-hover:border-primary-100 transition-colors mask-linear-fade relative">
                     <p className="text-xs text-slate-600 font-mono line-clamp-4">{t.content}</p>
                     <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-50 to-transparent"></div>
                   </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'audit':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit Logs</h2><p className="text-slate-500 text-sm font-medium">System immutable history</p></div>
            <Card className="overflow-hidden shadow-lg border-none" noPadding>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400">
                  <tr><th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Action</th><th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Entity</th><th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Detail</th><th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Time</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{log.action}</span></td>
                      <td className="px-6 py-3"><span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{log.entityType}</span></td>
                      <td className="px-6 py-3 text-slate-800 font-medium text-xs">{log.message}</td>
                      <td className="px-6 py-3 text-slate-400 font-mono text-[10px]">{new Date(log.executedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* PERFORMANCE FIX: Fixed Background Layer */}
      <div className="fixed inset-0 z-[-1] mesh-bg pointer-events-none" />

      {notification && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-full shadow-2xl font-bold text-sm animate-in fade-in slide-in-from-right-10 flex items-center gap-3 border backdrop-blur-md ${notification.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'}`}>
          <div className="bg-white/20 p-1 rounded-full">{notification.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}</div>{notification.message}
        </div>
      )}

      {/* Modern Sidebar */}
      <aside className="w-20 lg:w-72 bg-slate-950 text-slate-400 flex flex-col fixed h-full z-40 border-r border-slate-800 transition-all duration-300">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-4 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 flex-shrink-0"><Zap size={20} fill="currentColor" /></div>
          <div className="hidden lg:block"><h1 className="text-lg font-black text-white tracking-tight leading-none">ApexJob</h1><p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mt-1">Pro CRM</p></div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
            { id: 'applications', label: 'Pipeline', icon: <Briefcase size={20} /> },
            { id: 'contacts', label: 'Network', icon: <Users size={20} /> },
            { id: 'templates', label: 'Templates', icon: <FileText size={20} /> },
            { id: 'audit', label: 'System Logs', icon: <History size={20} /> },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative ${activeTab === item.id ? 'text-white bg-white/5 shadow-inner' : 'hover:text-white hover:bg-white/5'}`}
            >
              {activeTab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-500 rounded-r-full shadow-[0_0_10px_rgba(217,70,239,0.6)]"></div>}
              <div className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110 text-primary-400' : ''}`}>{item.icon}</div>
              <span className="hidden lg:block font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors">
            <LogOut size={18} /><span className="hidden lg:block text-xs font-bold uppercase tracking-widest">Exit</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-20 lg:ml-72 p-6 lg:p-10 min-w-0">
        <header className="mb-10 sticky top-4 z-30">
          {/* PERFORMANCE FIX: Completely removed glassmorphism (backdrop-blur) from sticky header */}
          <div className="bg-white/95 p-3 rounded-full shadow-sm border border-slate-200 flex justify-between items-center">
             <div className="flex items-center gap-4 pl-4">
                <div className="hidden md:flex flex-col">
                   <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Command Center</h2>
                   <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-sm font-bold text-slate-700">System Online</span></div>
                </div>
             </div>
             <div className="flex items-center gap-3 pr-2">
              <div className="relative group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                <input placeholder="Search records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 w-64 bg-slate-100/50 border border-transparent rounded-full text-sm font-medium focus:bg-white focus:border-primary-200 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none" />
              </div>
              <Button variant={showFilters ? 'primary' : 'secondary'} onClick={() => setShowFilters(!showFilters)} size="sm" className={showFilters ? 'shadow-primary-500/20' : ''}>
                <Filter size={16} className="mr-2" /> Filters
                {(filterStatuses.length > 0 || dateRange.start) && <Badge className="ml-2 bg-white text-primary-600">!</Badge>}
              </Button>
              
              {/* Notification Bell */}
              <button 
                onClick={() => setIsNotificationOpen(true)}
                className={`relative p-2.5 rounded-full transition-all duration-300 ${isNotificationOpen ? 'bg-rose-50 text-rose-500' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
              >
                <Bell size={18} />
                {reminders.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border border-white rounded-full animate-pulse-slow"></span>
                )}
              </button>

              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white flex items-center justify-center font-black text-xs border border-white shadow-md">{user.name[0]}</div>
             </div>
          </div>

          {showFilters && (
            <div className="mt-2 p-6 glass-panel rounded-3xl animate-in slide-in-from-top-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.values(ApplicationStatus).map(s => (
                      <Badge key={s} onClick={() => toggleStatusFilter(s)} className={`cursor-pointer border py-1.5 px-3 ${filterStatuses.includes(s) ? STATUS_COLORS[s] + ' ring-2 ring-offset-1' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {s} {filterStatuses.includes(s) && <CheckCircle size={10} className="ml-1.5 inline" />}
                      </Badge>
                    ))}
                  </div>
              </div>
              <div>
                  <Label>Date Range</Label>
                  <div className="flex gap-2 mt-2">
                    <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500" />
                    <span className="self-center text-slate-400">to</span>
                    <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500" />
                  </div>
              </div>
            </div>
          )}
        </header>

        {renderContent()}

        {/* Modals */}
        <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title={importMode === 'RECORDS' ? "Data Ingestion (Pipeline)" : "Data Ingestion (Contacts)"} size="lg">
           <div className="space-y-4">
              <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono">
                {importMode === 'RECORDS' ? 'Format: Company, Role, Name, Email, Status' : 'Format: Name, Email, Company, LinkedIn, Notes'}
              </div>
              <Textarea rows={8} value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste CSV data..." />
              <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cancel</Button><Button onClick={handleImport}>Process</Button></div>
           </div>
        </Modal>

        <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRecord(null); }} title={editingRecord?.id ? 'Edit Record' : 'New Application'} size="lg">
          <TrackingForm initialData={editingRecord || {}} contacts={contacts} onSave={handleSaveRecord} onCancel={() => { setIsModalOpen(false); setEditingRecord(null); }} />
        </Modal>

        <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setViewingRecord(null); }} title="Details" size="lg">
          {viewingRecord && <RecordDetails record={viewingRecord} onEdit={(rec) => { setIsViewModalOpen(false); setEditingRecord(rec); setIsModalOpen(true); }} onDelete={handleDeleteRecord} onPrep={handlePrep} />}
        </Modal>

        <Modal isOpen={isTemplateModalOpen} onClose={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }} title="Strategy Template">
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div><Label required>Name</Label><Input required value={editingTemplate?.title || ''} onChange={e => setEditingTemplate(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label required>Type</Label><Select value={editingTemplate?.category || EmailType.COLD} onChange={e => setEditingTemplate(p => ({ ...p, category: e.target.value as EmailType }))}>{Object.values(EmailType).map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
            <div><Label required>Content</Label><Textarea required rows={8} value={editingTemplate?.content || ''} onChange={e => setEditingTemplate(p => ({ ...p, content: e.target.value }))} /></div>
            <div className="flex justify-end gap-2 mt-4"><Button variant="ghost" type="button" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </Modal>

        <Modal isOpen={isContactModalOpen} onClose={() => { setIsContactModalOpen(false); setEditingContact(null); }} title="Contact Node">
          <ContactForm initialData={editingContact || {}} onSave={handleSaveContact} onCancel={() => { setIsContactModalOpen(false); setEditingContact(null); }} />
        </Modal>

        <Modal isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} title="Action Required">
            <div className="space-y-4">
              {reminders.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <CheckCircle size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">All Clear</h3>
                  <p className="text-xs text-slate-500 mt-1">No pending follow-ups required.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                    <span>Due Reminders</span>
                    <span>{reminders.length} Pending</span>
                  </div>
                  {reminders.map(rec => (
                    <div key={rec.id} className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between group hover:border-rose-300 transition-colors">
                      <div className="flex items-start gap-3">
                         <div className="bg-rose-50 text-rose-500 p-2 rounded-lg mt-1">
                           <Clock size={16} />
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-900">{rec.roleTitle}</h4>
                            <p className="text-xs font-bold text-slate-500">{rec.company}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-rose-500 font-bold uppercase tracking-wide">
                              <span>Due: {new Date(rec.nextFollowUpDate!).toLocaleDateString()}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="xs" 
                          variant="secondary" 
                          onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); setIsNotificationOpen(false); }}
                        >
                          View <ArrowRight size={10} className="ml-1" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleMarkFollowUpSent(rec)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          Mark Sent
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </Modal>

        <Modal isOpen={isPrepModalOpen} onClose={() => setIsPrepModalOpen(false)} title="AI Interview Coach" size="lg">
            {isPrepping ? (
                <div className="flex flex-col items-center justify-center py-12">
                   <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <h3 className="text-lg font-black text-slate-900">Generating Questions...</h3>
                   <p className="text-slate-500">Analzying company profile and role requirements.</p>
                </div>
            ) : prepData?.questions ? (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {prepData.questions.map((q, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 transition-all hover:shadow-md">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="bg-gradient-to-br from-primary-500 to-accent-500 w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shadow-md flex-shrink-0 text-sm">
                                  {idx + 1}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 leading-snug">{q.question}</h3>
                            </div>
                            
                            {revealedAnswers.includes(idx) ? (
                                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl text-sm text-emerald-900 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                                    <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold uppercase text-[10px] tracking-widest">
                                      <CheckCircle size={12} /> Ideal Answer Strategy
                                    </div>
                                    <p className="leading-relaxed whitespace-pre-wrap">{q.idealAnswerKey || "No specific answer key provided by AI for this question."}</p>
                                </div>
                            ) : (
                                <div 
                                  onClick={() => setRevealedAnswers(prev => [...prev, idx])}
                                  className="group cursor-pointer relative bg-slate-100 rounded-xl p-4 flex items-center justify-center border border-dashed border-slate-300 hover:border-accent-300 hover:bg-accent-50 transition-all"
                                >
                                  <div className="filter blur-sm select-none opacity-40 text-xs text-slate-400">
                                    This is a hidden answer key. Click to reveal the AI suggested response strategy for this question.
                                  </div>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Button size="sm" variant="secondary" className="shadow-lg group-hover:scale-105 transition-transform">
                                      <Eye size={14} className="mr-2" /> Reveal Answer Key
                                    </Button>
                                  </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button onClick={() => setIsPrepModalOpen(false)} variant="ghost">Close Session</Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 flex flex-col items-center">
                   <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-400">
                     <AlertTriangle size={32} />
                   </div>
                   <h3 className="text-slate-900 font-bold mb-1">Generation Failed</h3>
                   <p className="text-slate-500 text-sm">AI could not generate questions at this time.</p>
                </div>
            )}
        </Modal>

        <DeleteModal isOpen={deleteConfig.isOpen} onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })} onConfirm={executeDelete} title="Confirm Deletion" description={<span>Permanently remove <strong>{deleteConfig.meta?.name}</strong>?</span>} />
      </main>
    </div>
  );
};

export default App;