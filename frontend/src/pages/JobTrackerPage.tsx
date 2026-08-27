import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Plus } from 'lucide-react';
import { applicationsApi, analyticsApi, interviewsApi, followUpsApi } from '../services/api';
import { JobApplication, AnalyticsData, Interview, FollowUp, ApplicationStatus } from '../types';
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
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialModalStatus, setInitialModalStatus] = useState<ApplicationStatus>('APPLIED');
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQ]);

  const handleStatusChange = async (id: number, newStatus: ApplicationStatus) => {
    // Optimistic UI update
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    try {
      await applicationsApi.updateStatus(id, newStatus);
      // Refresh analytics in background
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => {}}
            className="px-3.5 py-2 bg-[#12182a] hover:bg-[#182138] border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all shadow-sm"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </button>

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

      {/* KPI Counters (5 columns matching dashboard.png) */}
      <KpiCards data={analytics} />

      {/* Middle Row: Charts on Left, Upcoming & Follow-ups on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: 2 Charts */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ApplicationsOverTimeChart data={analytics} />
          <ApplicationStatusDonut data={analytics} />
        </div>

        {/* Right Side: Upcoming Interviews & Follow-ups Due */}
        <div className="lg:col-span-4 flex flex-col gap-4">
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
        applications={applications}
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
