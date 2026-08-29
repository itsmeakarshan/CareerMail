import React, { useState, useEffect } from 'react';
import { Bell, Plus, CheckCircle2, Trash2, X, Send } from 'lucide-react';
import { followUpsApi } from '../services/api';
import { FollowUp } from '../types';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { ComposeEmailModal } from '../components/email/ComposeEmailModal';

export const FollowUpsPage: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
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
      const fRes = await followUpsApi.getAll();
      setFollowUps(fRes);
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
          <h1 className="text-xl md:text-2xl font-bold text-[#1f1f1f] dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            <span>Follow-Up Reminders</span>
          </h1>
          <p className="text-xs md:text-sm text-[#5f6368] dark:text-slate-400 mt-0.5">
            Never let an application slip through the cracks with automated nudges
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
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
              className="p-4 rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-400 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4 min-w-0">
                <CompanyLogo company={item.company} size="md" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#1f1f1f] dark:text-white truncate">{item.company}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isOverdue
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : isToday
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {item.daysDueBadge || `Due: ${item.dueDate}`}
                    </span>
                  </div>
                  <span className="text-xs text-[#5f6368] dark:text-slate-400 mt-0.5">{item.role}</span>
                  {item.notes && <p className="text-xs text-[#444746] dark:text-slate-300 mt-1">{item.notes}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-pink-100 dark:bg-pink-950/70 border border-pink-200 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Follow-Up</span>
                </button>
                <button
                  onClick={() => handleComplete(item.id)}
                  className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                  title="Mark Completed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {followUps.length === 0 && !loading && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] space-y-3 shadow-sm">
            <Bell className="w-10 h-10 text-amber-500 mx-auto opacity-60" />
            <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white">All caught up!</h3>
            <p className="text-xs text-[#5f6368] dark:text-slate-400 max-w-sm mx-auto">
              You don&apos;t have any pending follow-up emails due right now.
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d]">
              <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white">Add Follow-Up Reminder</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-black dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Stripe"
                    className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Follow-Up Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Notes / Context</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Check in with recruiter regarding technical assessment submission"
                  className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e0e2e7] dark:border-[#282a2d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white transition-all shadow-sm"
                >
                  Save Reminder
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
