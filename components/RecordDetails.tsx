
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
  Trash2
} from 'lucide-react';

interface Props {
  record: TrackingRecord;
  onEdit: (record: TrackingRecord) => void;
  onDelete: (id: string) => void;
}

export const RecordDetails: React.FC<Props> = ({ record, onEdit, onDelete }) => {
  const [research, setResearch] = useState<{ content: string, sources: { title: string, uri: string }[] } | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  const handleResearch = async () => {
    setIsResearching(true);
    const result = await researchCompany(record.company);
    setResearch(result);
    setIsResearching(false);
  };

  const Field = ({ icon: Icon, label, value, color = "text-slate-900" }: { icon: any, label: string, value?: string | boolean | number, color?: string }) => (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <Icon size={12} className="text-slate-300" />
        <span>{label}</span>
      </div>
      <div className={`text-sm font-bold ${color} break-words`}>
        {value === true ? "YES" : value === false ? "NO" : value || "NOT RECORDED"}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Badge className={STATUS_COLORS[record.status]}>{record.status}</Badge>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">{record.roleTitle}</h2>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold">
            <Building2 size={16} />
            <span>{record.company}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleResearch} variant="secondary" size="sm" isLoading={isResearching}>
            <Sparkles size={14} className="mr-2 text-indigo-500" /> Strategic Scan
          </Button>
          <Button onClick={() => onEdit(record)} size="sm" className="shadow-lg">
            <Edit3 size={14} className="mr-2" /> Modify Record
          </Button>
          <Button onClick={() => onDelete(record.id)} size="sm" variant="danger" className="shadow-lg">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {research && (
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
           <div className="flex items-center space-x-2 mb-4">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                 <Globe size={16} className="text-white" />
              </div>
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Live Strategic Intelligence</h4>
           </div>
           <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap mb-4">
              {research.content}
           </div>
           {research.sources.length > 0 && (
             <div className="mt-4 pt-4 border-t border-indigo-100/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Verified Sources</p>
                <div className="flex flex-wrap gap-2">
                   {research.sources.map((source, i) => (
                     <a 
                       key={i} 
                       href={source.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                     >
                       <span className="truncate max-w-[150px]">{source.title}</span>
                       <ExternalLink size={10} />
                     </a>
                   ))}
                </div>
             </div>
           )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <Field icon={User} label="Primary Contact" value={record.name} />
        <Field icon={Mail} label="Contact Email" value={record.emailAddress} color="text-indigo-600 font-mono" />
        <Field icon={LinkIcon} label="Source / URL" value={record.linkedInOrSource} />
        <Field icon={Calendar} label="Engagement Date" value={new Date(record.dateSent).toLocaleDateString()} />
        <Field icon={FileText} label="Strategy Type" value={record.emailType} />
        <Field icon={MessageSquare} label="Subject Line" value={record.subjectLineUsed} />
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
            <div className="w-1 h-1 bg-indigo-500 rounded-full mr-2"></div>
            Pitch Synthesis
          </h4>
          <div className="p-4 bg-white border border-slate-100 rounded-xl text-sm leading-relaxed text-slate-700 shadow-sm italic font-medium">
            "{record.valuePitchSummary}"
          </div>
        </div>

        {record.personalizationNotes && (
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
              <div className="w-1 h-1 bg-indigo-500 rounded-full mr-2"></div>
              Personalization Strategy
            </h4>
            <div className="p-4 bg-white border border-slate-100 rounded-xl text-sm leading-relaxed text-slate-600 shadow-sm">
              {record.personalizationNotes}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className={`p-5 rounded-2xl border ${record.replyReceived ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
          <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 text-slate-500">Inbound Intelligence</h4>
          <div className="space-y-4">
            <Field icon={Clock} label="Reply Received" value={record.replyReceived} />
            {record.replyReceived && (
              <>
                <Field icon={Calendar} label="Date Received" value={record.replyDate ? new Date(record.replyDate).toLocaleDateString() : ''} />
                <Field icon={FileText} label="Response Digest" value={record.responseSummary} />
              </>
            )}
          </div>
        </div>

        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
          <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 text-slate-500">Outbound Lifecycle</h4>
          <div className="space-y-4">
            <Field icon={Clock} label="Follow-Up Dispatched" value={record.followUpSent} />
            {record.nextFollowUpDate && (
              <Field icon={Calendar} label="Scheduled Follow-Up" value={new Date(record.nextFollowUpDate).toLocaleDateString()} />
            )}
            {record.resultAfterFollowUp && (
               <Field icon={FileText} label="Post-Follow Action" value={record.resultAfterFollowUp} />
            )}
          </div>
        </div>
      </div>

      {record.notes && (
        <div className="pt-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Internal Meta Notes</h4>
          <div className="p-4 bg-slate-900 text-slate-300 rounded-xl font-mono text-xs">
            {record.notes}
          </div>
        </div>
      )}
    </div>
  );
};
