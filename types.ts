
export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  INTERVIEWING = 'INTERVIEWING',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  GHOSTED = 'GHOSTED'
}

export enum EmailType {
  COLD = 'COLD',
  REFERRAL = 'REFERRAL',
  FOLLOW_UP = 'FOLLOW_UP',
  RECRUITER = 'RECRUITER',
  DIRECT_APPLICATION = 'DIRECT_APPLICATION'
}

export interface User {
  id: string;
  email: string;
  name: string;
  token: string;
  role: 'USER' | 'ADMIN';
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string;
  company: string;
  linkedInOrSource?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface OutreachTemplate {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: EmailType;
}

export interface TrackingRecord {
  id: string;
  userId: string;
  contactId?: string; // Link to first-class Contact entity
  // Canonical fields
  dateSent: string; 
  name: string;
  emailAddress: string;
  company: string;
  roleTitle: string;
  linkedInOrSource?: string;
  emailType: EmailType;
  subjectLineUsed: string;
  personalizationNotes?: string;
  valuePitchSummary: string;
  replyReceived: boolean;
  replyDate?: string;
  responseSummary?: string;
  status: ApplicationStatus;
  nextFollowUpDate?: string;
  followUpSent: boolean;
  resultAfterFollowUp?: string;
  notes?: string;
  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionLog {
  id: string;
  userId: string;
  action: string;
  entityId: string;
  entityType: 'RECORD' | 'AUTH' | 'SYSTEM' | 'TEMPLATE' | 'CONTACT';
  status: 'SUCCESS' | 'FAILURE' | 'INFO';
  message: string;
  executedAt: number;
}
