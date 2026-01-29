
import React, { useState, useMemo } from 'react';
import { TrackingRecord, ApplicationStatus, Contact } from '../types';
import { Badge, Button, Textarea } from './Shared';
import { researchCompany } from '../services/ai';
import { STATUS_STYLES } from '../constants';
import { 
  Building2, User, Mail, Calendar, Link as LinkIcon, FileText, 
  Clock, Edit3, Globe, ExternalLink, Sparkles, Trash2, Paperclip, 
  Download, BrainCircuit, MapPin, Hash, CheckCircle, AlertCircle, 
  MessageSquare, ArrowRight, Send, History
} from 'lucide-react';

interface Props {
  record: TrackingRecord;
  contacts: Contact[];
  onEdit: (record: TrackingRecord) => void;
  onDelete: (id: string) => void;
  onPrep: (record: TrackingRecord) => void;
  onUpdate: (id: string, data: Partial<TrackingRecord>) => void;
}

export const RecordDetails: React.FC<Props> = ({ record, contacts, onEdit, onDelete, onPrep, onUpdate }) => {
  const [research, setResearch] = useState<{ content: string, sources: { title: string, uri: string }[] } | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [isResearchExpanded, setIsResearchExpanded] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const linkedContact = useMemo(() => 
    contacts.find(c => c.id === record.contactId) || (record.emailAddress && contacts.find(c => c.email === record.emailAddress)), 
  [record, contacts]);

  const handleResearch = async () => {
    if (research) { setIsResearchExpanded(!isResearchExpanded); return; }
    setIsResearching(true);
    const result = await researchCompany(record.company);
    setResearch(result);
    setIsResearchExpanded(true);
    setIsResearching(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const timestamp = new Date().toLocaleString();
    const updatedNotes = record.notes 
      ? `${record.notes}\n\n[${timestamp}] ${newNote}`
      : `[${timestamp}] ${newNote}`;
    
    onUpdate(record.id, { notes: updatedNotes });
    setNewNote('');
    setIsAddingNote(false);
  };

  const handleQuickAction = (action: 'SENT_FOLLOW_UP' | 'INTERVIEW_COMPLETE' | 'OFFER_RECEIVED') => {
    const today = new Date().toISOString().split('T')[0];
    switch (action) {
        case 'SENT_FOLLOW_UP':
            onUpdate(record.id, { 
                followUpSent: true, 
                nextFollowUpDate: '', // Clear pending
                notes: (record.notes || '') + `\n[${new Date().toLocaleString()}] Follow-up sent.` 
            });
            break;
    }
  };

  // --- GUIDANCE ENGINE ---
  const guidance = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    if (record.status === ApplicationStatus.INTERVIEWING) {
        return {
            level: 'critical',
            title: 'Interview Phase Active',
            message: 'Ensure you have reviewed the company research and prepared scenarios.',
            action: 'PREP_INTERVIEW'
        };
    }
    
    if (record.nextFollowUpDate && record.nextFollowUpDate <= today && !record.followUpSent) {
        return {
            level: 'urgent',
            title: 'Follow-Up Required',
            message: `A scheduled follow-up for ${record.roleTitle} is due today.`,
            action: 'SEND_FOLLOW_UP'
        };
    }

    if (record.status === ApplicationStatus.SENT && !record.replyReceived) {
        const daysSince = Math.floor((Date.now() - new Date(record.dateSent).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 7) {
             return {
                level: 'warning',
                title: 'Stalled Application',
                message: `No reply for ${daysSince} days. Consider sending a value-add follow-up.`,
                action: 'CONSIDER_FOLLOW_UP'
            };
        }
    }

    return {
        level: 'info',
        title: 'On Track',
        message: 'No immediate actions required. Keep monitoring for replies.',
        action: 'NONE'
    };
  }, [record]);

  const DataBlock = ({ icon: Icon, label, value, color = "text-text-primary" }: any) => (
    <div className="bg-surface-highlight/50 border border-border p-4 rounded-lg flex flex-col gap-1 hover:border-border-strong transition-colors group">
      <div className="flex items-center gap-2 text-text-muted text-[10px] font-bold uppercase tracking-widest group-hover:text-text-secondary transition-colors">
        <Icon size={12} /> {label}
      </div>
      <div className={`text-sm font-medium truncate ${color}`}>
        {value === true ? "YES" : value === false ? "NO" : value || "—"}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* 1. GUIDANCE PANEL (New) */}
      <div className={`p-5 rounded-xl border flex items-start gap-4 shadow-soft ${
          guidance.level === 'critical' ? 'bg-purple-500/10 border-purple-500/30' :
          guidance.level === 'urgent' ? 'bg-red-500/10 border-red-500/30' :
          guidance.level === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
          'bg-surface-highlight border-border'
      }`}>
         <div className={`p-2 rounded-lg shrink-0 ${
             guidance.level === 'critical' ? 'bg-purple-500/20 text-purple-400' :
             guidance.level === 'urgent' ? 'bg-red-500/20 text-red-400' :
             guidance.level === 'warning' ? 'bg-amber-500/20 text-amber-400' :
             'bg-surface text-text-muted'
         }`}>
             {guidance.level === 'critical' || guidance.level === 'urgent' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
         </div>
         <div className="flex-1">
             <h4 className={`text-sm font-bold mb-1 ${
                 guidance.level === 'critical' ? 'text-purple-100' :
                 guidance.level === 'urgent' ? 'text-red-100' :
                 guidance.level === 'warning' ? 'text-amber-100' :
                 'text-text-primary'
             }`}>{guidance.title}</h4>
             <p className={`text-xs leading-relaxed ${
                 guidance.level === 'info' ? 'text-text-secondary' : 'opacity-90 text-white'
             }`}>{guidance.message}</p>
             
             {guidance.action === 'SEND_FOLLOW_UP' && (
                 <div className="mt-3 flex gap-2">
                     <Button size="xs" variant="primary" onClick={() => handleQuickAction('SENT_FOLLOW_UP')}>
                        <Send size={12} className="mr-2" /> Mark Follow-Up Sent
                     </Button>
                     <Button size="xs" variant="glass" onClick={() => onEdit(record)}>
                        Reschedule
                     </Button>
                 </div>
             )}
             
             {guidance.action === 'PREP_INTERVIEW' && (
                 <div className="mt-3">
                     <Button size="xs" variant="secondary" onClick={() => onPrep(record)}>
                        <BrainCircuit size={12} className="mr-2" /> Start AI Prep Session
                     </Button>
                 </div>
             )}
         </div>
      </div>

      {/* 2. HEADER CARD */}
      <div className="bg-gradient-to-br from-surface to-background border border-border p-6 rounded-2xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col gap-6">
          <div className="space-y-2">
             <div className="flex flex-wrap items-center gap-3">
               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[record.status]}`}>{record.status}</span>
               <span className="text-[10px] font-mono text-text-muted">ID: {record.id.slice(0, 8)}</span>
             </div>
             <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight break-words">{record.roleTitle}</h2>
             <div className="flex items-center gap-2 text-primary-400 font-medium text-sm sm:text-base">
               <Building2 size={16} /> {record.company}
             </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
             <Button size="sm" variant="secondary" onClick={() => onPrep(record)}><BrainCircuit size={16} className="mr-2" /> Prep</Button>
             <Button size="sm" variant="glass" onClick={handleResearch} isLoading={isResearching}><Sparkles size={16} className="mr-2" /> {research ? 'Intel' : 'Scan'}</Button>
             <div className="w-px bg-border mx-2 hidden sm:block"></div>
             <Button size="sm" variant="ghost" onClick={() => onEdit(record)}><Edit3 size={16} /> Edit</Button>
             <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => onDelete(record.id)}><Trash2 size={16} /></Button>
          </div>
        </div>
      </div>

      {/* 3. AI RESEARCH */}
      {research && isResearchExpanded && (
         <div className="bg-primary-900/10 border border-primary-500/20 p-5 rounded-xl animate-fade-in shadow-sm">
            <h4 className="text-xs font-bold text-primary-300 uppercase tracking-widest mb-3 flex items-center gap-2"><Globe size={14} /> Strategic Briefing</h4>
            <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{research.content}</div>
            
            {research.sources?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-primary-500/20">
                <h5 className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-2">Sources</h5>
                <ul className="space-y-1">
                  {research.sources.map((source, idx) => (
                    <li key={idx}>
                      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-300 hover:text-white flex items-center gap-1 truncate transition-colors">
                        <ExternalLink size={10} /> {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
         </div>
      )}

      {/* 4. CONNECTED ITEMS (Contacts) */}
      {linkedContact && (
          <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-500/30">
                      <User size={20} />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Linked Contact</p>
                      <h4 className="text-sm font-bold text-text-primary">{linkedContact.name}</h4>
                      <p className="text-xs text-text-secondary">{linkedContact.email}</p>
                  </div>
              </div>
              <Button size="xs" variant="secondary" onClick={() => window.location.href = `mailto:${linkedContact.email}`}>
                  <Mail size={14} className="mr-2" /> Email
              </Button>
          </div>
      )}

      {/* 5. INFO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         <DataBlock icon={Globe} label="Channel" value={record.emailType} />
         <DataBlock icon={LinkIcon} label="Source" value={record.applicationSource || record.linkedInOrSource} />
         <DataBlock icon={MapPin} label="Location" value={record.location} />
         
         {record.emailType === 'DIRECT_APPLICATION' ? (
           <>
             <DataBlock icon={FileText} label="Resume" value={record.resumeVersion} />
             <DataBlock icon={Hash} label="Job ID" value={record.jobId} />
           </>
         ) : (
           <>
             <DataBlock icon={User} label="Contact" value={record.name} />
             <DataBlock icon={Mail} label="Email" value={record.emailAddress} color="text-primary-400 font-mono" />
           </>
         )}
      </div>

      {/* 6. REMARKS & HISTORY (Interactive) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-surface border border-border p-5 rounded-xl shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={12} /> Remarks & Activity
                </h4>
                <button onClick={() => setIsAddingNote(!isAddingNote)} className="text-primary-400 hover:text-primary-300 text-xs font-bold transition-colors">
                    {isAddingNote ? 'Cancel' : '+ Add Note'}
                </button>
            </div>
            
            {isAddingNote && (
                <div className="mb-4 animate-slide-up">
                    <Textarea 
                        value={newNote} 
                        onChange={(e) => setNewNote(e.target.value)} 
                        placeholder="Log a call, email summary, or thought..." 
                        className="mb-2 text-xs"
                        rows={3}
                    />
                    <Button size="xs" variant="primary" onClick={handleAddNote} disabled={!newNote.trim()}>Save Remark</Button>
                </div>
            )}

            <div className="flex-1 bg-surface-highlight/30 rounded-lg p-3 overflow-y-auto max-h-[200px] border border-border custom-scrollbar">
                {record.notes ? (
                    <div className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                        {record.notes}
                    </div>
                ) : (
                    <div className="text-center text-text-muted text-xs py-8 italic">No remarks recorded.</div>
                )}
            </div>
         </div>

         <div className="bg-surface border border-border p-5 rounded-xl shadow-sm">
             <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2"><History size={12} /> Value Pitch</h4>
             <p className="text-sm text-text-secondary leading-relaxed italic border-l-2 border-primary-500 pl-4 mb-6">
                 {record.valuePitchSummary || "No pitch recorded."}
             </p>
             
             <div className="border-t border-border pt-4">
                 <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Meta</h5>
                 <div className="space-y-1 text-xs text-text-secondary">
                    <div className="flex justify-between"><span>Subject:</span> <span className="text-text-primary">{record.subjectLineUsed || "—"}</span></div>
                    <div className="flex justify-between"><span>Updated:</span> <span className="font-mono">{new Date(record.updatedAt).toLocaleDateString()}</span></div>
                 </div>
             </div>
         </div>
      </div>

      {/* 7. ATTACHMENTS */}
      {record.attachments?.length > 0 && (
        <div>
           <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Encrypted Assets</h4>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {record.attachments.map(f => (
                 <div key={f.id} className="flex items-center justify-between p-3 bg-surface-highlight border border-border rounded-lg group hover:bg-surface-highlight/80 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className="bg-primary-500/20 p-2 rounded text-primary-400"><Paperclip size={16} /></div>
                       <div className="truncate">
                          <p className="text-sm font-medium text-text-primary truncate">{f.name}</p>
                          <p className="text-[10px] text-text-muted font-mono">{(f.size/1024).toFixed(1)} KB</p>
                       </div>
                    </div>
                    <a href={f.data} download={f.name} className="p-2 text-text-muted hover:text-primary-400"><Download size={16} /></a>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
