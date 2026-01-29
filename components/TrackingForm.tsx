import React, { useState, useEffect } from 'react';
import { TrackingRecord, ApplicationStatus, EmailType, Contact, Attachment } from '../types';
import { Button, Input, Label, Select, Checkbox, Textarea, FileUpload } from './Shared';
import { storage } from '../services/storage';
import { X, FileText, Paperclip, UserPlus, Link as LinkIcon, Globe, Mail } from 'lucide-react';

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
    emailType: EmailType.DIRECT_APPLICATION, // Default changed to Direct for easier entry
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

  const [addToNetwork, setAddToNetwork] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasDraft, setHasDraft] = useState(false);

  // Derived state for form mode
  const isDirectApp = formData.emailType === EmailType.DIRECT_APPLICATION;
  const isLinkedContact = !!formData.contactId;

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

    // CORE FIELDS (Always Required)
    if (!formData.company?.trim()) newErrors.company = "Company entity required";
    if (!formData.roleTitle?.trim()) newErrors.roleTitle = "Job title required";
    
    // CONDITIONAL FIELDS BASED ON CHANNEL
    if (isDirectApp) {
        // For Direct Apply, we relax contact requirements
        if (formData.linkedInOrSource && !urlRegex.test(formData.linkedInOrSource)) {
             newErrors.linkedInOrSource = "Invalid URL format";
        }
    } else {
        // For Network/Email outreach, we need contact info
        if (!formData.name?.trim() && !isLinkedContact) newErrors.name = "Contact name required";
        
        // Email is optional if Recruiter/Referral (might be LinkedIn DM), but required for Cold Email
        if (formData.emailType === EmailType.COLD || formData.emailType === EmailType.FOLLOW_UP) {
             if (!formData.emailAddress?.trim() && !isLinkedContact) {
                newErrors.emailAddress = "Email required for this channel";
             } else if (formData.emailAddress && !emailRegex.test(formData.emailAddress)) {
                newErrors.emailAddress = "Invalid email format";
             }
             if (!formData.subjectLineUsed?.trim()) newErrors.subjectLineUsed = "Subject line required for cold outreach";
        }
    }

    // Conditional Logic Checks
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
      setAddToNetwork(false); // Disable "Add new" if we selected existing
    } else {
      setFormData(prev => ({ ...prev, contactId: undefined, name: '', emailAddress: '' }));
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
      let finalData = { ...formData };
      
      // Data Normalization for Direct Applications
      if (isDirectApp) {
          if (!finalData.name) finalData.name = "Hiring Team";
          if (!finalData.emailAddress) finalData.emailAddress = ""; 
          if (!finalData.subjectLineUsed) finalData.subjectLineUsed = "Direct Web Application";
      }

      // Automatic Network Integration
      if (addToNetwork && !finalData.contactId && !isDirectApp && finalData.name) {
          try {
             const newContact = storage.saveContact({
                 name: finalData.name,
                 email: finalData.emailAddress,
                 company: finalData.company,
                 linkedInOrSource: finalData.linkedInOrSource,
                 notes: `Automatically added via Application to ${finalData.company} (${finalData.roleTitle})`
             });
             finalData.contactId = newContact.id;
          } catch (err) {
              console.error("Failed to auto-create contact", err);
              // We continue saving the record even if contact creation fails, just without the link
          }
      }

      storage.clearDraft(draftKey);
      onSave(finalData);
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
        
        {/* SECTION 1: CHANNEL & CONTEXT (MOVED TO TOP) */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-5">
           <div className="flex items-center justify-between">
             <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} className="text-primary-500" />
                Origin & Classification
             </h4>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Label required>Channel Classification</Label>
                <Select value={formData.emailType} onChange={e => handleChange('emailType', e.target.value as EmailType)}>
                  <option value={EmailType.DIRECT_APPLICATION}>Direct Application (Website/Portal)</option>
                  <option value={EmailType.COLD}>Cold Outreach (Email/DM)</option>
                  <option value={EmailType.REFERRAL}>Referral</option>
                  <option value={EmailType.RECRUITER}>Recruiter Inbound</option>
                  <option value={EmailType.FOLLOW_UP}>Follow-Up</option>
                </Select>
              </div>
              <div className="md:col-span-1">
                 <Label required>Engagement Date</Label>
                 <Input type="date" value={formData.dateSent} onChange={e => handleChange('dateSent', e.target.value)} />
              </div>
              <div className="md:col-span-1">
                 <Label required>Current Status</Label>
                 <Select value={formData.status} onChange={e => handleChange('status', e.target.value as ApplicationStatus)}>
                    {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </Select>
              </div>
           </div>
        </div>

        {/* SECTION 2: TARGET ENTITY */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Target Entity</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Organization / Company</Label>
              <Input 
                required 
                placeholder="Target Company Name"
                value={formData.company} 
                onChange={e => handleChange('company', e.target.value)} 
                error={errors.company}
              />
            </div>
             <div>
              <Label required>Functional Role</Label>
              <Input 
                required 
                placeholder="e.g. Senior Frontend Engineer"
                value={formData.roleTitle} 
                onChange={e => handleChange('roleTitle', e.target.value)} 
                error={errors.roleTitle}
              />
            </div>
          </div>
          
           {isDirectApp && (
             <div className="animate-in fade-in slide-in-from-top-2">
                <Label>Job Posting URL / Portal Link</Label>
                <Input 
                  placeholder="https://careers.company.com/..."
                  value={formData.linkedInOrSource} 
                  onChange={e => handleChange('linkedInOrSource', e.target.value)} 
                  error={errors.linkedInOrSource}
                  icon={<LinkIcon size={14} />}
                />
             </div>
           )}
        </div>

        {/* SECTION 3: CONTACT DETAILS (CONDITIONAL) */}
        {!isDirectApp && (
          <div className="space-y-5 animate-in fade-in slide-in-from-top-4">
             <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Contact Point</h4>
                <div className="flex items-center gap-2">
                    <Select 
                        className="!py-1 !px-2 !text-[10px] !h-auto !w-auto border-slate-200" 
                        value={formData.contactId || ''} 
                        onChange={e => handleContactLink(e.target.value)}
                    >
                        <option value="">+ New / Unlinked</option>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                </div>
             </div>

             <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${formData.contactId ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
                <div>
                  <Label required>Contact Name</Label>
                  <Input 
                    placeholder="Recruiter or Hiring Mgr Name"
                    value={formData.name} 
                    onChange={e => handleChange('name', e.target.value)} 
                    error={errors.name}
                    disabled={!!formData.contactId}
                  />
                </div>
                <div>
                   <Label required={formData.emailType === EmailType.COLD}>Contact Email</Label>
                   <Input 
                     type="email"
                     placeholder="target@company.com"
                     value={formData.emailAddress} 
                     onChange={e => handleChange('emailAddress', e.target.value)} 
                     error={errors.emailAddress}
                     disabled={!!formData.contactId}
                   />
                </div>
             </div>
             
             {!formData.contactId && (
                <div className="flex items-center justify-end">
                    <label className="flex items-center space-x-2 cursor-pointer bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
                        <Checkbox checked={addToNetwork} onChange={setAddToNetwork} label="" />
                        <span className="text-xs font-bold flex items-center gap-1.5"><UserPlus size={14} /> Add Person to Network</span>
                    </label>
                </div>
             )}

             <div className="grid grid-cols-1 gap-4">
               <div>
                  <Label>Profile / Context URL</Label>
                  <Input 
                    placeholder="LinkedIn URL or Source"
                    value={formData.linkedInOrSource} 
                    onChange={e => handleChange('linkedInOrSource', e.target.value)} 
                  />
               </div>
               <div>
                  <Label required={formData.emailType === EmailType.COLD}>Subject Line Used</Label>
                  <Input 
                    placeholder="e.g. 'Frontend Engineer Application - [Name]'"
                    value={formData.subjectLineUsed} 
                    onChange={e => handleChange('subjectLineUsed', e.target.value)} 
                    error={errors.subjectLineUsed}
                  />
               </div>
             </div>
          </div>
        )}

        {/* SECTION 4: STRATEGY & NOTES */}
        <div className="space-y-5">
           <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Tactical Execution</h4>
           </div>
           
           <div>
            <Label required={!isDirectApp}>Value Pitch / Key Notes</Label>
            <Textarea 
              required={!isDirectApp}
              rows={3}
              placeholder={isDirectApp ? "Notes on why this role fits..." : "Condensed summary of the value prop sent..."}
              value={formData.valuePitchSummary} 
              onChange={e => handleChange('valuePitchSummary', e.target.value)} 
              error={errors.valuePitchSummary}
            />
          </div>

          {!isDirectApp && (
            <div>
              <Label>Personalization Hooks</Label>
              <Textarea 
                rows={2} 
                placeholder="Mentioned shared connection, podcast, article..."
                value={formData.personalizationNotes} 
                onChange={e => handleChange('personalizationNotes', e.target.value)} 
              />
            </div>
          )}
        </div>

        {/* SECTION 5: ATTACHMENTS */}
        <div className="space-y-5">
           <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Assets</h4>
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
                        <button type="button" onClick={() => removeAttachment(file.id)} className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><X size={14} /></button>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                    <Paperclip size={24} className="text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No assets attached.</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* SECTION 6: OUTCOMES (If not new) */}
        {(formData.id || formData.replyReceived || formData.followUpSent) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="space-y-4">
                <Checkbox label="Inbound Response Detected" checked={formData.replyReceived || false} onChange={val => handleChange('replyReceived', val)} />
                {formData.replyReceived && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <Label required>Reply Timestamp</Label>
                        <Input type="date" required value={formData.replyDate || ''} onChange={e => handleChange('replyDate', e.target.value)} error={errors.replyDate} />
                    </div>
                    <div>
                        <Label>Inbound Intelligence</Label>
                        <Textarea rows={2} placeholder="Digest of their reply..." value={formData.responseSummary} onChange={e => handleChange('responseSummary', e.target.value)} />
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
                        <Label>Outcome Strategy</Label>
                        <Textarea rows={2} placeholder="Impact or change..." value={formData.resultAfterFollowUp} onChange={e => handleChange('resultAfterFollowUp', e.target.value)} />
                    </div>
                    )}
                </div>
            </div>
            </div>
        )}

        <div className="flex flex-col-reverse md:flex-row justify-end items-center gap-4 pt-6 border-t bg-white/80 backdrop-blur sticky bottom-0 z-20 py-4 -mx-4 md:-mx-8 px-4 md:px-8">
          <Button variant="ghost" type="button" onClick={onCancel} className="w-full md:w-auto">Abort Operation</Button>
          <Button type="submit" size="lg" className="px-10 h-12 shadow-xl shadow-indigo-100 w-full md:w-auto">Commit Tactical Record</Button>
        </div>
      </form>
    </div>
  );
};