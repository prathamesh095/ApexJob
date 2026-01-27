
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
  [ApplicationStatus.DRAFT]: 'bg-slate-100 text-slate-700 border-slate-200',
  // Fix: Changed non-existent APPLIED to SENT
  [ApplicationStatus.SENT]: 'bg-blue-50 text-blue-700 border-blue-200',
  [ApplicationStatus.INTERVIEWING]: 'bg-purple-50 text-purple-700 border-purple-200',
  [ApplicationStatus.OFFER]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ApplicationStatus.REJECTED]: 'bg-rose-50 text-rose-700 border-rose-200',
  [ApplicationStatus.WITHDRAWN]: 'bg-amber-50 text-amber-700 border-amber-200',
  [ApplicationStatus.GHOSTED]: 'bg-gray-100 text-gray-500 border-gray-200',
};

export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  // Fix: Changed non-existent APPLIED to SENT in transitions
  [ApplicationStatus.DRAFT]: [ApplicationStatus.SENT, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.SENT]: [ApplicationStatus.INTERVIEWING, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN, ApplicationStatus.GHOSTED],
  [ApplicationStatus.INTERVIEWING]: [ApplicationStatus.OFFER, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN, ApplicationStatus.GHOSTED],
  [ApplicationStatus.OFFER]: [ApplicationStatus.SENT, ApplicationStatus.WITHDRAWN], // In case of multi-offer handling
  [ApplicationStatus.REJECTED]: [ApplicationStatus.SENT], // In case of re-application
  [ApplicationStatus.WITHDRAWN]: [ApplicationStatus.SENT],
  [ApplicationStatus.GHOSTED]: [ApplicationStatus.INTERVIEWING, ApplicationStatus.REJECTED]
};
