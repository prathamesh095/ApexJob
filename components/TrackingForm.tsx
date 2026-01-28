
import React, { useState, useEffect } from 'react';
import { TrackingRecord, ApplicationStatus, EmailType, Contact, Attachment } from '../types';
import { Button, Input, Label, Select, Checkbox, Textarea, FileUpload } from './Shared';
import { storage } from '../services/storage';
import { X, FileText, Paperclip } from 'lucide-react';

interface Props {
  initialData: Partial<TrackingRecord>;
  contacts: Contact[];
  onSave: (record: Partial<TrackingRecord>) => void;
  onCancel: () => void;
}

export const TrackingForm: React.FC<Props> = ({ initialData, contacts, onSave, onCancel }) => {
  const draftKey = `draft_record_${initialData.id || 'new'}`;
  
  const [formData, setFormData] = useState<Partial<TrackingRecord>>({
    dateSent: new Date().toISOString().split('T')[0],
    replyReceived: false,
    followUpSent: false,
    status: ApplicationStatus.SENT,
    emailType: EmailType.COLD,
    name: '',
    emailAddress: '',
    company: '',
    roleTitle: '',
    subjectLineUsed: '',
    valuePitchSummary: '',
    personalizationNotes: '',
    linkedInOrSource: '',
    notes: '',
    responseSummary: '',
    resultAfterFollowUp: '',
    attachments: [],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const savedDraft = storage.getDraft(draftKey);
    if (savedDraft) setHasDraft(true);
  }, [draftKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        storage.saveDraft(draftKey, formData);
      } catch (e) {
        console.warn("Auto-save failed silently", e);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, draftKey]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

    // Required fields
    if (!formData.name?.trim()) newErrors.name = "Full name required";
    if (!formData.company?.trim()) newErrors.company = "Company entity required";
    if (!formData.roleTitle?.trim()) newErrors.roleTitle = "Job title required";
    if (!formData.subjectLineUsed?.trim()) newErrors.subjectLineUsed = "Subject line record required";
    if (!formData.valuePitchSummary?.trim()) newErrors.valuePitchSummary = "Value proposition summary required";
    
    // Email Validation
    if (!formData.emailAddress?.trim()) {
      newErrors.emailAddress = "Email required";
    } else if (!emailRegex.test(formData.emailAddress)) {
      newErrors.emailAddress = "Invalid email format";
    }

    // URL Validation (Optional fields)
    if (formData.linkedInOrSource && !urlRegex.test(formData.linkedInOrSource)) {
      newErrors.linkedInOrSource = "Invalid URL format";
    }

    // Conditional Validation
    if (formData.replyReceived && !formData.replyDate) {
      newErrors.replyDate = "Reply date required when 'Received' is active";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRestore = () => {
    const draft = storage.getDraft(draftKey);
    if (draft) setFormData(draft);
    setHasDraft(false);
  };

  const handleChange = (field: keyof TrackingRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const handleContactLink = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setFormData(prev => ({
        ...prev,
        contactId,
        name: contact.name,
        emailAddress: contact.email,
        company: contact.company,
        linkedInOrSource: contact.linkedInOrSource || prev.linkedInOrSource
      }));
    } else {
      setFormData(prev => ({ ...prev, contactId: undefined }));
    }
  };

  const handleUpload = (file: Attachment) => {
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), file]
    }));
  };

  const removeAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      storage.clearDraft(draftKey);
      onSave(formData);
    }
  };

  return (
    <div className="space-y-6">
      {hasDraft && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-bold text-indigo-900">Unsaved tactical data found.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleRestore}>Restore</Button>
            <Button size="sm" variant="ghost" onClick={() => { storage.clearDraft(draftKey); setHasDraft(false); }}>Discard</Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 pb-10">
        {/* IDENTITY BLOCK */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Entity Identification</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Manual entry or registry link</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <Label required>Registry Sync</Label>
               <Select value={formData.contactId || ''} onChange={e => handleContactLink(e.target.value)}>
                 <option value="">-- Manual Entry / New Node --</option>
                 {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
               </Select>
             </div>
             <div>
               <Label required>Full Name</Label>
               <Input 
                required 
                placeholder="Target Contact Name"
                value={formData.name} 
                onChange={e => handleChange('name', e.target.value)} 
                error={errors.name}
                disabled={!!formData.contactId}
               />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Primary Email</Label>
              <Input 
                required 
                type="email"
                placeholder="contact@company.com"
                value={formData.emailAddress} 
                onChange={e => handleChange('emailAddress', e.target.value)} 
                error={errors.emailAddress}
                disabled={!!formData.contactId}
              />
            </div>
            <div>
              <Label required>Organization Handle</Label>
              <Input 
                required 
                placeholder="Target Company"
                value={formData.company} 
                onChange={e => handleChange('company', e.target.value)} 
                error={errors.company}
                disabled={!!formData.contactId}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Target Functional Role</Label>
              <Input 
                required 
                placeholder="e.g. Lead Product Engineer"
                value={formData.roleTitle} 
                onChange={e => handleChange('roleTitle', e.target.value)} 
                error={errors.roleTitle}
              />
            </div>
            <div>
              <Label>Source / LinkedIn URL</Label>
              <Input 
                placeholder="https://..."
                value={formData.linkedInOrSource} 
                onChange={e => handleChange('linkedInOrSource', e.target.value)} 
                error={errors.linkedInOrSource}
              />
            </div>
          </div>
        </div>

        {/* STRATEGY BLOCK */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Tactical Execution</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Strategy & Outcome</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label required>Engagement Date</Label>
              <Input type="date" value={formData.dateSent} onChange={e => handleChange('dateSent', e.target.value)} />
            </div>
            <div>
              <Label required>Channel Classification</Label>
              <Select value={formData.emailType} onChange={e => handleChange('emailType', e.target.value as EmailType)}>
                {Object.values(EmailType).map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label required>Pipeline Status</Label>
              <Select value={formData.status} onChange={e => handleChange('status', e.target.value as ApplicationStatus)}>
                {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <Label required>Subject Line History</Label>
            <Input 
              required 
              placeholder="The exact subject line dispatched"
              value={formData.subjectLineUsed} 
              onChange={e => handleChange('subjectLineUsed', e.target.value)} 
              error={errors.subjectLineUsed}
            />
          </div>

          <div>
            <Label required>Value Pitch Synthesis</Label>
            <Textarea 
              required
              rows={3}
              placeholder="Condensed summary of the core value proposition sent..."
              value={formData.valuePitchSummary} 
              onChange={e => handleChange('valuePitchSummary', e.target.value)} 
              error={errors.valuePitchSummary}
            />
          </div>

          <div>
            <Label>Personalization Hooks Used</Label>
            <Textarea 
              rows={2} 
              placeholder="Referenced podcast, article, common connection, etc..."
              value={formData.personalizationNotes} 
              onChange={e => handleChange('personalizationNotes', e.target.value)} 
            />
          </div>
        </div>

        {/* ATTACHMENTS BLOCK */}
        <div className="space-y-5">
           <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Secure Assets</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Resumes / Cover Letters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload onUpload={handleUpload} />
            
            <div className="space-y-2">
               {formData.attachments && formData.attachments.length > 0 ? (
                 <div className="space-y-2">
                   {formData.attachments.map(file => (
                     <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm group">
                        <div className="flex items-center overflow-hidden">
                           <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg mr-3">
                             <FileText size={16} />
                           </div>
                           <div className="truncate">
                             <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{file.name}</p>
                             <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                           </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeAttachment(file.id)}
                          className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                        >
                          <X size={14} />
                        </button>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                    <Paperclip size={24} className="text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No assets attached to this record.</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* RESPONSE & FOLLOW-UP BLOCK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="space-y-4">
              <Checkbox label="Inbound Response Detected" checked={formData.replyReceived || false} onChange={val => handleChange('replyReceived', val)} />
              {formData.replyReceived && (
                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <Label required>Reply Timestamp</Label>
                    <Input type="date" required value={formData.replyDate || ''} onChange={e => handleChange('replyDate', e.target.value)} error={errors.replyDate} />
                  </div>
                  <div>
                    <Label>Inbound Intelligence Summary</Label>
                    <Textarea 
                      rows={2} 
                      placeholder="Digest of their reply..." 
                      value={formData.responseSummary} 
                      onChange={e => handleChange('responseSummary', e.target.value)} 
                    />
                  </div>
                </div>
              )}
           </div>

           <div className="space-y-4">
              <Checkbox label="Follow-Up Dispatched" checked={formData.followUpSent || false} onChange={val => handleChange('followUpSent', val)} />
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Scheduled Next Contact</Label>
                  <Input type="date" value={formData.nextFollowUpDate || ''} onChange={e => handleChange('nextFollowUpDate', e.target.value)} />
                </div>
                {formData.followUpSent && (
                  <div>
                    <Label>Follow-Up Outcome Strategy</Label>
                    <Textarea 
                      rows={2} 
                      placeholder="Impact or change after follow-up..." 
                      value={formData.resultAfterFollowUp} 
                      onChange={e => handleChange('resultAfterFollowUp', e.target.value)} 
                    />
                  </div>
                )}
              </div>
           </div>
        </div>

        <div>
          <Label>Internal Operational Meta-Notes</Label>
          <Textarea 
            rows={2} 
            placeholder="Context, gut feelings, or miscellaneous data..." 
            value={formData.notes} 
            onChange={e => handleChange('notes', e.target.value)} 
          />
        </div>

        <div className="flex justify-end items-center gap-4 pt-6 border-t bg-white/80 backdrop-blur sticky bottom-0 z-20 py-4">
          <Button variant="ghost" type="button" onClick={onCancel}>Abort Operation</Button>
          <Button type="submit" size="lg" className="px-10 h-12 shadow-xl shadow-indigo-100">Commit Tactical Record</Button>
        </div>
      </form>
    </div>
  );
};
