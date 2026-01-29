
import React, { useState, useEffect } from 'react';
import { TrackingRecord, ApplicationStatus, EmailType, Contact, Attachment } from '../types';
import { Button, Input, Label, Select, Checkbox, Textarea, FileUpload } from './Shared';
import { storage } from '../services/storage';
import { Cloud, CloudOff, RefreshCw, Link as LinkIcon, Globe, Mail, Briefcase, Users, Repeat, Loader2 } from 'lucide-react';

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
    emailType: EmailType.DIRECT_APPLICATION,
    // Initialize standard fields
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
    // New Fields
    location: '',
    jobId: '',
    applicationSource: '',
    resumeVersion: '',
    coverLetterUsed: false,
    outreachChannel: '',
    referralRelationship: '',
    recruiterType: '',
    screeningDate: '',
    ...initialData
  });

  const [addToNetwork, setAddToNetwork] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasDraft, setHasDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Tabs for Context Switching
  const contexts = [
    { id: EmailType.DIRECT_APPLICATION, label: 'Direct Apply', icon: Globe },
    { id: EmailType.COLD, label: 'Outreach', icon: Mail },
    { id: EmailType.REFERRAL, label: 'Referral', icon: Users },
    { id: EmailType.RECRUITER, label: 'Recruiter', icon: Briefcase },
    { id: EmailType.FOLLOW_UP, label: 'Follow-Up', icon: Repeat },
  ];

  useEffect(() => {
    const savedDraft = storage.getDraft(draftKey);
    if (savedDraft) setHasDraft(true);
  }, [draftKey]);

  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        storage.saveDraft(draftKey, formData);
        setSaveStatus('saved');
      } catch (e) {
        console.warn("Auto-save failed silently", e);
        setSaveStatus('idle'); // revert to idle if failed, or handle error state
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, draftKey]);

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

  const handleContextChange = (type: EmailType) => {
    setFormData(prev => ({ ...prev, emailType: type }));
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

    // GLOBAL REQUIRED FIELDS
    if (!formData.company?.trim()) newErrors.company = "Company identifier required";
    if (!formData.roleTitle?.trim()) newErrors.roleTitle = "Functional role required";
    if (!formData.dateSent) newErrors.dateSent = "Date required";

    // CONTEXT SPECIFIC VALIDATION
    switch (formData.emailType) {
      case EmailType.DIRECT_APPLICATION:
        if (!formData.applicationSource?.trim()) newErrors.applicationSource = "Source (e.g. LinkedIn, Website) required";
        if (formData.linkedInOrSource && !urlRegex.test(formData.linkedInOrSource)) newErrors.linkedInOrSource = "Invalid URL";
        break;

      case EmailType.COLD:
        if (!formData.name?.trim() && !formData.contactId) newErrors.name = "Contact name required";
        if (!formData.emailAddress?.trim() && !formData.contactId) newErrors.emailAddress = "Email required";
        if (!formData.outreachChannel?.trim()) newErrors.outreachChannel = "Channel (Email/DM) required";
        if (!formData.subjectLineUsed?.trim()) newErrors.subjectLineUsed = "Subject line required";
        break;

      case EmailType.REFERRAL:
        if (!formData.name?.trim() && !formData.contactId) newErrors.name = "Referrer name required";
        if (!formData.referralRelationship?.trim()) newErrors.referralRelationship = "Relationship type required";
        break;
      
      case EmailType.RECRUITER:
        if (!formData.name?.trim() && !formData.contactId) newErrors.name = "Recruiter name required";
        if (!formData.applicationSource?.trim()) newErrors.applicationSource = "Inbound source required";
        break;

      case EmailType.FOLLOW_UP:
        if (!formData.followUpSent) newErrors.followUpSent = "Must confirm follow-up sent";
        break;
    }

    // Conditional Logic
    if (formData.replyReceived && !formData.replyDate) {
      newErrors.replyDate = "Reply date required if received";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      setAddToNetwork(false);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        contactId: undefined,
        name: prev.contactId ? '' : prev.name, 
        emailAddress: prev.contactId ? '' : prev.emailAddress
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      let finalData = { ...formData };
      
      if (finalData.emailType === EmailType.DIRECT_APPLICATION) {
        if (!finalData.name) finalData.name = "Hiring Team";
        if (!finalData.subjectLineUsed) finalData.subjectLineUsed = "Direct Application Portal";
      }

      if (addToNetwork && !finalData.contactId && finalData.name) {
          try {
             const newContact = storage.saveContact({
                 name: finalData.name,
                 email: finalData.emailAddress,
                 company: finalData.company,
                 linkedInOrSource: finalData.linkedInOrSource,
                 notes: `Added via ${finalData.emailType} to ${finalData.company}`
             });
             finalData.contactId = newContact.id;
          } catch (err) {
              console.error("Failed to auto-create contact", err);
          }
      }

      storage.clearDraft(draftKey);
      onSave(finalData);
    }
  };

  const handleRestore = () => {
    const draft = storage.getDraft(draftKey);
    if (draft) setFormData(draft);
    setHasDraft(false);
  };

  const renderContactPicker = (label: string = "Target Contact") => (
    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <Label required>{label}</Label>
        <Select className="!w-auto !py-1 !text-xs" value={formData.contactId || ''} onChange={e => handleContactLink(e.target.value)}>
            <option value="">+ New / Unlinked</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
   </div>
  );

  const renderContactFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label required>Name</Label><Input disabled={!!formData.contactId} value={formData.name} onChange={e => handleChange('name', e.target.value)} error={errors.name} /></div>
        <div><Label>Email</Label><Input type="email" disabled={!!formData.contactId} value={formData.emailAddress} onChange={e => handleChange('emailAddress', e.target.value)} error={errors.emailAddress} /></div>
      </div>
      {!formData.contactId && (
        <div className="flex justify-end"><Checkbox label="Add to Network" checked={addToNetwork} onChange={setAddToNetwork} /></div>
      )}
    </>
  );

  return (
    <div className="space-y-6 relative">
      {/* Auto-Save & Status Indicator - Floating Top Right */}
      <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2 px-3 border border-slate-100">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Editor Mode: Active</span>
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
             {saveStatus === 'idle' && hasDraft && (
                <span className="flex items-center text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                    <CloudOff size={10} className="mr-1.5" /> Unsynced
                </span>
            )}
        </div>
      </div>

      {hasDraft && (
        <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                <RefreshCw size={14} className={saveStatus === 'saving' ? 'animate-spin' : ''} />
            </div>
            <div>
                <p className="text-xs font-bold text-indigo-900">Previous draft available</p>
                <p className="text-[10px] text-indigo-600/80">Recover unsaved changes?</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="xs" variant="primary" onClick={handleRestore}>Restore</Button>
            <Button size="xs" variant="ghost" onClick={() => { storage.clearDraft(draftKey); setHasDraft(false); }}>Discard</Button>
          </div>
        </div>
      )}

      {/* CONTEXT TABS */}
      <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-hide">
        {contexts.map(ctx => {
            const Icon = ctx.icon;
            const isActive = formData.emailType === ctx.id;
            return (
                <button
                    key={ctx.id}
                    type="button"
                    onClick={() => handleContextChange(ctx.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Icon size={14} />
                    {ctx.label}
                </button>
            )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-10">
        
        {/* SHARED CORE DATA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Company Entity</Label>
              <Input required placeholder="e.g. Acme Corp" value={formData.company} onChange={e => handleChange('company', e.target.value)} error={errors.company} />
            </div>
            <div>
              <Label required>Role Title</Label>
              <Input required placeholder="e.g. Senior Engineer" value={formData.roleTitle} onChange={e => handleChange('roleTitle', e.target.value)} error={errors.roleTitle} />
            </div>
        </div>

        {/* DYNAMIC CONTEXT FIELDS */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {formData.emailType === EmailType.DIRECT_APPLICATION && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label required>Application Source</Label>
                        <Select value={formData.applicationSource} onChange={e => handleChange('applicationSource', e.target.value)} error={errors.applicationSource}>
                            <option value="">Select Source...</option>
                            <option value="Company Website">Company Career Page</option>
                            <option value="LinkedIn Jobs">LinkedIn Jobs</option>
                            <option value="Indeed">Indeed</option>
                            <option value="Glassdoor">Glassdoor</option>
                            <option value="Wellfound">Wellfound</option>
                            <option value="Other">Other</option>
                        </Select>
                      </div>
                      <div>
                          <Label>Job Posting URL</Label>
                          <Input placeholder="https://..." value={formData.linkedInOrSource} onChange={e => handleChange('linkedInOrSource', e.target.value)} icon={<LinkIcon size={14} />} error={errors.linkedInOrSource} />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><Label>Job ID / Req #</Label><Input placeholder="Optional" value={formData.jobId} onChange={e => handleChange('jobId', e.target.value)} /></div>
                      <div><Label>Location</Label><Input placeholder="City / Remote" value={formData.location} onChange={e => handleChange('location', e.target.value)} /></div>
                      <div><Label>Resume Version</Label><Input placeholder="e.g. v2_React" value={formData.resumeVersion} onChange={e => handleChange('resumeVersion', e.target.value)} /></div>
                  </div>
                  <div>
                      <Checkbox label="Cover Letter Included" checked={formData.coverLetterUsed || false} onChange={v => handleChange('coverLetterUsed', v)} />
                  </div>
                </>
            )}

            {formData.emailType === EmailType.COLD && (
                <>
                   {renderContactPicker("Target Contact")}
                   {renderContactFields()}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label required>Channel</Label>
                            <Select value={formData.outreachChannel} onChange={e => handleChange('outreachChannel', e.target.value)} error={errors.outreachChannel}>
                                <option value="">Select...</option>
                                <option value="Email">Email</option>
                                <option value="LinkedIn DM">LinkedIn DM</option>
                                <option value="Twitter/X">Twitter/X</option>
                                <option value="Other">Other</option>
                            </Select>
                        </div>
                        <div>
                            <Label required>Subject Line</Label>
                            <Input placeholder="Subject used..." value={formData.subjectLineUsed} onChange={e => handleChange('subjectLineUsed', e.target.value)} error={errors.subjectLineUsed} />
                        </div>
                   </div>
                </>
            )}

            {formData.emailType === EmailType.REFERRAL && (
                <>
                   {renderContactPicker("Referrer Name")}
                   {renderContactFields()}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label required>Relationship</Label>
                            <Select value={formData.referralRelationship} onChange={e => handleChange('referralRelationship', e.target.value)} error={errors.referralRelationship}>
                                <option value="">Select...</option>
                                <option value="Ex-Colleague">Ex-Colleague</option>
                                <option value="Friend">Friend</option>
                                <option value="Alumni">Alumni</option>
                                <option value="Community">Community</option>
                            </Select>
                        </div>
                        <div><Label>Resume Version</Label><Input value={formData.resumeVersion} onChange={e => handleChange('resumeVersion', e.target.value)} /></div>
                   </div>
                </>
            )}

            {formData.emailType === EmailType.RECRUITER && (
                <>
                   {renderContactPicker("Recruiter Name")}
                   {renderContactFields()}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                           <Label required>Inbound Source</Label>
                           <Select value={formData.applicationSource} onChange={e => handleChange('applicationSource', e.target.value)} error={errors.applicationSource}>
                               <option value="">Select...</option>
                               <option value="LinkedIn InMail">LinkedIn InMail</option>
                               <option value="Email">Direct Email</option>
                               <option value="Call">Phone Call</option>
                           </Select>
                       </div>
                       <div>
                           <Label>Recruiter Type</Label>
                           <Select value={formData.recruiterType} onChange={e => handleChange('recruiterType', e.target.value)}>
                               <option value="">Select...</option>
                               <option value="Internal">Internal (Company)</option>
                               <option value="Agency">External (Agency)</option>
                           </Select>
                       </div>
                   </div>
                   <div><Label>Screening Date</Label><Input type="date" value={formData.screeningDate} onChange={e => handleChange('screeningDate', e.target.value)} /></div>
                </>
            )}

        </div>

        {/* SHARED: STATUS & DATES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div><Label required>Action Date</Label><Input type="date" value={formData.dateSent} onChange={e => handleChange('dateSent', e.target.value)} error={errors.dateSent} /></div>
             <div>
                 <Label required>Current Status</Label>
                 <Select value={formData.status} onChange={e => handleChange('status', e.target.value as ApplicationStatus)}>
                     {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </Select>
             </div>
             <div><Label>Next Follow-Up</Label><Input type="date" value={formData.nextFollowUpDate} onChange={e => handleChange('nextFollowUpDate', e.target.value)} /></div>
        </div>

        <div>
            <Label>Strategic Notes / Value Pitch</Label>
            <Textarea rows={4} placeholder="Context, pitch used, or key details..." value={formData.valuePitchSummary} onChange={e => handleChange('valuePitchSummary', e.target.value)} />
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
             <Label>Attachments</Label>
             <div className="mt-2"><FileUpload onUpload={file => setFormData(p => ({...p, attachments: [...(p.attachments||[]), file]}))} /></div>
             <div className="mt-2 space-y-1">
                 {formData.attachments?.map(f => (
                     <div key={f.id} className="flex justify-between text-xs p-2 bg-white border rounded"><span className="truncate">{f.name}</span><button type="button" onClick={() => setFormData(p => ({...p, attachments: p.attachments?.filter(a => a.id !== f.id)}))} className="text-rose-500 font-bold">X</button></div>
                 ))}
             </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
            <Checkbox label="Response Received" checked={formData.replyReceived || false} onChange={v => handleChange('replyReceived', v)} />
            {formData.replyReceived && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in fade-in">
                    <div><Label required>Reply Date</Label><Input type="date" value={formData.replyDate} onChange={e => handleChange('replyDate', e.target.value)} error={errors.replyDate} /></div>
                    <div><Label>Response Summary</Label><Input value={formData.responseSummary} onChange={e => handleChange('responseSummary', e.target.value)} /></div>
                </div>
            )}
            
            <div className="mt-4">
              <Checkbox label="Follow-Up Dispatched" checked={formData.followUpSent || false} onChange={v => handleChange('followUpSent', v)} />
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
             <Button type="button" variant="ghost" onClick={() => { storage.clearDraft(draftKey); onCancel(); }}>Cancel</Button>
             <Button type="submit" size="lg">Commit Record</Button>
        </div>
      </form>
    </div>
  );
};
