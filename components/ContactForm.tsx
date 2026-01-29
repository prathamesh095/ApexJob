
import React, { useState, useEffect } from 'react';
import { Contact, TrackingRecord } from '../types';
import { Button, Input, Label, Badge } from './Shared';
import { storage } from '../services/storage';
import { RefreshCw, Loader2, Cloud, CloudOff, Briefcase, Mail, Calendar, Edit3, Trash2, Link as LinkIcon, User, ExternalLink } from 'lucide-react';
import { STATUS_STYLES } from '../constants';

// --- EDIT FORM ---
interface Props {
  initialData?: Partial<Contact>;
  onSave: (data: Partial<Contact>) => void;
  onCancel: () => void;
}

export const ContactForm: React.FC<Props> = ({ initialData = {} as Partial<Contact>, onSave, onCancel }) => {
  const draftKey = `draft_contact_${initialData.id || 'new'}`;
  
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    email: '',
    company: '',
    linkedInOrSource: '',
    notes: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasDraft, setHasDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load draft check
  useEffect(() => {
    const savedDraft = storage.getDraft(draftKey);
    if (savedDraft) setHasDraft(true);
  }, [draftKey]);

  // Auto-save logic
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        storage.saveDraft(draftKey, formData);
        setSaveStatus('saved');
      } catch (e) {
        console.warn("Auto-save failed", e);
        setSaveStatus('idle');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, draftKey]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name?.trim()) newErrors.name = "Full name is mandatory";
    if (!formData.email?.trim()) {
      newErrors.email = "Email is mandatory";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.company?.trim()) newErrors.company = "Company identifier required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      storage.clearDraft(draftKey);
      onSave(formData);
    }
  };

  const handleRestore = () => {
    const draft = storage.getDraft(draftKey);
    if (draft) setFormData(draft);
    setHasDraft(false);
  };

  const handleChange = (field: keyof Contact, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  return (
    <div className="relative">
      {/* Save Status Header */}
      <div className="flex justify-between items-center bg-white/5 rounded-lg p-2 px-3 border border-white/10 mb-6">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Contact Editor</span>
        <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
                <span className="flex items-center text-[10px] text-primary-400 font-bold uppercase tracking-wider">
                    <Loader2 size={14} className="mr-1.5 animate-spin" /> Saving...
                </span>
            )}
            {saveStatus === 'saved' && (
                <span className="flex items-center text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    <Cloud size={14} className="mr-1.5" /> Draft Saved
                </span>
            )}
        </div>
      </div>

      {hasDraft && (
        <div className="bg-primary-500/10 border border-primary-500/20 p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-sm mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500/20 p-1.5 rounded-lg text-primary-300">
                <RefreshCw size={14} />
            </div>
            <div>
                <p className="text-xs font-bold text-primary-200">Unsaved work found</p>
                <p className="text-[10px] text-primary-400/80">Restoring overwrites current fields</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="xs" variant="primary" onClick={handleRestore}>Restore</Button>
            <Button size="xs" variant="ghost" onClick={() => { storage.clearDraft(draftKey); setHasDraft(false); }}>Discard</Button>
          </div>
        </div>
      )}

      <form className="space-y-6 animate-in fade-in duration-300" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label required>Full Name</Label>
            <Input 
              required 
              value={formData.name} 
              onChange={e => handleChange('name', e.target.value)} 
              placeholder="Operational Name" 
              error={errors.name}
            />
          </div>
          <div>
            <Label required>Primary Email</Label>
            <Input 
              required 
              type="email" 
              value={formData.email} 
              onChange={e => handleChange('email', e.target.value)} 
              placeholder="operator@entity.net" 
              error={errors.email}
            />
          </div>
        </div>
        <div>
          <Label required>Current Organization</Label>
          <Input 
            required 
            value={formData.company} 
            onChange={e => handleChange('company', e.target.value)} 
            placeholder="Organization Handle" 
            error={errors.company}
          />
        </div>
        <div>
          <Label>Professional Link (LinkedIn/Personal)</Label>
          <Input 
            value={formData.linkedInOrSource} 
            onChange={e => handleChange('linkedInOrSource', e.target.value)} 
            placeholder="https://linkedin.com/in/..." 
          />
        </div>
        <div>
          <Label>Internal Relationship Meta-Notes</Label>
          <textarea 
            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-primary-500/50 outline-none h-32 transition-all font-medium"
            value={formData.notes} 
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Context: Networking event 04/24, strong focus on Rust/TS..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
          <Button variant="ghost" type="button" onClick={() => { storage.clearDraft(draftKey); onCancel(); }}>Abort</Button>
          <Button type="submit" size="lg" className="px-8 shadow-md">Commit Contact Node</Button>
        </div>
      </form>
    </div>
  );
};

// --- READ-ONLY DETAILS VIEW ---
interface DetailsProps {
    contact: Contact;
    linkedRecords: TrackingRecord[];
    onEdit: () => void;
    onDelete: () => void;
    onOpenRecord: (record: TrackingRecord) => void;
}

export const ContactDetails: React.FC<DetailsProps> = ({ contact, linkedRecords, onEdit, onDelete, onOpenRecord }) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-900/20">
                        {contact.name[0]}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">{contact.name}</h2>
                        <p className="text-primary-400 font-medium flex items-center gap-2">
                            <Briefcase size={14} /> {contact.company}
                        </p>
                        <p className="text-text-muted text-xs mt-1 flex items-center gap-2 font-mono">
                            <Mail size={12} /> {contact.email}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={onEdit}><Edit3 size={14} className="mr-2" /> Edit</Button>
                    <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></Button>
                </div>
            </div>

            {/* Links & Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contact.linkedInOrSource && (
                    <a href={contact.linkedInOrSource} target="_blank" rel="noopener noreferrer" className="p-4 bg-surface-highlight border border-border rounded-xl flex items-center gap-3 hover:bg-surface-highlight/80 transition-colors group">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><LinkIcon size={18} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase">Social Link</p>
                            <p className="text-sm font-medium text-text-primary group-hover:text-blue-400 transition-colors truncate">{contact.linkedInOrSource}</p>
                        </div>
                        <ExternalLink size={14} className="ml-auto text-text-muted" />
                    </a>
                )}
                <div className="p-4 bg-surface-highlight border border-border rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Calendar size={18} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase">Added On</p>
                        <p className="text-sm font-medium text-text-primary font-mono">{new Date(contact.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Linked Applications */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} /> Linked Applications ({linkedRecords.length})
                </h3>
                
                {linkedRecords.length > 0 ? (
                    <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border">
                        {linkedRecords.map(rec => (
                            <div key={rec.id} onClick={() => onOpenRecord(rec)} className="p-4 flex items-center justify-between hover:bg-surface-highlight/50 cursor-pointer group transition-colors">
                                <div>
                                    <h4 className="text-sm font-bold text-text-primary group-hover:text-primary-400 transition-colors">{rec.roleTitle}</h4>
                                    <p className="text-xs text-text-secondary">{rec.company}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-text-muted font-mono">{new Date(rec.updatedAt).toLocaleDateString()}</span>
                                    <Badge className={STATUS_STYLES[rec.status]}>{rec.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-surface-highlight rounded-full flex items-center justify-center text-text-muted mb-3 opacity-50">
                            <Briefcase size={20} />
                        </div>
                        <p className="text-sm text-text-secondary font-medium">No linked records found</p>
                        <p className="text-xs text-text-muted mt-1">Link this contact to applications to see history here.</p>
                    </div>
                )}
            </div>

            {/* Notes Read View */}
            {contact.notes && (
                <div className="bg-surface border border-border p-5 rounded-xl">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Meta Notes</h3>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{contact.notes}</p>
                </div>
            )}
        </div>
    );
};
