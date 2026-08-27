import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Video, MapPin, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { interviewsApi, applicationsApi } from '../services/api';
import { Interview, JobApplication } from '../types';
import { CompanyLogo } from '../components/common/CompanyLogo';

export const InterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form state
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('Software Engineer');
  const [dateTime, setDateTime] = useState('');
  const [type, setType] = useState('Technical Interview');
  const [interviewer, setInterviewer] = useState('');
  const [location, setLocation] = useState('Google Meet');
  const [meetingLink, setMeetingLink] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [jobAppId, setJobAppId] = useState<number | undefined>();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [intRes, appsRes] = await Promise.all([
        interviewsApi.getAll(),
        applicationsApi.getAll(),
      ]);
      setInterviews(intRes);
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
        jobApplicationId: jobAppId,
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
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            <span>Interview Schedule</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Prepare, track countdowns, and join your upcoming technical & behavioral rounds
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-glow-purple transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Interview</span>
        </button>
      </div>

      {/* Featured Next Interview Hero Banner */}
      {nextInterview && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-[#101626] border border-purple-800/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <CompanyLogo company={nextInterview.company} size="lg" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">
                  NEXT UP
                </span>
                <span className="text-xs text-purple-300 font-semibold">
                  {nextInterview.daysAwayBadge || 'Soon'}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                {nextInterview.company} — {nextInterview.title}
              </h2>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  {nextInterview.interviewDate.replace('T', ' · ')}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
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
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-glow-purple transition-all"
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
            className="p-5 rounded-2xl bg-[#101626] border border-[#1e2640] hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-sm group"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CompanyLogo company={item.company} size="md" />
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {item.company}
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">{item.title}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-800/40 text-purple-300 text-[11px] font-semibold">
                  {item.daysAwayBadge || 'Scheduled'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>{item.interviewDate.replace('T', ' · ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Format:</span>
                  <span className="font-semibold text-slate-200">{item.type}</span>
                </div>
                {item.interviewer && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Interviewer:</span>
                    <span>{item.interviewer}</span>
                  </div>
                )}
                {item.preparationNotes && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#141b2d] text-[11px] text-slate-400 border border-slate-800">
                    {item.preparationNotes}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              {item.meetingLink ? (
                <a
                  href={item.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Video Call</span>
                </a>
              ) : (
                <span className="text-xs text-slate-500">Link provided via email</span>
              )}
              <button
                onClick={() => handleDelete(item.id)}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Interview Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12182b] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Schedule an Interview</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full px-3 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Role *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Round / Type</label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="Technical Interview"
                    className="w-full px-3 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Interviewer</label>
                <input
                  type="text"
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  placeholder="e.g. Emily Watson (Staff SWE)"
                  className="w-full px-3 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Preparation Notes</label>
                <textarea
                  rows={2}
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="System design topics, behavioral examples..."
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
                  Save Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
