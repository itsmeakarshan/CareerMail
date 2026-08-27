import React, { useState, useEffect } from 'react';
import { Bell, Plus, Clock, CheckCircle2, Mail, Trash2, X, Send } from 'lucide-react';
import { followUpsApi, applicationsApi } from '../services/api';
import { FollowUp, JobApplication } from '../types';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { ComposeEmailModal } from '../components/email/ComposeEmailModal';

export const FollowUpsPage: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);

  // Form state
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fRes, appsRes] = await Promise.all([
        followUpsApi.getAll(),
        applicationsApi.getAll(),
      ]);
      setFollowUps(fRes);
      setApplications(appsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !dueDate) return;

    try {
      await followUpsApi.create({
        company,
        role,
        dueDate,
        notes,
        status: 'PENDING',
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleComplete = async (id: number) => {
    await followUpsApi.update(id, { status: 'COMPLETED' });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this follow-up?')) {
      await followUpsApi.delete(id);
      fetchData();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>Follow-Up Reminders</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Never let an application slip through the cracks with automated nudges
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-glow-purple transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Follow-Up</span>
        </button>
      </div>

      {/* Follow-Ups List */}
      <div className="space-y-3">
        {followUps.map((item) => {
          const isOverdue = item.daysDueBadge?.includes('Overdue');
          const isToday = item.daysDueBadge?.includes('1 day') || item.daysDueBadge?.includes('today');

          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[#101626] border border-[#1e2640] hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <CompanyLogo company={item.company} size="md" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{item.company}</h4>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        isOverdue
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                          : isToday
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.daysDueBadge || 'Pending'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {item.role || 'Job Application'} · {item.appliedSubtitle || 'Applied recently'}
                  </span>
                  {item.notes && (
                    <p className="text-[11px] text-slate-500 mt-1 max-w-lg">{item.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Follow-Up</span>
                </button>
                <button
                  onClick={() => handleComplete(item.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/20 transition-colors"
                  title="Mark Completed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {followUps.length === 0 && !loading && (
          <div className="p-12 text-center text-xs text-slate-500">
            No follow-ups pending. Great job staying on top of your job search!
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12182b] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add Follow-Up</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company *</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Capital One"
                  className="w-full px-3 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ask for feedback or check on recruiter timeline..."
                  className="w-full px-3 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-glow-purple"
                >
                  Save Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />
    </div>
  );
};
