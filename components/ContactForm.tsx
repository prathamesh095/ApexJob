
import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { Button, Input, Label } from './Shared';
import { storage } from '../services/storage';
import { RefreshCw, Loader2, Cloud, CloudOff } from 'lucide-react';

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
      <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2 px-3 border border-slate-100 mb-6">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contact Editor</span>
        <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
                <span className="flex items-center text-[10px] text-primary-500 font-bold uppercase tracking-wider">
                    <Loader2 size={10} className="mr-1.5 animate-spin" /> Saving...
                </span>
            )}
            {saveStatus === 'saved' && (
                <span className="flex items-center text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                    <Cloud size={10} className="mr-1.5" /> Draft Saved
                </span>
            )}
        </div>
      </div>

      {hasDraft && (
        <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-sm mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                <RefreshCw size={14} />
            </div>
            <div>
                <p className="text-xs font-bold text-indigo-900">Unsaved work found</p>
                <p className="text-[10px] text-indigo-600/80">Restoring overwrites current fields</p>
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
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32 transition-all font-medium"
            value={formData.notes} 
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Context: Networking event 04/24, strong focus on Rust/TS..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={() => { storage.clearDraft(draftKey); onCancel(); }}>Abort</Button>
          <Button type="submit" size="lg" className="px-8 shadow-md">Commit Contact Node</Button>
        </div>
      </form>
    </div>
  );
};
