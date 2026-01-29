
import React, { useState } from 'react';
import { TrackingRecord, ApplicationStatus, EmailType } from '../types';
import { Badge, Button } from './Shared';
import { researchCompany } from '../services/ai';
import { STATUS_STYLES } from '../constants';
import { 
  Building2, User, Mail, Calendar, Link as LinkIcon, FileText, 
  Clock, Edit3, Globe, ExternalLink, Sparkles, Trash2, Paperclip, 
  Download, BrainCircuit, MapPin, Hash, Users, Briefcase, ChevronDown, ChevronUp
} from 'lucide-react';

interface Props {
  record: TrackingRecord;
  onEdit: (record: TrackingRecord) => void;
  onDelete: (id: string) => void;
  onPrep: (record: TrackingRecord) => void;
}

export const RecordDetails: React.FC<Props> = ({ record, onEdit, onDelete, onPrep }) => {
  const [research, setResearch] = useState<{ content: string, sources: { title: string, uri: string }[] } | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [isResearchExpanded, setIsResearchExpanded] = useState(true);

  const handleResearch = async () => {
    if (research) { setIsResearchExpanded(!isResearchExpanded); return; }
    setIsResearching(true);
    const result = await researchCompany(record.company);
    setResearch(result);
    setIsResearchExpanded(true);
    setIsResearching(false);
  };

  const DataBlock = ({ icon: Icon, label, value, color = "text-text-primary" }: any) => (
    <div className="bg-surface-highlight/50 border border-border p-4 rounded-lg flex flex-col gap-1 hover:border-border-light transition-colors">
      <div className="flex items-center gap-2 text-text-muted text-[10px] font-bold uppercase tracking-widest">
        <Icon size={12} /> {label}
      </div>
      <div className={`text-sm font-medium truncate ${color}`}>
        {value === true ? "YES" : value === false ? "NO" : value || "—"}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
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
             <Button size="sm" variant="ghost" onClick={() => onEdit(record)}><Edit3 size={16} /></Button>
             <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => onDelete(record.id)}><Trash2 size={16} /></Button>
          </div>
        </div>
      </div>

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

      {/* INFO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         <DataBlock icon={Globe} label="Channel" value={record.emailType} />
         <DataBlock icon={LinkIcon} label="Source" value={record.applicationSource || record.linkedInOrSource} />
         <DataBlock icon={MapPin} label="Location" value={record.location} />
         
         {record.emailType === EmailType.DIRECT_APPLICATION ? (
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

      {/* NOTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-surface border border-border p-5 rounded-xl shadow-sm">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Value Pitch Synthesis</h4>
            <p className="text-sm text-text-secondary leading-relaxed italic border-l-2 border-primary-500 pl-4">{record.valuePitchSummary || "No pitch recorded."}</p>
         </div>
         <div className="bg-surface border border-border p-5 rounded-xl shadow-sm">
             <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">System Meta</h4>
             <div className="space-y-2 text-sm text-text-secondary">
                <p><span className="text-text-muted">Subject:</span> {record.subjectLineUsed || "—"}</p>
                <p><span className="text-text-muted">Updated:</span> {new Date(record.updatedAt).toLocaleDateString()}</p>
             </div>
         </div>
      </div>

      {/* ATTACHMENTS */}
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
