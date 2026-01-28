import React, { useState } from 'react';
import { TrackingRecord, ApplicationStatus } from '../types';
import { Badge, Button } from './Shared';
import { STATUS_COLORS } from '../constants';
import { researchCompany } from '../services/ai';
import { 
  Building2, 
  User, 
  Mail, 
  Calendar, 
  Link as LinkIcon, 
  FileText, 
  MessageSquare, 
  Clock, 
  Edit3,
  Globe,
  ExternalLink,
  Sparkles,
  Trash2,
  ChevronLeft,
  Paperclip,
  Download,
  BrainCircuit
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

  const handleResearch = async () => {
    setIsResearching(true);
    const result = await researchCompany(record.company);
    setResearch(result);
    setIsResearching(false);
  };

  const Field = ({ icon: Icon, label, value, color = "text-slate-900" }: { icon: any, label: string, value?: string | boolean | number, color?: string }) => (
    <div className="flex flex-col space-y-1.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <Icon size={12} className="text-slate-300" />
        <span>{label}</span>
      </div>
      <div className={`text-sm font-bold ${color} break-words leading-tight`}>
        {value === true ? "YES" : value === false ? "NO" : value || "NOT RECORDED"}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-4">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col xl:flex-row justify-between items-start gap-8 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50 to-accent-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none"></div>
        
        <div className="space-y-4 relative z-10 flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3">
            <Badge className={`${STATUS_COLORS[record.status]} shadow-sm`}>{record.status}</Badge>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Last Updated: {new Date(record.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-2">{record.roleTitle}</h2>
            <div className="flex items-center space-x-3 text-primary-600 font-bold text-lg">
              <div className="p-1.5 bg-primary-50 rounded-lg">
                <Building2 size={20} />
              </div>
              <span>{record.company}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 relative z-10 w-full xl:w-auto items-center">
             <Button onClick={() => onPrep(record)} variant="accent" className="shadow-accent-500/20 whitespace-nowrap">
               <BrainCircuit size={16} className="mr-2" /> Interview Prep
             </Button>
             <Button onClick={handleResearch} variant="gradient" isLoading={isResearching} className="whitespace-nowrap">
               <Sparkles size={16} className="mr-2" /> Strategic Scan
             </Button>
             
             <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
             
             <Button onClick={() => onEdit(record)} variant="secondary" className="shadow-sm">
               <Edit3 size={16} className="mr-2" /> Edit
             </Button>
             <Button onClick={() => onDelete(record.id)} variant="danger" className="shadow-lg shadow-rose-200 px-3">
               <Trash2 size={16} />
             </Button>
        </div>
      </div>

      {research && (
        <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-3xl border border-primary-100 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-primary-500/5 ring-1 ring-primary-50">
           <div className="flex items-center space-x-3 mb-5">
              <div className="bg-primary-600 p-2.5 rounded-xl shadow-lg shadow-primary-200">
                 <Globe size={20} className="text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-primary-900 uppercase tracking-widest">Live Strategic Intelligence</h4>
                <p className="text-[10px] text-primary-400 font-bold uppercase">AI-Synthesized Briefing</p>
              </div>
           </div>
           <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap mb-6 bg-white/80 p-5 rounded-2xl border border-primary-100/50 shadow-sm">
              {research.content}
           </div>
           {research.sources.length > 0 && (
             <div className="mt-4 pt-4 border-t border-primary-100/50">
                <p className="text-[10px] font-bold text-primary-300 uppercase mb-3 tracking-widest">Verified Sources</p>
                <div className="flex flex-wrap gap-2">
                   {research.sources.map((source, i) => (
                     <a 
                       key={i} 
                       href={source.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:text-primary-600 hover:border-primary-200 transition-colors shadow-sm group"
                     >
                       <span className="truncate max-w-[150px] group-hover:underline">{source.title}</span>
                       <ExternalLink size={10} />
                     </a>
                   ))}
                </div>
             </div>
           )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full flex items-center gap-3 mb-2">
            <div className="h-px bg-slate-200 flex-1"></div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Core Identifiers</h4>
            <div className="h-px bg-slate-200 flex-1"></div>
        </div>
        <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 gap-1">
            <Field icon={User} label="Primary Contact" value={record.name} />
            <Field icon={Mail} label="Contact Email" value={record.emailAddress} color="text-primary-600 font-mono" />
        </div>
        <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 gap-1">
            <Field icon={LinkIcon} label="Source / URL" value={record.linkedInOrSource} />
            <Field icon={Calendar} label="Engagement Date" value={new Date(record.dateSent).toLocaleDateString()} />
        </div>
        <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 gap-1">
            <Field icon={FileText} label="Strategy Type" value={record.emailType} />
            <Field icon={MessageSquare} label="Subject Line" value={record.subjectLineUsed} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
             <div className="w-2 h-2 bg-primary-500 rounded-full mr-2 shadow-sm shadow-primary-200"></div>
             Pitch Synthesis
          </h4>
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm leading-relaxed text-slate-700 shadow-inner italic font-serif relative">
            <div className="absolute top-4 left-4 text-slate-200 text-6xl font-serif leading-none select-none z-0">"</div>
            <span className="relative z-10">{record.valuePitchSummary}</span>
          </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
              <div className="w-2 h-2 bg-accent-500 rounded-full mr-2 shadow-sm shadow-accent-200"></div>
              Personalization Strategy
            </h4>
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm leading-relaxed text-slate-700 shadow-inner">
              {record.personalizationNotes || <span className="text-slate-400 italic">No personalization recorded.</span>}
            </div>
        </div>
      </div>

      {record.attachments && record.attachments.length > 0 && (
        <div className="pt-2">
           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
              <div className="w-6 h-[1px] bg-slate-200 mr-2"></div>
              Secured Assets
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {record.attachments.map(file => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-center overflow-hidden">
                    <div className="bg-primary-50 text-primary-600 p-2.5 rounded-xl mr-3 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <Paperclip size={18} />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={file.data} 
                    download={file.name}
                    className="text-slate-400 hover:text-primary-600 hover:bg-primary-50 p-2 rounded-xl transition-all"
                    title="Download Asset"
                  >
                    <Download size={18} />
                  </a>
                </div>
              ))}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
        <div className={`p-6 rounded-3xl border transition-all ${record.replyReceived ? 'bg-emerald-50/50 border-emerald-100 ring-4 ring-emerald-50/30' : 'bg-slate-50 border-slate-100'}`}>
          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-6 ${record.replyReceived ? 'text-emerald-600' : 'text-slate-500'}`}>Inbound Intelligence</h4>
          <div className="space-y-4">
            <Field icon={Clock} label="Reply Received" value={record.replyReceived} />
            {record.replyReceived && (
              <>
                <Field icon={Calendar} label="Date Received" value={record.replyDate ? new Date(record.replyDate).toLocaleDateString() : ''} />
                <div className="bg-white/60 p-4 rounded-xl border border-emerald-100/50 shadow-sm">
                    <Field icon={FileText} label="Response Digest" value={record.responseSummary} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 text-slate-500">Outbound Lifecycle</h4>
          <div className="space-y-4">
            <Field icon={Clock} label="Follow-Up Dispatched" value={record.followUpSent} />
            {record.nextFollowUpDate && (
              <Field icon={Calendar} label="Scheduled Follow-Up" value={new Date(record.nextFollowUpDate).toLocaleDateString()} />
            )}
            {record.resultAfterFollowUp && (
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <Field icon={FileText} label="Post-Follow Action" value={record.resultAfterFollowUp} />
               </div>
            )}
          </div>
        </div>
      </div>

      {record.notes && (
        <div className="pt-6">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Internal Meta Notes</h4>
          <div className="p-6 bg-[#1e293b] text-slate-300 rounded-3xl font-mono text-xs leading-relaxed shadow-xl shadow-slate-200 border border-slate-700">
            {record.notes}
          </div>
        </div>
      )}
    </div>
  );
};