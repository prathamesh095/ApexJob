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

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'bg-slate-100 text-slate-600 border-slate-200',
  [ApplicationStatus.SENT]: 'bg-primary-50 text-primary-700 border-primary-200',
  [ApplicationStatus.INTERVIEWING]: 'bg-accent-50 text-accent-700 border-accent-200',
  [ApplicationStatus.OFFER]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ApplicationStatus.REJECTED]: 'bg-rose-50 text-rose-700 border-rose-200',
  [ApplicationStatus.WITHDRAWN]: 'bg-orange-50 text-orange-700 border-orange-200',
  [ApplicationStatus.GHOSTED]: 'bg-slate-100 text-slate-400 border-slate-200',
};

export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.DRAFT]: [ApplicationStatus.SENT, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.SENT]: [ApplicationStatus.INTERVIEWING, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN, ApplicationStatus.GHOSTED],
  [ApplicationStatus.INTERVIEWING]: [ApplicationStatus.OFFER, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN, ApplicationStatus.GHOSTED],
  [ApplicationStatus.OFFER]: [ApplicationStatus.SENT, ApplicationStatus.WITHDRAWN], 
  [ApplicationStatus.REJECTED]: [ApplicationStatus.SENT], 
  [ApplicationStatus.WITHDRAWN]: [ApplicationStatus.SENT],
  [ApplicationStatus.GHOSTED]: [ApplicationStatus.INTERVIEWING, ApplicationStatus.REJECTED]
};