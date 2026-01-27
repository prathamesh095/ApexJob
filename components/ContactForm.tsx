
import React, { useState } from 'react';
import { Contact } from '../types';
import { Button, Input, Label } from './Shared';

interface Props {
  initialData?: Partial<Contact>;
  onSave: (data: Partial<Contact>) => void;
  onCancel: () => void;
}

export const ContactForm: React.FC<Props> = ({ initialData = {}, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    email: '',
    company: '',
    linkedInOrSource: '',
    notes: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name?.trim()) newErrors.name = "Full name is mandatory";
    if (!formData.email?.trim()) {
      newErrors.email = "Email is mandatory";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.company?.trim()) newErrors.company = "Company identifier required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const handleChange = (field: keyof Contact, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  return (
    <form className="space-y-6 animate-in fade-in duration-300" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label required>Full Name</Label>
          <Input 
            required 
            value={formData.name} 
            onChange={e => handleChange('name', e.target.value)} 
            placeholder="Operational Name" 
            error={errors.name}
          />
        </div>
        <div>
          <Label required>Primary Email</Label>
          <Input 
            required 
            type="email" 
            value={formData.email} 
            onChange={e => handleChange('email', e.target.value)} 
            placeholder="operator@entity.net" 
            error={errors.email}
          />
        </div>
      </div>
      <div>
        <Label required>Current Organization</Label>
        <Input 
          required 
          value={formData.company} 
          onChange={e => handleChange('company', e.target.value)} 
          placeholder="Organization Handle" 
          error={errors.company}
        />
      </div>
      <div>
        <Label>Professional Link (LinkedIn/Personal)</Label>
        <Input 
          value={formData.linkedInOrSource} 
          onChange={e => handleChange('linkedInOrSource', e.target.value)} 
          placeholder="https://linkedin.com/in/..." 
        />
      </div>
      <div>
        <Label>Internal Relationship Meta-Notes</Label>
        <textarea 
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32 transition-all font-medium"
          value={formData.notes} 
          onChange={e => handleChange('notes', e.target.value)}
          placeholder="Context: Networking event 04/24, strong focus on Rust/TS..."
        />
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>Abort</Button>
        <Button type="submit" size="lg" className="px-8 shadow-md">Commit Contact Node</Button>
      </div>
    </form>
  );
};
