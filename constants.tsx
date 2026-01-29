
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
// Using semi-transparent backgrounds with borders for clarity and contrast
export const STATUS_STYLES: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  [ApplicationStatus.SENT]: 'bg-primary-500/10 text-primary-300 border border-primary-500/20',
  [ApplicationStatus.INTERVIEWING]: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
  [ApplicationStatus.OFFER]: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  [ApplicationStatus.REJECTED]: 'bg-red-500/10 text-red-300 border border-red-500/20',
  [ApplicationStatus.WITHDRAWN]: 'bg-orange-500/10 text-orange-300 border border-orange-500/20',
  [ApplicationStatus.GHOSTED]: 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30',
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
