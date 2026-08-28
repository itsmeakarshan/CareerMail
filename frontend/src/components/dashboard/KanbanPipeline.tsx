import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { JobApplication, ApplicationStatus } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';

interface PipelineProps {
  applications: JobApplication[];
  onStatusChange: (id: number, newStatus: ApplicationStatus) => Promise<void>;
  onAddApplication: (status: ApplicationStatus) => void;
  onSelectApplication: (app: JobApplication) => void;
}

interface ColumnConfig {
  id: ApplicationStatus;
  title: string;
  count: number;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentColor: string;
}

export const KanbanPipeline: React.FC<PipelineProps> = ({
  applications,
  onStatusChange,
  onAddApplication,
  onSelectApplication,
}) => {
  const [draggedAppId, setDraggedAppId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);

  // 6 Pipeline columns matching status flow in dashboard.png
  const columns: ColumnConfig[] = [
    {
      id: 'APPLIED',
      title: 'Applied',
      count: applications.filter((a) => a.status === 'APPLIED').length,
      badgeBg: 'bg-blue-950/70',
      badgeText: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      accentColor: '#3b82f6',
    },
    {
      id: 'ASSESSMENT',
      title: 'Assessment',
      count: applications.filter((a) => a.status === 'ASSESSMENT').length,
      badgeBg: 'bg-amber-950/70',
      badgeText: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      accentColor: '#f59e0b',
    },
    {
      id: 'RECRUITER_SCREEN',
      title: 'Recruiter Screen',
      count: applications.filter((a) => a.status === 'RECRUITER_SCREEN').length,
      badgeBg: 'bg-purple-950/70',
      badgeText: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      accentColor: '#a855f7',
    },
    {
      id: 'INTERVIEW',
      title: 'Interview',
      count: applications.filter((a) => a.status === 'INTERVIEW').length,
      badgeBg: 'bg-indigo-950/70',
      badgeText: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
      accentColor: '#6366f1',
    },
    {
      id: 'FINAL_INTERVIEW',
      title: 'Final Interview',
      count: applications.filter((a) => a.status === 'FINAL_INTERVIEW').length,
      badgeBg: 'bg-pink-950/70',
      badgeText: 'text-pink-400',
      borderColor: 'border-pink-500/30',
      accentColor: '#ec4899',
    },
    {
      id: 'OFFER',
      title: 'Offer',
      count: applications.filter((a) => a.status === 'OFFER').length,
      badgeBg: 'bg-emerald-950/70',
      badgeText: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      accentColor: '#10b981',
    },
  ];

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedAppId(id);
    e.dataTransfer.setData('text/plain', id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const idStr = e.dataTransfer.getData('text/plain') || (draggedAppId ? draggedAppId.toString() : '');
    const id = parseInt(idStr, 10);

    if (id) {
      if (targetStatus === 'OFFER') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      await onStatusChange(id, targetStatus);
    }
    setDraggedAppId(null);
  };

  return (
    <div className="flex flex-col gap-3 mt-4">
      <h3 className="text-base font-semibold text-white tracking-tight">Application Pipeline</h3>

      {/* 6 Kanban Columns Grid matching dashboard.png */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
        {columns.map((col) => {
          const colApps = applications.filter((a) => a.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`bg-[#101626] border ${
                isOver ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-[#1e2640]'
              } rounded-2xl p-3 flex flex-col gap-3 min-h-[380px] transition-all`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-200">{col.title}</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.borderColor} ${col.badgeBg} ${col.badgeText}`}
                >
                  {col.count}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex flex-col gap-2.5 flex-1">
                {colApps.map((app) => {
                  const isDragging = draggedAppId === app.id;
                  const isOffer = app.status === 'OFFER';
                  const isAssessmentProgress = app.activitySubtitle?.includes('progress') || app.activitySubtitle?.includes('invited');

                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onClick={() => onSelectApplication(app)}
                      className={`p-3 rounded-xl bg-[#141b2d] border border-slate-800/80 hover:border-indigo-500/50 hover:bg-[#182138] cursor-grab active:cursor-grabbing transition-all shadow-sm group ${
                        isDragging ? 'opacity-40 scale-95' : 'opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CompanyLogo company={app.company} size="md" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                            {app.company}
                          </span>
                          <span className="text-xs text-slate-400 font-medium truncate mt-0.5">
                            {app.title}
                          </span>
                          <span
                            className={`text-[11px] mt-1 font-medium truncate ${
                              isOffer
                                ? 'text-emerald-400 font-semibold flex items-center gap-1'
                                : isAssessmentProgress
                                ? 'text-amber-400 font-semibold'
                                : 'text-slate-400'
                            }`}
                          >
                            {isOffer ? (
                              <>
                                <span>Offer Received</span>
                                <span>▶</span>
                              </>
                            ) : (
                              app.activitySubtitle || 'Applied recently'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colApps.length === 0 && (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-800/60 rounded-xl p-4 text-[11px] text-slate-500 text-center select-none">
                    Drag card here
                  </div>
                )}
              </div>

              {/* + Add Application Button matching dashboard.png */}
              <button
                onClick={() => onAddApplication(col.id)}
                className="w-full mt-1 py-2 px-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-[#131a2c] hover:bg-[#182138] text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Application</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
