import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw, Filter, AlertCircle, Sparkles, X } from 'lucide-react';
import { KpiCards } from '../components/dashboard/KpiCards';
import { ApplicationsOverTimeChart } from '../components/dashboard/ApplicationsOverTimeChart';
import { ApplicationStatusDonut } from '../components/dashboard/ApplicationStatusDonut';
import { RoleDistributionChart } from '../components/dashboard/RoleDistributionChart';
import { KanbanPipeline } from '../components/dashboard/KanbanPipeline';
import { AddApplicationModal } from '../components/dashboard/AddApplicationModal';
import { ApplicationDetailDrawer } from '../components/dashboard/ApplicationDetailDrawer';
import { ExtractedOpportunitiesWidget } from '../components/dashboard/ExtractedOpportunitiesWidget';
import { applicationsApi, analyticsApi, interviewsApi, followUpsApi, gmailApi, opportunitiesApi } from '../services/api';
import { JobApplication, AnalyticsData, Interview, FollowUp, ApplicationStatus, SyncResult, Opportunity } from '../types';

export const JobTrackerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQ = searchParams.get('q') || '';

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Filters & State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  // Modal / Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [initialModalStatus, setInitialModalStatus] = useState<ApplicationStatus>('APPLIED');

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsData, oppsData, anData, intData, folData] = await Promise.all([
        applicationsApi.getAll(),
        opportunitiesApi.getAll().catch(() => []),
        analyticsApi.getDashboard(),
        interviewsApi.getAll(),
        followUpsApi.getAll(),
      ]);

      setApplications(appsData);
      setOpportunities(oppsData);
      setAnalytics(anData);
      setInterviews(intData);
      setFollowUps(folData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncGmail = async () => {
    try {
      setSyncing(true);
      setSyncError(null);
      setSyncResult(null);
      const res = await gmailApi.sync(300);
      setSyncResult(res);
      await loadData();
    } catch (err: any) {
      console.error('Gmail Sync Error:', err);
      setSyncError(err?.response?.data?.message || 'Failed to sync Gmail. Make sure your Google account is connected in Settings.');
    } finally {
      setSyncing(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: ApplicationStatus) => {
    try {
      const updated = await applicationsApi.updateStatus(id, newStatus);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp(updated);
      }
      const anData = await analyticsApi.getDashboard();
      setAnalytics(anData);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleCreateOrUpdate = async (formData: any) => {
    try {
      if (editingApp) {
        const updated = await applicationsApi.update(editingApp.id, formData);
        setApplications((prev) => prev.map((a) => (a.id === editingApp.id ? updated : a)));
        if (selectedApp && selectedApp.id === editingApp.id) {
          setSelectedApp(updated);
        }
      } else {
        const created = await applicationsApi.create(formData);
        setApplications((prev) => [created, ...prev]);
      }
      setIsAddModalOpen(false);
      setEditingApp(null);
      const anData = await analyticsApi.getDashboard();
      setAnalytics(anData);
    } catch (err) {
      console.error('Error saving application:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await applicationsApi.delete(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setIsDrawerOpen(false);
      setSelectedApp(null);
      const anData = await analyticsApi.getDashboard();
      setAnalytics(anData);
    } catch (err) {
      console.error('Error deleting application:', err);
    }
  };

  // Filtered applications
  const filteredApplications = applications.filter((app) => {
    if (searchQ) {
      const q = searchQ.toLowerCase();
      const match =
        app.company.toLowerCase().includes(q) ||
        (app.title && app.title.toLowerCase().includes(q)) ||
        (app.location && app.location.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== 'ALL' && app.status !== statusFilter) {
      return false;
    }
    if (priorityFilter !== 'ALL' && app.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-5 w-full pb-12">
      {/* Top Header matching dashboard.png */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1f1f1f] dark:text-white tracking-tight flex items-center gap-2">
            <span>Job Tracker Dashboard</span>
            <span>👋</span>
          </h1>
          <p className="text-xs md:text-sm text-[#5f6368] dark:text-slate-400 mt-0.5 font-medium">
            Track, manage and ace your dream career
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative">
          {/* Sync Gmail Button */}
          <button
            onClick={handleSyncGmail}
            disabled={syncing}
            className="px-3.5 py-2 bg-white dark:bg-[#1e1f20] hover:bg-[#fdf2f8] dark:hover:bg-[#282a2d] border border-pink-300 dark:border-pink-800/40 hover:border-pink-500 rounded-xl text-xs font-semibold text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-white flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            title="Scan recent Gmail messages for job updates"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-pink-500 dark:text-pink-400 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Gmail...' : 'Sync Gmail'}</span>
          </button>

          {/* Filter Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'bg-pink-100 dark:bg-pink-900/40 border border-pink-400 dark:border-pink-500 text-pink-800 dark:text-pink-200'
                  : 'bg-white dark:bg-[#1e1f20] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2d] border border-[#dadce0] dark:border-slate-800 text-[#444746] dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter</span>
              {(statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                <span className="w-2 h-2 rounded-full bg-pink-500" />
              )}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-12 w-64 bg-white dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-4 shadow-2xl z-40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-[#e0e2e7] dark:border-[#282a2d]">
                  <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">Filter Applications</span>
                  <button
                    onClick={() => {
                      setStatusFilter('ALL');
                      setPriorityFilter('ALL');
                    }}
                    className="text-[10px] text-pink-600 dark:text-pink-400 hover:underline"
                  >
                    Reset
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#f6f8fc] dark:bg-[#111318] border border-[#dadce0] dark:border-slate-700 rounded-lg text-xs text-[#1f1f1f] dark:text-white"
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
                  <label className="block text-[11px] font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#f6f8fc] dark:bg-[#111318] border border-[#dadce0] dark:border-slate-700 rounded-lg text-xs text-[#1f1f1f] dark:text-white"
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
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Sync Success Alert / Banner */}
      {syncResult && (
        <div className="p-3.5 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 dark:from-pink-950/90 dark:via-pink-950/80 dark:to-rose-950/90 border border-pink-300 dark:border-pink-600/50 rounded-2xl text-xs text-pink-900 dark:text-pink-200 flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-[#1f1f1f] dark:text-white block">Gmail Sync Completed</span>
              <span className="text-[11px] text-pink-800 dark:text-pink-300">{syncResult.message}</span>
            </div>
          </div>
          <button onClick={() => setSyncResult(null)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4 text-pink-600 dark:text-pink-300" />
          </button>
        </div>
      )}

      {syncError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{syncError}</span>
          </div>
          <button onClick={() => setSyncError(null)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </button>
        </div>
      )}

      {/* KPI Counters (5 columns matching dashboard.png) */}
      <KpiCards data={analytics} />

      {/* Middle Row: 3-column Data Visualizations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Column: Applications Over Time */}
        <div className="lg:col-span-5 h-full">
          <ApplicationsOverTimeChart data={analytics} applications={applications} />
        </div>

        {/* Center Column: Application Status Donut */}
        <div className="lg:col-span-3 xl:col-span-3 h-full">
          <ApplicationStatusDonut data={analytics} applications={applications} />
        </div>

        {/* Right Column: Target Roles & Domains Chart */}
        <div className="lg:col-span-4 xl:col-span-4 h-full">
          <RoleDistributionChart applications={applications} />
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

      {/* Extracted Opportunities from Gmail (Full-Width Bottom Section) */}
      <ExtractedOpportunitiesWidget
        opportunities={opportunities}
        onRefresh={loadData}
        onOpportunityConverted={(newApp) => {
          setApplications((prev) => [newApp, ...prev.filter((a) => a.id !== newApp.id)]);
          setSelectedApp(newApp);
          setIsDrawerOpen(true);
        }}
        onSelectApplication={(appId) => {
          const found = applications.find((a) => a.id === appId);
          if (found) {
            setSelectedApp(found);
            setIsDrawerOpen(true);
          }
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
