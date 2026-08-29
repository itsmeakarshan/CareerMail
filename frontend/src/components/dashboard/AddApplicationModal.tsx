import React, { useState, useEffect } from 'react';
import { X, Plus, Building2, Briefcase, MapPin, DollarSign, Mail, UserCheck } from 'lucide-react';
import { ApplicationStatus, Priority, JobApplication } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialStatus?: ApplicationStatus;
  editData?: JobApplication | null;
}

export const AddApplicationModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStatus = 'APPLIED',
  editData = null,
}) => {
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setCompany(editData.company || '');
      setTitle(editData.title || '');
      setLocation(editData.location || '');
      setSalary(editData.salary || '');
      setStatus(editData.status || 'APPLIED');
      setPriority(editData.priority || 'MEDIUM');
      setNotes(editData.notes || '');
      setRecruiterName(editData.recruiterName || '');
      setRecruiterEmail(editData.recruiterEmail || '');
    } else {
      setCompany('');
      setTitle('');
      setLocation('');
      setSalary('');
      setStatus(initialStatus);
      setPriority('MEDIUM');
      setNotes('');
      setRecruiterName('');
      setRecruiterEmail('');
    }
  }, [editData, initialStatus, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !title.trim()) return;

    setLoading(true);
    try {
      await onSave({
        company,
        title,
        location,
        salary,
        status,
        priority,
        notes,
        recruiterName,
        recruiterEmail,
        dateApplied: editData?.dateApplied || new Date().toISOString().split('T')[0],
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#f6f8fc] dark:bg-[#111318] border-b border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white tracking-tight">
              {editData ? 'Edit Application' : 'New Job Application'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282a2d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-300 mb-1">
                Company Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Microsoft"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-300 mb-1">
                Job Title *
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-300 mb-1">Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. New York, NY / Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-300 mb-1">Salary</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. $140k - $160k"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
              >
                <option value="APPLIED">Applied</option>
                <option value="ASSESSMENT">Assessment</option>
                <option value="RECRUITER_SCREEN">Recruiter Screen</option>
                <option value="INTERVIEW">Interview</option>
                <option value="FINAL_INTERVIEW">Final Interview</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-300 mb-1">
                Recruiter Name
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-300 mb-1">
                Recruiter Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="recruiter@company.com"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-300 mb-1">Notes</label>
            <textarea
              rows={3}
              placeholder="Application notes, links, interview details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e0e2e7] dark:border-[#282a2d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282a2d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white text-sm font-bold shadow-md disabled:opacity-50 transition-all"
            >
              {loading ? 'Saving...' : editData ? 'Update Application' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
