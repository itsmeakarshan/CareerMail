import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Plus, RefreshCw, Sparkles, AlertCircle, X } from 'lucide-react';
import { applicationsApi, analyticsApi, interviewsApi, followUpsApi, gmailApi } from '../services/api';
import { JobApplication, AnalyticsData, Interview, FollowUp, ApplicationStatus, GmailSyncResult } from '../types';
import { KpiCards } from '../components/dashboard/KpiCards';
import { ApplicationsOverTimeChart } from '../components/dashboard/ApplicationsOverTimeChart';
import { ApplicationStatusDonut } from '../components/dashboard/ApplicationStatusDonut';
import { UpcomingInterviewsWidget } from '../components/dashboard/UpcomingInterviewsWidget';
import { FollowUpsDueWidget } from '../components/dashboard/FollowUpsDueWidget';
import { KanbanPipeline } from '../components/dashboard/KanbanPipeline';
import { AddApplicationModal } from '../components/dashboard/AddApplicationModal';
import { ApplicationDetailDrawer } from '../components/dashboard/ApplicationDetailDrawer';

export const JobTrackerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQ = searchParams.get('q') || '';

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<GmailSyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Filter state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialModalStatus, setInitialModalStatus] = useState<ApplicationStatus>('APPLIED');
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [appsRes, analyticsRes, interviewsRes, followUpsRes] = await Promise.all([
        searchQ ? applicationsApi.search(searchQ) : applicationsApi.getAll(),
        analyticsApi.getDashboard(),
        interviewsApi.getAll(),
        followUpsApi.getAll(),
      ]);
      setApplications(appsRes);
      setAnalytics(analyticsRes);
      setInterviews(interviewsRes);
      setFollowUps(followUpsRes);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQ]);

  const handleSyncGmail = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const result = await gmailApi.sync(300);
      setSyncResult(result);
      if (result.success === false && result.message) {
        setSyncError(result.message);
      }
      // Immediately refresh all dashboard data from PostgreSQL
      await fetchData();
      setTimeout(() => setSyncResult(null), 10000);
    } catch (err: any) {
      setSyncError(err.message || 'Failed to sync Gmail');
      setTimeout(() => setSyncError(null), 8000);
    } finally {
      setSyncing(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: ApplicationStatus) => {
    // Optimistic UI update
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    try {
      await applicationsApi.updateStatus(id, newStatus);
      const updatedAnalytics = await analyticsApi.getDashboard();
      setAnalytics(updatedAnalytics);
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchData(); // Rollback on error
    }
  };

  const handleCreateOrUpdate = async (data: Partial<JobApplication>) => {
    if (editingApp) {
      await applicationsApi.update(editingApp.id, data);
    } else {
      await applicationsApi.create(data);
    }
    setEditingApp(null);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await applicationsApi.delete(id);
    fetchData();
  };

  // Filtered applications
  const filteredApplications = applications.filter((app) => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && app.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto pb-12">
      {/* Top Header matching dashboard.png */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Job Tracker Dashboard</span>
            <span>👋</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5 font-medium">
            Track, manage and ace your dream career
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative">
          {/* Sync Gmail Button */}
          <button
            onClick={handleSyncGmail}
            disabled={syncing}
            className="px-3.5 py-2 bg-[#12182a] hover:bg-[#182138] border border-purple-800/40 hover:border-purple-500 rounded-xl text-xs font-semibold text-purple-300 hover:text-white flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            title="Scan recent Gmail messages for job updates"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Gmail...' : 'Sync Gmail'}</span>
          </button>

          {/* Filter Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'bg-purple-900/40 border border-purple-500 text-purple-200'
                  : 'bg-[#12182a] hover:bg-[#182138] border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter</span>
              {(statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              )}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-12 w-64 bg-[#141b2d] border border-slate-800 rounded-2xl p-4 shadow-2xl z-40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">Filter Applications</span>
                  <button
                    onClick={() => {
                      setStatusFilter('ALL');
                      setPriorityFilter('ALL');
                    }}
                    className="text-[10px] text-purple-400 hover:underline"
                  >
                    Reset
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#0c101d] border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="APPLIED">Applied</option>
                    <option value="ASSESSMENT">Assessment</option>
                    <option value="RECRUITER_SCREEN">Recruiter Screen</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="FINAL_INTERVIEW">Final Round</option>
                    <option value="OFFER">Offer</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#0c101d] border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Add Application Button */}
          <button
            onClick={() => {
              setEditingApp(null);
              setInitialModalStatus('APPLIED');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-glow-purple transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Sync Success Alert / Banner */}
      {syncResult && (
        <div className="p-3.5 bg-gradient-to-r from-violet-950/90 via-purple-950/80 to-indigo-950/90 border border-purple-600/50 rounded-2xl text-xs text-purple-200 flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-white block">Gmail Sync Completed</span>
              <span className="text-[11px] text-purple-300">{syncResult.message}</span>
            </div>
          </div>
          <button onClick={() => setSyncResult(null)} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4 text-purple-300" />
          </button>
        </div>
      )}

      {syncError && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-800/60 rounded-2xl text-xs text-rose-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{syncError}</span>
          </div>
          <button onClick={() => setSyncError(null)} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      )}

      {/* KPI Counters (5 columns matching dashboard.png) */}
      <KpiCards data={analytics} />

      {/* Middle Row: 3-column layout matching dashboard.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column: Applications Over Time */}
        <div className="lg:col-span-5 h-full">
          <ApplicationsOverTimeChart data={analytics} />
        </div>

        {/* Center Column: Application Status Donut */}
        <div className="lg:col-span-3 xl:col-span-3 h-full">
          <ApplicationStatusDonut data={analytics} />
        </div>

        {/* Right Column: Upcoming Interviews & Follow-ups Due */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-3.5">
          <UpcomingInterviewsWidget
            interviews={interviews}
            onSelectInterview={(item) => {
              if (item.jobApplicationId) {
                const app = applications.find((a) => a.id === item.jobApplicationId);
                if (app) {
                  setSelectedApp(app);
                  setIsDrawerOpen(true);
                }
              }
            }}
          />
          <FollowUpsDueWidget
            followUps={followUps}
            onSelectFollowUp={(item) => {
              if (item.jobApplicationId) {
                const app = applications.find((a) => a.id === item.jobApplicationId);
                if (app) {
                  setSelectedApp(app);
                  setIsDrawerOpen(true);
                }
              }
            }}
          />
        </div>
      </div>

      {/* Application Pipeline (Kanban Board matching dashboard.png) */}
      <KanbanPipeline
        applications={filteredApplications}
        onStatusChange={handleStatusChange}
        onAddApplication={(status) => {
          setEditingApp(null);
          setInitialModalStatus(status);
          setIsAddModalOpen(true);
        }}
        onSelectApplication={(app) => {
          setSelectedApp(app);
          setIsDrawerOpen(true);
        }}
      />

      {/* Modals & Drawers */}
      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateOrUpdate}
        initialStatus={initialModalStatus}
        editData={editingApp}
      />

      <ApplicationDetailDrawer
        application={selectedApp}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={(app) => {
          setEditingApp(app);
          setIsDrawerOpen(false);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};
