import React, { useState } from 'react';
import {
  X,
  Trash2,
  Edit3,
  MapPin,
  DollarSign,
  User,
  Mail,
  Calendar,
  Clock,
  Briefcase,
  Video,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { JobApplication, ApplicationStatus } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';

interface DrawerProps {
  application: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: number) => Promise<void>;
  onStatusChange: (id: number, status: ApplicationStatus) => Promise<void>;
}

export const ApplicationDetailDrawer: React.FC<DrawerProps> = ({
  application,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'interviews'>('details');

  if (!isOpen || !application) return null;

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the application for ${application.company}?`)) {
      setDeleting(true);
      try {
        await onDelete(application.id);
        onClose();
      } finally {
        setDeleting(false);
      }
    }
  };

  const statusOptions: ApplicationStatus[] = [
    'APPLIED',
    'ASSESSMENT',
    'RECRUITER_SCREEN',
    'INTERVIEW',
    'FINAL_INTERVIEW',
    'OFFER',
    'REJECTED',
    'WITHDRAWN',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-[#12182b] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slideLeft">
        {/* Header */}
        <div className="p-6 bg-[#161e36] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <CompanyLogo company={application.company} size="lg" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{application.company}</h3>
                {application.source && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                    {application.source}
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-400 font-medium">{application.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(application)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 px-6 bg-[#101524]">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Timeline</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
              {application.timelineEvents?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'interviews'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Interviews & Tasks</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
              {(application.interviews?.length || 0) + (application.followUps?.length || 0)}
            </span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Stage</label>
                <select
                  value={application.status}
                  onChange={(e) => onStatusChange(application.id, e.target.value as ApplicationStatus)}
                  className="w-full px-3.5 py-2.5 bg-[#0c101d] border border-indigo-900/60 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-purple-500"
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0e1322] border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-400">Location</span>
                    <span className="text-xs font-medium text-white truncate">
                      {application.location || 'Remote'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0e1322] border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-400">Compensation</span>
                    <span className="text-xs font-medium text-white truncate">
                      {application.salary || 'Competitive'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0e1322] border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-400">Date Applied</span>
                    <span className="text-xs font-medium text-white truncate">
                      {application.dateApplied}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0e1322] border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-400">Priority</span>
                    <span className="text-xs font-medium text-white truncate">
                      {application.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Work Type & Subtitle */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0e1322] border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-400">Employment Type</span>
                    <span className="text-xs font-medium text-white truncate">
                      {application.employmentType || 'Full-time'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0e1322] border border-slate-800/80 rounded-xl flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-400">Latest Activity</span>
                    <span className="text-xs font-medium text-white truncate">
                      {application.activitySubtitle || 'Applied recently'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recruiter Details */}
              {(application.recruiterName || application.recruiterEmail) && (
                <div className="p-4 bg-[#0e1322] border border-slate-800/80 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Recruiter Contact</span>
                  {application.recruiterName && (
                    <div className="flex items-center gap-2 text-xs text-slate-200">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{application.recruiterName}</span>
                    </div>
                  )}
                  {application.recruiterEmail && (
                    <div className="flex items-center gap-2 text-xs text-purple-400">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${application.recruiterEmail}`} className="hover:underline">
                        {application.recruiterEmail}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {application.notes && (
                <div>
                  <span className="block text-xs font-semibold text-slate-400 mb-1">Notes</span>
                  <div className="p-3.5 bg-[#0e1322] border border-slate-800/80 rounded-xl text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {application.notes}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'timeline' && (
            <div>
              <span className="block text-xs font-semibold text-slate-400 mb-3">Chronological History</span>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {application.timelineEvents && application.timelineEvents.length > 0 ? (
                  application.timelineEvents.map((evt, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-violet-600 border-2 border-[#12182b] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <div className="flex flex-col bg-[#0e1322] p-3 rounded-xl border border-slate-800/60">
                        <span className="text-xs font-bold text-white">{evt.title}</span>
                        <span className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {evt.description}
                        </span>
                        <span className="text-[10px] text-purple-400 mt-1.5 font-mono">
                          {evt.eventDate ? evt.eventDate.replace('T', ' ').substring(0, 16) : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 p-4 text-center">No timeline events recorded yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="space-y-4">
              {/* Linked Interviews */}
              <div>
                <span className="block text-xs font-semibold text-slate-400 mb-2">Interviews</span>
                {application.interviews && application.interviews.length > 0 ? (
                  <div className="space-y-2.5">
                    {application.interviews.map((iv) => (
                      <div key={iv.id} className="p-3.5 bg-[#0e1322] border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{iv.type}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40">
                            {iv.daysAwayBadge || 'Upcoming'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-purple-400" />
                          <span>{iv.interviewDate ? iv.interviewDate.replace('T', ' ').substring(0, 16) : ''}</span>
                        </div>
                        {iv.interviewer && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{iv.interviewer}</span>
                          </div>
                        )}
                        {iv.meetingLink && (
                          <a
                            href={iv.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Launch Video Meeting</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#0e1322] rounded-xl text-xs text-slate-500 text-center">
                    No upcoming interviews scheduled.
                  </div>
                )}
              </div>

              {/* Linked Follow-ups / Deadlines */}
              <div>
                <span className="block text-xs font-semibold text-slate-400 mb-2">Follow-ups & Deadlines</span>
                {application.followUps && application.followUps.length > 0 ? (
                  <div className="space-y-2.5">
                    {application.followUps.map((fu) => (
                      <div key={fu.id} className="p-3.5 bg-[#0e1322] border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{fu.appliedSubtitle || 'Action Required'}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/40">
                            {fu.daysDueBadge || `Due: ${fu.dueDate}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{fu.notes}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#0e1322] rounded-xl text-xs text-slate-500 text-center">
                    No active follow-ups or assessment deadlines.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
