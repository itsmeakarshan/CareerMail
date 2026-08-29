import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Video, MapPin, Clock, X } from 'lucide-react';
import { interviewsApi } from '../services/api';
import { Interview } from '../types';
import { CompanyLogo } from '../components/common/CompanyLogo';

export const InterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form state
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('Software Engineer');
  const [dateTime, setDateTime] = useState('');
  const [type, setType] = useState('Technical Interview');
  const [interviewer, setInterviewer] = useState('');
  const [location] = useState('Google Meet');
  const [meetingLink, setMeetingLink] = useState('');
  const [prepNotes, setPrepNotes] = useState('');

  const fetchData = async () => {
    try {
      const intRes = await interviewsApi.getAll();
      setInterviews(intRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !title.trim() || !dateTime) return;

    try {
      await interviewsApi.create({
        company,
        title,
        interviewDate: dateTime,
        type,
        interviewer,
        location,
        meetingLink,
        preparationNotes: prepNotes,
        status: 'SCHEDULED',
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Error scheduling interview: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this interview?')) {
      await interviewsApi.delete(id);
      fetchData();
    }
  };

  const nextInterview = interviews.length > 0 ? interviews[0] : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1f1f1f] dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            <span>Interview Schedule</span>
          </h1>
          <p className="text-xs md:text-sm text-[#5f6368] dark:text-slate-400 mt-0.5">
            Prepare, track countdowns, and join your upcoming technical & behavioral rounds
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Interview</span>
        </button>
      </div>

      {/* Featured Next Interview Hero Banner */}
      {nextInterview && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-white dark:from-pink-950/70 dark:via-rose-950/60 dark:to-[#16181f] border border-pink-200 dark:border-pink-800/40 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <CompanyLogo company={nextInterview.company} size="lg" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-500 text-white shadow-sm">
                  NEXT UP
                </span>
                <span className="text-xs text-pink-700 dark:text-pink-300 font-semibold">
                  {nextInterview.daysAwayBadge || 'Soon'}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[#1f1f1f] dark:text-white mt-1">
                {nextInterview.company} — {nextInterview.title}
              </h2>
              <p className="text-xs text-[#5f6368] dark:text-slate-300 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
                  {nextInterview.interviewDate.replace('T', ' · ')}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                  {nextInterview.location}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {nextInterview.meetingLink && (
              <a
                href={nextInterview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
              >
                <Video className="w-4 h-4" />
                <span>Join Meeting</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Full Interview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interviews.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-400 transition-all flex flex-col justify-between shadow-sm group"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CompanyLogo company={item.company} size="md" />
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-[#1f1f1f] dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
                      {item.company}
                    </h4>
                    <span className="text-xs text-[#5f6368] dark:text-slate-400 font-medium">{item.title}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 text-[11px] font-semibold">
                  {item.daysAwayBadge || 'Scheduled'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e0e2e7] dark:border-[#282a2d] space-y-2 text-xs text-[#444746] dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
                  <span>{item.interviewDate.replace('T', ' · ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#5f6368] dark:text-slate-500">Format:</span>
                  <span className="font-semibold text-[#1f1f1f] dark:text-slate-200">{item.type}</span>
                </div>
                {item.interviewer && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#5f6368] dark:text-slate-500">Interviewer:</span>
                    <span>{item.interviewer}</span>
                  </div>
                )}
                {item.preparationNotes && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] text-[11px] text-[#5f6368] dark:text-slate-400 border border-[#e0e2e7] dark:border-[#282a2d]">
                    {item.preparationNotes}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between">
              {item.meetingLink ? (
                <a
                  href={item.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Video Call</span>
                </a>
              ) : (
                <span className="text-xs text-[#5f6368] dark:text-slate-500">Link provided via email</span>
              )}
              <button
                onClick={() => handleDelete(item.id)}
                className="text-[11px] text-[#5f6368] dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state when no interviews */}
      {interviews.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] space-y-3 animate-fadeIn shadow-sm">
          <Calendar className="w-10 h-10 text-pink-500 dark:text-pink-400 mx-auto opacity-60" />
          <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white">No upcoming interviews found</h3>
          <p className="text-xs text-[#5f6368] dark:text-slate-400 max-w-sm mx-auto">
            Connect your Gmail account and sync emails to automatically detect scheduled interviews, or click &quot;Schedule Interview&quot; to add one manually.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Interview</span>
          </button>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d]">
              <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white">Schedule an Interview</h3>
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
                    placeholder="e.g. Google"
                    className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Role *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                  >
                    <option value="Screening Call">Screening Call</option>
                    <option value="Technical Interview">Technical Interview</option>
                    <option value="System Design">System Design</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Hiring Manager">Hiring Manager</option>
                    <option value="Final Round">Final Round</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Interviewer Name / Title</label>
                <input
                  type="text"
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  placeholder="e.g. Sarah Jenkins (Engineering Director)"
                  className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Video Meeting URL</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/xyz or Zoom link"
                  className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Preparation Notes</label>
                <textarea
                  rows={2}
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Key talking points, STAR examples, questions to ask..."
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
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
