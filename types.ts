
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

export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME type
  size: number; // Bytes
  data: string; // Base64 Data URI
  uploadedAt: number;
}

export interface Reminder {
  id: string;
  userId: string;
  recordId: string; // Link to TrackingRecord
  title: string;
  dueAt: number; // Timestamp
  status: 'PENDING' | 'FIRED' | 'DISMISSED' | 'SNOOZED';
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  linkToId?: string; // Optional deep link to a record
}

export interface TrackingRecord {
  id: string;
  userId: string;
  contactId?: string; // Link to first-class Contact entity
  reminderId?: string; // Link to scheduled reminder
  
  // Canonical fields
  dateSent: string; 
  name: string;
  emailAddress: string;
  company: string;
  roleTitle: string;
  linkedInOrSource?: string; // Used for Job URL (Direct) or Profile URL (Network)
  emailType: EmailType;
  
  // Extended Metadata (Production Hardening)
  location?: string;
  jobId?: string;
  applicationSource?: string; // e.g. "LinkedIn Jobs", "Company Site"
  resumeVersion?: string;
  coverLetterUsed?: boolean;
  
  // Outreach Specifics
  outreachChannel?: string; // e.g. "Email", "LinkedIn DM"
  subjectLineUsed: string;
  personalizationNotes?: string;
  valuePitchSummary: string;
  
  // Network/Recruiter Specifics
  referralRelationship?: string;
  recruiterType?: string; // "Agency" | "Internal"
  screeningDate?: string;

  // Outcome Tracking
  replyReceived: boolean;
  replyDate?: string;
  responseSummary?: string;
  status: ApplicationStatus;
  
  // Follow Up System
  nextFollowUpDate?: string;
  followUpSent: boolean;
  resultAfterFollowUp?: string;
  
  notes?: string;
  attachments: Attachment[];
  
  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionLog {
  id: string;
  userId: string;
  action: string;
  entityId: string;
  entityType: 'RECORD' | 'AUTH' | 'SYSTEM' | 'TEMPLATE' | 'CONTACT' | 'REMINDER' | 'NOTIFICATION';
  status: 'SUCCESS' | 'FAILURE' | 'INFO';
  message: string;
  executedAt: number;
}
