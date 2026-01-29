
import React from 'react';
import { 
  Briefcase, 
  Users, 
  Mail, 
  LayoutDashboard, 
  History, 
  FileText, 
  Settings 
} from 'lucide-react';
import { ApplicationStatus } from './types';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'applications', label: 'Applications', icon: <Briefcase size={20} /> },
  { id: 'contacts', label: 'Contacts', icon: <Users size={20} /> },
  { id: 'outreach', label: 'Outreach History', icon: <Mail size={20} /> },
  { id: 'templates', label: 'Templates', icon: <FileText size={20} /> },
  { id: 'audit', label: 'Audit Logs', icon: <History size={20} /> },
];

// Unified Status Styles for Dark Mode
// Using distinct hues and subtle glows to ensure visual clarity on dark backgrounds
export const STATUS_STYLES: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  [ApplicationStatus.SENT]: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
  [ApplicationStatus.INTERVIEWING]: 'bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-[0_0_10px_-2px_rgba(139,92,246,0.3)]',
  [ApplicationStatus.OFFER]: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.3)]',
  [ApplicationStatus.REJECTED]: 'bg-red-500/10 text-red-300 border border-red-500/20',
  [ApplicationStatus.WITHDRAWN]: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  [ApplicationStatus.GHOSTED]: 'bg-slate-800/40 text-slate-500 border border-slate-700/30',
};

export const STATUS_COLORS = STATUS_STYLES; // Alias for backward compatibility if needed locally

export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.DRAFT]: [ApplicationStatus.SENT, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.SENT]: [ApplicationStatus.INTERVIEWING, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN, ApplicationStatus.GHOSTED],
  [ApplicationStatus.INTERVIEWING]: [ApplicationStatus.OFFER, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN, ApplicationStatus.GHOSTED],
  [ApplicationStatus.OFFER]: [ApplicationStatus.SENT, ApplicationStatus.WITHDRAWN], 
  [ApplicationStatus.REJECTED]: [ApplicationStatus.SENT], 
  [ApplicationStatus.WITHDRAWN]: [ApplicationStatus.SENT],
  [ApplicationStatus.GHOSTED]: [ApplicationStatus.INTERVIEWING, ApplicationStatus.REJECTED]
};
