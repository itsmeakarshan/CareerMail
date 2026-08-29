import React, { useState, useEffect } from 'react';
import { Plus, Maximize2, Minimize2, Search, X, Layers, Briefcase, CheckCircle2, Clock, XCircle, ArrowUpRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { JobApplication, ApplicationStatus } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';

interface PipelineProps {
  applications: JobApplication[];
  onStatusChange: (id: number, newStatus: ApplicationStatus) => Promise<void>;
  onAddApplication: (status: ApplicationStatus) => void;
  onSelectApplication: (app: JobApplication) => void;
}

type PipelineColumnKey = 'APPLIED' | 'ASSESSMENT' | 'INTERVIEW' | 'REJECTED';

interface ColumnConfig {
  key: PipelineColumnKey;
  defaultStatus: ApplicationStatus;
  title: string;
  count: number;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentBg: string;
  accentDot: string;
  filterFn: (app: JobApplication) => boolean;
}

export const KanbanPipeline: React.FC<PipelineProps> = ({
  applications,
  onStatusChange,
  onAddApplication,
  onSelectApplication,
}) => {
  const [draggedAppId, setDraggedAppId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PipelineColumnKey | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle ESC key to close expanded modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // 4 Target Columns: Applied, Assessments, Interviews, Rejections
  const columns: ColumnConfig[] = [
    {
      key: 'APPLIED',
      defaultStatus: 'APPLIED',
      title: 'Applied',
      count: applications.filter((a) => a.status === 'APPLIED').length,
      badgeBg: 'bg-blue-100 dark:bg-blue-950/80',
      badgeText: 'text-blue-700 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-500/30',
      accentBg: 'bg-blue-500/10',
      accentDot: 'bg-blue-500',
      filterFn: (a) => a.status === 'APPLIED',
    },
    {
      key: 'ASSESSMENT',
      defaultStatus: 'ASSESSMENT',
      title: 'Assessments',
      count: applications.filter((a) => a.status === 'ASSESSMENT').length,
      badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
      badgeText: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-500/30',
      accentBg: 'bg-amber-500/10',
      accentDot: 'bg-amber-500',
      filterFn: (a) => a.status === 'ASSESSMENT',
    },
    {
      key: 'INTERVIEW',
      defaultStatus: 'INTERVIEW',
      title: 'Interviews',
      count: applications.filter(
        (a) => a.status === 'INTERVIEW' || a.status === 'RECRUITER_SCREEN' || a.status === 'FINAL_INTERVIEW'
      ).length,
      badgeBg: 'bg-pink-100 dark:bg-pink-950/80',
      badgeText: 'text-pink-700 dark:text-pink-400',
      borderColor: 'border-pink-200 dark:border-pink-500/30',
      accentBg: 'bg-pink-500/10',
      accentDot: 'bg-pink-500',
      filterFn: (a) =>
        a.status === 'INTERVIEW' || a.status === 'RECRUITER_SCREEN' || a.status === 'FINAL_INTERVIEW',
    },
    {
      key: 'REJECTED',
      defaultStatus: 'REJECTED',
      title: 'Rejections',
      count: applications.filter((a) => a.status === 'REJECTED').length,
      badgeBg: 'bg-rose-100 dark:bg-rose-950/80',
      badgeText: 'text-rose-700 dark:text-rose-400',
      borderColor: 'border-rose-200 dark:border-rose-500/30',
      accentBg: 'bg-rose-500/10',
      accentDot: 'bg-rose-500',
      filterFn: (a) => a.status === 'REJECTED',
    },
  ];

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedAppId(id);
    e.dataTransfer.setData('text/plain', id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colKey: PipelineColumnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colKey) {
      setDragOverColumn(colKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, col: ColumnConfig) => {
    e.preventDefault();
    setDragOverColumn(null);
    const idStr = e.dataTransfer.getData('text/plain') || (draggedAppId ? draggedAppId.toString() : '');
    const id = parseInt(idStr, 10);

    if (id) {
      if (col.defaultStatus === 'OFFER') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      await onStatusChange(id, col.defaultStatus);
    }
    setDraggedAppId(null);
  };

  const renderCard = (app: JobApplication, isExpandedView = false) => {
    const isDragging = draggedAppId === app.id;
    const isRejected = app.status === 'REJECTED';
    const isInterview = app.status === 'INTERVIEW' || app.status === 'FINAL_INTERVIEW' || app.status === 'RECRUITER_SCREEN';
    const isAssessment = app.status === 'ASSESSMENT';

    return (
      <div
        key={app.id}
        draggable
        onDragStart={(e) => handleDragStart(e, app.id)}
        onClick={() => {
          onSelectApplication(app);
        }}
        className={`group relative rounded-2xl bg-white dark:bg-[#1e1f20] hover:bg-[#fdf2f8] dark:hover:bg-[#282a2d] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-400 cursor-grab active:cursor-grabbing p-3.5 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between ${
          isExpandedView ? 'min-h-[105px]' : 'min-h-[92px] max-h-[92px]'
        } ${isDragging ? 'opacity-40 scale-95 ring-2 ring-pink-400' : 'opacity-100'}`}
      >
        <div className="flex items-start gap-3">
          <CompanyLogo company={app.company} size="md" />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-bold text-[#1f1f1f] dark:text-white tracking-tight truncate group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
                {app.company}
              </span>
              {app.dateApplied && (
                <span className="text-[10px] font-medium text-[#5f6368] dark:text-slate-400 flex-shrink-0">
                  {new Date(app.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <span className="text-xs text-[#5f6368] dark:text-slate-300 font-medium truncate mt-0.5">
              {app.title || 'Software Engineer'}
            </span>
          </div>
        </div>

        {/* Subtitle / Status tag bar */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-[#e0e2e7] dark:border-[#282a2d]/80">
          <span
            className={`text-[11px] font-medium truncate flex items-center gap-1.5 ${
              isRejected
                ? 'text-rose-600 dark:text-rose-400 font-medium'
                : isInterview
                ? 'text-pink-600 dark:text-pink-400 font-semibold'
                : isAssessment
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-[#5f6368] dark:text-slate-400'
            }`}
          >
            {isRejected ? (
              <>
                <XCircle className="w-3 h-3 text-rose-500" />
                <span>Application Closed</span>
              </>
            ) : isInterview ? (
              <>
                <Clock className="w-3 h-3 text-pink-500" />
                <span>{app.status === 'FINAL_INTERVIEW' ? 'Final Round' : app.status === 'RECRUITER_SCREEN' ? 'Screening' : 'Interview'}</span>
              </>
            ) : isAssessment ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-amber-500" />
                <span>Assessment Active</span>
              </>
            ) : (
              <span>{app.activitySubtitle || 'Applied recently'}</span>
            )}
          </span>

          <span className="opacity-0 group-hover:opacity-100 text-pink-600 dark:text-pink-400 text-xs transition-opacity flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Standard Compact Kanban Pipeline (4 Columns) */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-500 dark:text-pink-400" />
            <h3 className="text-base font-semibold text-[#1f1f1f] dark:text-white tracking-tight">Application Pipeline</h3>
            <span className="text-xs text-[#5f6368] dark:text-slate-400 font-medium">({applications.length} total)</span>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dadce0] dark:border-slate-800 hover:border-pink-400 bg-white dark:bg-[#1e1f20] hover:bg-[#fdf2f8] dark:hover:bg-[#282a2d] text-xs font-semibold text-[#444746] dark:text-slate-300 hover:text-black dark:hover:text-white transition-all shadow-sm group"
            title="Expand Pipeline View"
          >
            <Maximize2 className="w-3.5 h-3.5 text-pink-500 group-hover:scale-110 transition-transform" />
            <span>Expand Pipeline</span>
          </button>
        </div>

        {/* 4 Equal-sized Kanban Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colApps = applications.filter(col.filterFn);
            const isOver = dragOverColumn === col.key;

            return (
              <div
                key={col.key}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col)}
                className={`bg-[#f0f4f9] dark:bg-[#16181f] border ${
                  isOver ? 'border-pink-400 ring-2 ring-pink-400/30' : 'border-[#e0e2e7] dark:border-[#282a2d]'
                } rounded-2xl p-3.5 flex flex-col gap-3 transition-all min-h-[460px] shadow-sm`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1 pb-1 border-b border-[#e0e2e7] dark:border-[#282a2d]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.accentDot}`} />
                    <span className="text-xs font-bold text-[#1f1f1f] dark:text-slate-200 tracking-tight">{col.title}</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.borderColor} ${col.badgeBg} ${col.badgeText}`}
                  >
                    {col.count}
                  </span>
                </div>

                {/* Cards Container with smooth scrolling */}
                <div className="flex flex-col gap-2.5 flex-1 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {colApps.map((app) => renderCard(app, false))}

                  {colApps.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#dadce0] dark:border-[#282a2d] rounded-2xl p-6 text-xs text-[#5f6368] dark:text-slate-500 text-center select-none min-h-[140px]">
                      <span className="text-[#5f6368] dark:text-slate-400 font-medium">No applications in this stage</span>
                      <span className="text-[10px] text-[#5f6368] dark:text-slate-500 mt-1">Drag applications here</span>
                    </div>
                  )}
                </div>

                {/* Add Application Button */}
                <button
                  onClick={() => onAddApplication(col.defaultStatus)}
                  className="w-full py-2 px-3 rounded-xl border border-[#dadce0] dark:border-[#282a2d] hover:border-slate-400 dark:hover:border-slate-700 bg-white dark:bg-[#1e1f20] hover:bg-[#f6f8fc] dark:hover:bg-[#282a2d] text-xs font-semibold text-[#444746] dark:text-slate-300 hover:text-black dark:hover:text-white flex items-center justify-center gap-1.5 transition-all mt-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-pink-500" />
                  <span>Add Application</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pop-out Expanded Fullscreen Modal View */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-fadeIn">
          <div className="bg-[#f6f8fc] dark:bg-[#111318] border border-[#e0e2e7] dark:border-[#282a2d] rounded-3xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-popIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e0e2e7] dark:border-[#282a2d] flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#16181f]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-600/40 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1f1f1f] dark:text-white tracking-tight flex items-center gap-2">
                    <span>Application Pipeline</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700/40 font-semibold">
                      Full View
                    </span>
                  </h2>
                  <p className="text-xs text-[#5f6368] dark:text-slate-400">
                    Drag and drop cards across stages or click any card to inspect full details and email threads.
                  </p>
                </div>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search company or role..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#f0f4f9] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-xs text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dadce0] dark:border-[#282a2d] bg-white dark:bg-[#1e1f20] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2d] text-xs font-semibold text-[#444746] dark:text-slate-200 transition-all"
                  title="Close Full View (Esc)"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Collapse</span>
                </button>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-xl border border-[#dadce0] dark:border-[#282a2d] bg-white dark:bg-[#1e1f20] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2d] text-slate-400 hover:text-black dark:hover:text-white transition-all"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Columns Grid */}
            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 overflow-hidden bg-[#f6f8fc] dark:bg-[#111318]">
              {columns.map((col) => {
                let colApps = applications.filter(col.filterFn);
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase().trim();
                  colApps = colApps.filter(
                    (a) =>
                      a.company.toLowerCase().includes(q) ||
                      (a.title && a.title.toLowerCase().includes(q))
                  );
                }
                const isOver = dragOverColumn === col.key;

                return (
                  <div
                    key={`modal-${col.key}`}
                    onDragOver={(e) => handleDragOver(e, col.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, col)}
                    className={`bg-[#f0f4f9] dark:bg-[#16181f] border ${
                      isOver ? 'border-pink-400 ring-2 ring-pink-400/30' : 'border-[#e0e2e7] dark:border-[#282a2d]'
                    } rounded-2xl p-4 flex flex-col gap-3.5 h-full overflow-hidden shadow-md`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#e0e2e7] dark:border-[#282a2d] px-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.accentDot}`} />
                        <span className="text-sm font-bold text-[#1f1f1f] dark:text-white">{col.title}</span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${col.borderColor} ${col.badgeBg} ${col.badgeText}`}
                      >
                        {colApps.length}
                      </span>
                    </div>

                    {/* Scrollable Cards Area in Full View */}
                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                      {colApps.map((app) => renderCard(app, true))}

                      {colApps.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#dadce0] dark:border-[#282a2d] rounded-2xl p-6 text-xs text-[#5f6368] dark:text-slate-500 text-center select-none min-h-[160px]">
                          <Briefcase className="w-6 h-6 text-slate-400 mb-2" />
                          <span className="font-semibold text-[#5f6368] dark:text-slate-400">No applications</span>
                          <span className="text-[11px] text-[#5f6368] dark:text-slate-500 mt-1">
                            {searchQuery ? 'No matches found' : 'Drag applications here'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Add Application Button */}
                    <button
                      onClick={() => {
                        setIsExpanded(false);
                        onAddApplication(col.defaultStatus);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl border border-[#dadce0] dark:border-[#282a2d] hover:border-pink-400 bg-white dark:bg-[#1e1f20] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2d] text-xs font-semibold text-[#444746] dark:text-slate-200 hover:text-black dark:hover:text-white flex items-center justify-center gap-2 transition-all mt-auto"
                    >
                      <Plus className="w-4 h-4 text-pink-500" />
                      <span>Add Application</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
