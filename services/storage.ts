
import { 
  TrackingRecord, 
  ExecutionLog,
  ApplicationStatus,
  User,
  OutreachTemplate,
  EmailType,
  Contact
} from '../types';
import { auth } from './auth';

const STORAGE_KEYS = {
  RECORDS: 'apex_records_v3',
  LOGS: 'apex_logs_v3',
  TEMPLATES: 'apex_templates_v3',
  CONTACTS: 'apex_contacts_v3',
  DRAFTS: 'apex_form_drafts_v3'
};

// Robust ID generation fallback
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

class StorageService {
  private get<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      if (!data) return [];
      const parsed = JSON.parse(data);
      // Ensure we always return an array to prevent .filter crashes
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(`CRITICAL: Failed to parse storage key ${key}`, e);
      return [];
    }
  }

  private set<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Storage Quota Exceeded or Write Error", e);
      throw new Error(`STORAGE_FULL: Unable to commit data to local persistence. Clear some space.`);
    }
  }

  // --- DRAFTS / AUTO-SAVE (User Scoped) ---
  saveDraft(key: string, data: any): void {
    try {
      const user = auth.getCurrentUser();
      if (!user) return; // Silent fail for unauth drafts
      
      const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFTS) || '{}');
      const scopedKey = `${user.id}:${key}`;
      
      drafts[scopedKey] = { data, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    } catch (e) {
      console.warn("Failed to save draft", e);
    }
  }

  getDraft(key: string): any | null {
    try {
      const user = auth.getCurrentUser();
      if (!user) return null;

      const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFTS) || '{}');
      const scopedKey = `${user.id}:${key}`;
      
      return drafts[scopedKey] ? drafts[scopedKey].data : null;
    } catch {
      return null;
    }
  }

  clearDraft(key: string): void {
    try {
      const user = auth.getCurrentUser();
      if (!user) return;

      const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFTS) || '{}');
      const scopedKey = `${user.id}:${key}`;
      
      delete drafts[scopedKey];
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    } catch (e) {
      console.warn("Failed to clear draft", e);
    }
  }

  // --- LOGGING ---
  log(action: string, entityId: string, entityType: ExecutionLog['entityType'], message: string, status: ExecutionLog['status'] = 'SUCCESS') {
    const user = auth.getCurrentUser();
    if (!user) return;

    try {
      const logs = this.get<ExecutionLog>(STORAGE_KEYS.LOGS);
      const newLog: ExecutionLog = {
        id: generateId(),
        userId: user.id,
        action,
        entityId,
        entityType,
        status,
        message,
        executedAt: Date.now()
      };
      this.set(STORAGE_KEYS.LOGS, [newLog, ...logs].slice(0, 1000));
    } catch (e) {
      console.error("Logging failed", e);
    }
  }

  // --- RECORDS ---
  getRecords(): TrackingRecord[] {
    const user = auth.getCurrentUser();
    if (!user) return [];
    return this.get<TrackingRecord>(STORAGE_KEYS.RECORDS).filter(r => r.userId === user.id);
  }

  saveRecord(record: Partial<TrackingRecord>): TrackingRecord {
    const user = auth.getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED: Session invalid or expired.");

    const records = this.get<TrackingRecord>(STORAGE_KEYS.RECORDS);
    const now = Date.now();

    if (record.id) {
      const index = records.findIndex(r => r.id === record.id && r.userId === user.id);
      if (index === -1) throw new Error("NOT_FOUND: Target record inaccessible.");
      
      const updated = { 
        ...records[index], 
        ...record, 
        attachments: record.attachments || records[index].attachments || [],
        updatedAt: now 
      } as TrackingRecord;
      
      records[index] = updated;
      this.set(STORAGE_KEYS.RECORDS, records);
      this.log('UPDATE', updated.id, 'RECORD', `Record updated for ${updated.roleTitle} at ${updated.company}`);
      return updated;
    } else {
      const newRecord: TrackingRecord = {
        ...record,
        id: generateId(),
        userId: user.id,
        dateSent: record.dateSent || new Date().toISOString().split('T')[0],
        name: record.name || 'Unknown',
        emailAddress: record.emailAddress || '',
        company: record.company || 'Unknown',
        roleTitle: record.roleTitle || 'Unknown Role',
        emailType: record.emailType || EmailType.COLD,
        subjectLineUsed: record.subjectLineUsed || '',
        valuePitchSummary: record.valuePitchSummary || '',
        replyReceived: record.replyReceived || false,
        status: record.status || ApplicationStatus.SENT,
        followUpSent: record.followUpSent || false,
        attachments: record.attachments || [],
        createdAt: now,
        updatedAt: now,
      } as TrackingRecord;

      this.set(STORAGE_KEYS.RECORDS, [newRecord, ...records]);
      this.log('CREATE', newRecord.id, 'RECORD', `New tracking record for ${newRecord.company}`);
      return newRecord;
    }
  }

  // NEW: Batch Import for CSV
  saveRecordsBatch(recordsToImport: Partial<TrackingRecord>[]): void {
    const user = auth.getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED: Session invalid or expired.");

    const existingRecords = this.get<TrackingRecord>(STORAGE_KEYS.RECORDS);
    const now = Date.now();

    const newRecords = recordsToImport.map(rec => ({
      ...rec,
      id: generateId(),
      userId: user.id,
      dateSent: rec.dateSent || new Date().toISOString().split('T')[0],
      name: rec.name || 'Unknown',
      emailAddress: rec.emailAddress || '',
      company: rec.company || 'Unknown',
      roleTitle: rec.roleTitle || 'Imported Role',
      emailType: EmailType.COLD,
      subjectLineUsed: 'Imported via CSV',
      valuePitchSummary: 'Imported',
      replyReceived: false,
      status: (rec.status as ApplicationStatus) || ApplicationStatus.SENT,
      followUpSent: false,
      attachments: [],
      createdAt: now,
      updatedAt: now,
    } as TrackingRecord));

    this.set(STORAGE_KEYS.RECORDS, [...newRecords, ...existingRecords]);
    this.log('BATCH_IMPORT', 'CSV', 'SYSTEM', `Batch imported ${newRecords.length} records.`);
  }

  deleteRecord(id: string): void {
    const user = auth.getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED: Authentication required for deletion.");
    
    const records = this.get<TrackingRecord>(STORAGE_KEYS.RECORDS);
    
    // Strict deletion: Only delete if ID matches AND UserID matches.
    const filtered = records.filter(r => !(r.id === id && r.userId === user.id));
    
    if (filtered.length === records.length) {
      this.log('DELETE_FAIL', id, 'RECORD', `Failed attempt to delete record ${id}`, 'FAILURE');
      throw new Error("DELETE_FAILURE: Record not found or access denied.");
    }

    this.set(STORAGE_KEYS.RECORDS, filtered);
    this.log('DELETE', id, 'RECORD', `Record purged from registry: ${id}`);
  }

  // --- CONTACTS ---
  getContacts(): Contact[] {
    const user = auth.getCurrentUser();
    if (!user) return [];
    return this.get<Contact>(STORAGE_KEYS.CONTACTS).filter(c => c.userId === user.id);
  }

  saveContact(contact: Partial<Contact>): Contact {
    const user = auth.getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED: Session invalid or expired.");
    const contacts = this.get<Contact>(STORAGE_KEYS.CONTACTS);
    const now = Date.now();

    if (contact.id) {
      const index = contacts.findIndex(c => c.id === contact.id && c.userId === user.id);
      if (index === -1) throw new Error("NOT_FOUND: Contact inaccessible.");
      const updated = { ...contacts[index], ...contact, updatedAt: now } as Contact;
      contacts[index] = updated;
      this.set(STORAGE_KEYS.CONTACTS, contacts);
      this.log('UPDATE', updated.id, 'CONTACT', `Contact ${updated.name} updated.`);
      return updated;
    } else {
      const newC: Contact = {
        ...contact,
        id: generateId(),
        userId: user.id,
        name: contact.name!,
        email: contact.email!,
        company: contact.company!,
        linkedInOrSource: contact.linkedInOrSource,
        notes: contact.notes,
        createdAt: now,
        updatedAt: now
      } as Contact;
      this.set(STORAGE_KEYS.CONTACTS, [newC, ...contacts]);
      this.log('CREATE', newC.id, 'CONTACT', `New contact ${newC.name} added.`);
      return newC;
    }
  }

  // Batch Import for Contacts
  saveContactsBatch(contactsToImport: Partial<Contact>[]): void {
    const user = auth.getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED: Session invalid or expired.");

    const existingContacts = this.get<Contact>(STORAGE_KEYS.CONTACTS);
    const now = Date.now();

    const newContacts = contactsToImport.map(c => ({
      ...c,
      id: generateId(),
      userId: user.id,
      name: c.name || 'Imported Contact',
      email: c.email || '',
      company: c.company || 'Unknown',
      linkedInOrSource: c.linkedInOrSource || '',
      notes: c.notes || 'Imported via CSV',
      createdAt: now,
      updatedAt: now
    } as Contact));

    this.set(STORAGE_KEYS.CONTACTS, [...newContacts, ...existingContacts]);
    this.log('BATCH_IMPORT', 'CSV', 'CONTACT', `Batch imported ${newContacts.length} contacts.`);
  }

  deleteContact(id: string): void {
    const user = auth.getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED: Authentication required for deletion.");
    const contacts = this.get<Contact>(STORAGE_KEYS.CONTACTS);
    
    const filtered = contacts.filter(c => !(c.id === id && c.userId === user.id));
    
    if (filtered.length === contacts.length) {
       throw new Error("DELETE_FAILURE: Contact not found or access denied.");
    }

    this.set(STORAGE_KEYS.CONTACTS, filtered);
    this.log('DELETE', id, 'CONTACT', `Contact purged from registry: ${id}`);
  }

  // --- TEMPLATES ---
  getTemplates(): OutreachTemplate[] {
    const user = auth.getCurrentUser();
    if (!user) return [];
    return this.get<OutreachTemplate>(STORAGE_KEYS.TEMPLATES).filter(t => t.userId === user.id);
  }

  saveTemplate(template: Partial<OutreachTemplate>): OutreachTemplate {
    const user = auth.getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED: Session invalid or expired.");
    const templates = this.get<OutreachTemplate>(STORAGE_KEYS.TEMPLATES);
    if (template.id) {
      const index = templates.findIndex(t => t.id === template.id && t.userId === user.id);
      if (index === -1) throw new Error("NOT_FOUND");
      const updated = { ...templates[index], ...template } as OutreachTemplate;
      templates[index] = updated;
      this.set(STORAGE_KEYS.TEMPLATES, templates);
      this.log('UPDATE', updated.id, 'TEMPLATE', `Template "${updated.title}" modified.`);
      return updated;
    } else {
      const newT: OutreachTemplate = {
        id: generateId(),
        userId: user.id,
        title: template.title || 'Untitled Draft',
        content: template.content || '',
        category: template.category || EmailType.COLD
      };
      this.set(STORAGE_KEYS.TEMPLATES, [newT, ...templates]);
      this.log('CREATE', newT.id, 'TEMPLATE', `New template "${newT.title}" created.`);
      return newT;
    }
  }

  deleteTemplate(id: string): void {
    const user = auth.getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED: Authentication required for deletion.");
    const templates = this.get<OutreachTemplate>(STORAGE_KEYS.TEMPLATES);
    const filtered = templates.filter(t => t.id !== id);
    this.set(STORAGE_KEYS.TEMPLATES, filtered);
    this.log('DELETE', id, 'TEMPLATE', `Template purged: ${id}`);
  }

  getLogs(): ExecutionLog[] {
    const user = auth.getCurrentUser();
    if (!user) return [];
    return this.get<ExecutionLog>(STORAGE_KEYS.LOGS).filter(l => l.userId === user.id);
  }
}

export const storage = new StorageService();
