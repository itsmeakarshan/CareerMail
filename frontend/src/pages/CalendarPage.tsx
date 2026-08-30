import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Clock,
  MapPin,
  X,
  Filter,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  List,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Download
} from 'lucide-react';
import { interviewsApi, followUpsApi, applicationsApi } from '../services/api';
import { Interview, FollowUp, JobApplication, ApplicationStatus } from '../types';
import { CompanyLogo } from '../components/common/CompanyLogo';

export type CalendarViewType = 'MONTH' | 'WEEK' | 'AGENDA';
export type EventCategoryFilter = 'ALL' | 'INTERVIEWS' | 'FOLLOWUPS' | 'APPLICATIONS';

export interface UnifiedCalendarEvent {
  id: string;
  sourceId: number;
  type: 'INTERVIEW' | 'FOLLOWUP' | 'APPLICATION';
  title: string;
  subtitle?: string;
  company: string;
  date: Date;
  dateStr: string; // YYYY-MM-DD
  timeStr?: string; // HH:mm
  status: string;
  badge: string;
  badgeColor: 'pink' | 'orange' | 'blue' | 'emerald' | 'purple' | 'red';
  location?: string;
  meetingLink?: string;
  interviewer?: string;
  notes?: string;
  applicationId?: number;
  rawInterview?: Interview;
  rawFollowUp?: FollowUp;
  rawApplication?: JobApplication;
}

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewType>('MONTH');
  const [filterCategory, setFilterCategory] = useState<EventCategoryFilter>('ALL');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected event for detail drawer
  const [activeEvent, setActiveEvent] = useState<UnifiedCalendarEvent | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [scheduleType, setScheduleType] = useState<'INTERVIEW' | 'FOLLOWUP'>('INTERVIEW');
  const [copied, setCopied] = useState<boolean>(false);

  // New Event Form State
  const [formCompany, setFormCompany] = useState('');
  const [formTitle, setFormTitle] = useState('Software Engineer');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('10:00');
  const [formType, setFormType] = useState('Technical Interview');
  const [formInterviewer, setFormInterviewer] = useState('');
  const [formMeetingLink, setFormMeetingLink] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [intData, folData, appData] = await Promise.all([
        interviewsApi.getAll().catch(() => []),
        followUpsApi.getAll().catch(() => []),
        applicationsApi.getAll().catch(() => []),
      ]);
      setInterviews(intData);
      setFollowUps(folData);
      setApplications(appData);
    } catch (err) {
      console.error('Failed to load calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map all data to unified calendar events
  const allEvents = useMemo<UnifiedCalendarEvent[]>(() => {
    const events: UnifiedCalendarEvent[] = [];

    // 1. Interviews
    interviews.forEach((i) => {
      const d = new Date(i.interviewDate);
      if (isNaN(d.getTime())) return;
      const dateStr = d.toISOString().split('T')[0];
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');

      events.push({
        id: `interview-${i.id}`,
        sourceId: i.id,
        type: 'INTERVIEW',
        title: `${i.company} — ${i.type}`,
        subtitle: i.title,
        company: i.company,
        date: d,
        dateStr,
        timeStr: `${hours}:${mins}`,
        status: i.status || 'SCHEDULED',
        badge: i.daysAwayBadge || i.type,
        badgeColor: 'pink',
        location: i.location || 'Google Meet',
        meetingLink: i.meetingLink,
        interviewer: i.interviewer,
        notes: i.preparationNotes,
        applicationId: i.jobApplicationId,
        rawInterview: i,
      });
    });

    // 2. Follow-ups
    followUps.forEach((f) => {
      if (!f.dueDate) return;
      const d = new Date(`${f.dueDate}T09:00:00`);
      if (isNaN(d.getTime())) return;
      const dateStr = f.dueDate;

      events.push({
        id: `followup-${f.id}`,
        sourceId: f.id,
        type: 'FOLLOWUP',
        title: `Follow-up: ${f.company}`,
        subtitle: f.role || 'Application check-in',
        company: f.company,
        date: d,
        dateStr,
        timeStr: '09:00',
        status: f.status || 'PENDING',
        badge: f.daysDueBadge || 'Follow-up Due',
        badgeColor: 'orange',
        notes: f.notes,
        applicationId: f.jobApplicationId,
        rawFollowUp: f,
      });
    });

    // 3. Application Deadlines & Milestones
    applications.forEach((a) => {
      if (a.dateApplied) {
        const d = new Date(`${a.dateApplied}T09:00:00`);
        if (!isNaN(d.getTime())) {
          events.push({
            id: `app-applied-${a.id}`,
            sourceId: a.id,
            type: 'APPLICATION',
            title: `Applied: ${a.company}`,
            subtitle: a.title,
            company: a.company,
            date: d,
            dateStr: a.dateApplied,
            timeStr: '09:00',
            status: a.status,
            badge: a.status,
            badgeColor: a.status === 'OFFER' ? 'emerald' : a.status === 'REJECTED' ? 'red' : 'blue',
            notes: a.notes,
            applicationId: a.id,
            rawApplication: a,
          });
        }
      }

      if (a.nextFollowUpDate && a.nextFollowUpDate !== a.dateApplied) {
        const d = new Date(`${a.nextFollowUpDate}T10:00:00`);
        if (!isNaN(d.getTime())) {
          events.push({
            id: `app-followup-${a.id}`,
            sourceId: a.id,
            type: 'FOLLOWUP',
            title: `Next Check-in: ${a.company}`,
            subtitle: a.title,
            company: a.company,
            date: d,
            dateStr: a.nextFollowUpDate,
            timeStr: '10:00',
            status: a.status,
            badge: 'Next Check-in',
            badgeColor: 'purple',
            notes: a.notes,
            applicationId: a.id,
            rawApplication: a,
          });
        }
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [interviews, followUps, applications]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (filterCategory === 'ALL') return allEvents;
    if (filterCategory === 'INTERVIEWS') return allEvents.filter((e) => e.type === 'INTERVIEW');
    if (filterCategory === 'FOLLOWUPS') return allEvents.filter((e) => e.type === 'FOLLOWUP');
    if (filterCategory === 'APPLICATIONS') return allEvents.filter((e) => e.type === 'APPLICATION');
    return allEvents;
  }, [allEvents, filterCategory]);

  // Calendar calculations for Month View
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Adjust so Monday is 0
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({ date: prevDate, isCurrentMonth: false, dateStr });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      days.push({ date, isCurrentMonth: true, dateStr });
    }

    // Next month padding to fill complete 5 or 6 weeks (35 or 42 grid slots)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(year, month + 1, n);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({ date: nextDate, isCurrentMonth: false, dateStr });
    }

    return days;
  }, [year, month, startOffset, daysInMonth, daysInPrevMonth]);

  // Events grouped by Date string
  const eventsByDate = useMemo(() => {
    const map = new Map<string, UnifiedCalendarEvent[]>();
    filteredEvents.forEach((ev) => {
      const existing = map.get(ev.dateStr) || [];
      existing.push(ev);
      map.set(ev.dateStr, existing);
    });
    return map;
  }, [filteredEvents]);

  // Selected date events
  const selectedDateStr = selectedDay.toISOString().split('T')[0];
  const selectedDayEvents = eventsByDate.get(selectedDateStr) || [];

  // Metrics
  const now = new Date();
  const upcomingInterviewsCount = allEvents.filter((e) => e.type === 'INTERVIEW' && e.date >= now).length;
  const upcomingFollowupsCount = allEvents.filter((e) => e.type === 'FOLLOWUP' && e.date >= now).length;
  const nextImminentEvent = allEvents.find((e) => e.date >= now);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formDate) return;

    try {
      if (scheduleType === 'INTERVIEW') {
        const fullDateTime = `${formDate}T${formTime || '10:00'}:00`;
        await interviewsApi.create({
          company: formCompany.trim(),
          title: formTitle.trim() || 'Software Engineer',
          interviewDate: fullDateTime,
          type: formType,
          interviewer: formInterviewer.trim(),
          location: formMeetingLink ? 'Online / Video Call' : 'Google Meet',
          meetingLink: formMeetingLink.trim(),
          preparationNotes: formNotes.trim(),
          status: 'SCHEDULED',
        });
      } else {
        await followUpsApi.create({
          company: formCompany.trim(),
          role: formTitle.trim() || 'Software Engineer',
          dueDate: formDate,
          notes: formNotes.trim(),
          status: 'PENDING',
        });
      }

      setIsScheduleModalOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      alert(`Failed to schedule event: ${err?.message || 'Error'}`);
    }
  };

  const resetForm = () => {
    setFormCompany('');
    setFormTitle('Software Engineer');
    setFormDate('');
    setFormTime('10:00');
    setFormType('Technical Interview');
    setFormInterviewer('');
    setFormMeetingLink('');
    setFormNotes('');
  };

  const handleCopyEventDetails = (ev: UnifiedCalendarEvent) => {
    const text = `📅 ${ev.title}\n⏰ Date: ${ev.dateStr} ${ev.timeStr || ''}\n🏢 Company: ${ev.company}\n${ev.meetingLink ? `🔗 Meeting Link: ${ev.meetingLink}\n` : ''}${ev.notes ? `📝 Notes: ${ev.notes}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateGoogleCalendarUrl = (ev: UnifiedCalendarEvent) => {
    const startTime = ev.date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endTime = new Date(ev.date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(ev.title);
    const details = encodeURIComponent(`${ev.subtitle || ''}\n\n${ev.notes || ''}\n${ev.meetingLink ? `Video Meeting: ${ev.meetingLink}` : ''}\n\nManaged via CareerMail`);
    const location = encodeURIComponent(ev.meetingLink || ev.location || 'Online');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  };

  const generateIcsFile = (ev: UnifiedCalendarEvent) => {
    const startTime = ev.date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endTime = new Date(ev.date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CareerMail//Career Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${ev.id}@careermail.io`,
      `DTSTAMP:${startTime}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${ev.title}`,
      `DESCRIPTION:${(ev.subtitle || '') + ' ' + (ev.notes || '') + ' ' + (ev.meetingLink || '')}`,
      `LOCATION:${ev.meetingLink || ev.location || 'Online'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${ev.company.toLowerCase().replace(/\s+/g, '-')}-event.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isToday = (date: Date) => {
    const t = new Date();
    return (
      date.getDate() === t.getDate() &&
      date.getMonth() === t.getMonth() &&
      date.getFullYear() === t.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDay.getDate() &&
      date.getMonth() === selectedDay.getMonth() &&
      date.getFullYear() === selectedDay.getFullYear()
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* 1. Header Banner & View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#1f1f1f] dark:text-white tracking-tight flex items-center gap-2">
                <span>Career Calendar</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 font-bold border border-pink-200 dark:border-pink-800/50">
                  {allEvents.length} Events
                </span>
              </h1>
              <p className="text-xs md:text-sm text-[#5f6368] dark:text-slate-400 mt-0.5">
                Unified timeline for upcoming interviews, follow-up deadlines, and hiring milestones
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Pill */}
          <div className="flex items-center bg-[#e0e2e7] dark:bg-[#1e1f20] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['ALL', 'INTERVIEWS', 'FOLLOWUPS', 'APPLICATIONS'] as EventCategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterCategory === cat
                    ? 'bg-white dark:bg-[#282a2d] text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat === 'INTERVIEWS' ? 'Interviews' : cat === 'FOLLOWUPS' ? 'Follow-ups' : 'Milestones'}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#e0e2e7] dark:bg-[#1e1f20] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'MONTH'
                  ? 'bg-white dark:bg-[#282a2d] text-[#1f1f1f] dark:text-white shadow-sm font-bold'
                  : 'text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('AGENDA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'AGENDA'
                  ? 'bg-white dark:bg-[#282a2d] text-[#1f1f1f] dark:text-white shadow-sm font-bold'
                  : 'text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>

          <button
            onClick={() => {
              setScheduleType('INTERVIEW');
              setFormDate(selectedDateStr);
              setIsScheduleModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition-all hover-lift"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Next Imminent Event Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent dark:from-pink-950/40 dark:via-rose-950/20 dark:to-transparent border border-pink-200/80 dark:border-pink-900/40 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-pink-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                Next Upcoming Event
              </span>
              {nextImminentEvent ? (
                <>
                  <p className="text-sm font-extrabold text-[#1f1f1f] dark:text-white truncate">
                    {nextImminentEvent.title}
                  </p>
                  <p className="text-xs text-[#5f6368] dark:text-slate-400">
                    {nextImminentEvent.dateStr} • {nextImminentEvent.timeStr || 'All Day'} ({nextImminentEvent.badge})
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No upcoming deadlines scheduled
                </p>
              )}
            </div>
          </div>

          {nextImminentEvent?.meetingLink && (
            <a
              href={nextImminentEvent.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all flex-shrink-0"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join</span>
            </a>
          )}
        </div>

        {/* Interviews Metric */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Interviews
              </span>
              <p className="text-xl font-black text-[#1f1f1f] dark:text-white">
                {upcomingInterviewsCount}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/interviews')}
            className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline"
          >
            View all &rarr;
          </button>
        </div>

        {/* Follow-up Metric */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Due Follow-ups
              </span>
              <p className="text-xl font-black text-[#1f1f1f] dark:text-white">
                {upcomingFollowupsCount}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/follow-ups')}
            className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline"
          >
            Manage &rarr;
          </button>
        </div>
      </div>

      {/* 3. Main Calendar Body: Month View or Agenda View */}
      {viewMode === 'MONTH' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3A. Calendar Grid (3 columns on wide screen) */}
          <div className="lg:col-span-3 bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-5 shadow-sm space-y-4">
            {/* Month Navigator Toolbar */}
            <div className="flex items-center justify-between border-b border-[#e0e2e7] dark:border-[#282a2d] pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-[#1f1f1f] dark:text-white tracking-tight">
                  {monthName} <span className="text-pink-600 dark:text-pink-400">{year}</span>
                </h2>
                <button
                  onClick={handleToday}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-[#dadce0] dark:border-[#282a2d] hover:bg-[#f6f8fc] dark:hover:bg-[#1e1f20] text-[#1f1f1f] dark:text-white transition-colors"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1 bg-[#f6f8fc] dark:bg-[#1e1f20] p-1 rounded-xl border border-[#dadce0] dark:border-[#282a2d]">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#282a2d] text-slate-600 dark:text-slate-300 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#282a2d] text-slate-600 dark:text-slate-300 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((dayItem, idx) => {
                const dayEvents = eventsByDate.get(dayItem.dateStr) || [];
                const dayIsToday = isToday(dayItem.date);
                const dayIsSelected = isSelected(dayItem.date);

                return (
                  <div
                    key={`${dayItem.dateStr}-${idx}`}
                    onClick={() => setSelectedDay(dayItem.date)}
                    className={`min-h-[105px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      dayIsSelected
                        ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 shadow-md ring-2 ring-pink-400/30'
                        : dayIsToday
                        ? 'border-pink-400 bg-white dark:bg-[#1e1f20]'
                        : dayItem.isCurrentMonth
                        ? 'bg-[#fcfdfd] dark:bg-[#191b22] border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-300 dark:hover:border-pink-800 hover:bg-white dark:hover:bg-[#1e1f20]'
                        : 'bg-[#f8fafd] dark:bg-[#12141a] border-[#eef0f4] dark:border-[#1d2027] opacity-40 hover:opacity-80'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          dayIsToday
                            ? 'bg-pink-500 text-white shadow-sm font-black'
                            : dayIsSelected
                            ? 'text-pink-600 dark:text-pink-400 font-extrabold'
                            : dayItem.isCurrentMonth
                            ? 'text-[#1f1f1f] dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {dayItem.date.getDate()}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Badges inside Cell */}
                    <div className="space-y-1 my-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const isInterview = ev.type === 'INTERVIEW';
                        const isFollowup = ev.type === 'FOLLOWUP';

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDay(dayItem.date);
                              setActiveEvent(ev);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate flex items-center gap-1.5 transition-transform hover:scale-[1.02] shadow-xs ${
                              isInterview
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                                : isFollowup
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                                : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                            }`}
                            title={`${ev.title} (${ev.timeStr || ''})`}
                          >
                            {isInterview ? (
                              <Video className="w-2.5 h-2.5 flex-shrink-0" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                            )}
                            <span className="truncate">{ev.company}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold block pl-1">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3B. Selected Day Events Inspector Panel (Right column) */}
          <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d]">
                <div>
                  <h3 className="text-sm font-black text-[#1f1f1f] dark:text-white">
                    {selectedDay.toLocaleDateString('default', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedDayEvents.length} event{selectedDayEvents.length === 1 ? '' : 's'} scheduled
                  </span>
                </div>
                <button
                  onClick={() => {
                    setScheduleType('INTERVIEW');
                    setFormDate(selectedDateStr);
                    setIsScheduleModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 hover:bg-pink-100 transition-colors"
                  title="Schedule on this day"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Event Cards List for Selected Day */}
              <div className="space-y-3 mt-4 overflow-y-auto max-h-[460px] pr-1">
                {selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setActiveEvent(ev)}
                    className="p-3.5 rounded-2xl bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-400 transition-all cursor-pointer group shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo company={ev.company} size="sm" />
                        <div>
                          <h4 className="text-xs font-bold text-[#1f1f1f] dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
                            {ev.company}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {ev.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40">
                        {ev.timeStr || 'All Day'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between pt-2 border-t border-[#dadce0] dark:border-[#282a2d]">
                      <span className="font-semibold text-pink-600 dark:text-pink-400">
                        {ev.type}
                      </span>
                      {ev.meetingLink ? (
                        <a
                          href={ev.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-pink-600 dark:text-pink-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <Video className="w-3 h-3" />
                          <span>Join Call</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">{ev.badge}</span>
                      )}
                    </div>
                  </div>
                ))}

                {selectedDayEvents.length === 0 && (
                  <div className="p-8 text-center rounded-2xl bg-[#f6f8fc] dark:bg-[#1e1f20] border border-dashed border-[#dadce0] dark:border-[#282a2d] space-y-2">
                    <CalendarIcon className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-[#1f1f1f] dark:text-white">
                      No events on this day
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Click below to schedule an interview or set a follow-up reminder.
                    </p>
                    <button
                      onClick={() => {
                        setFormDate(selectedDateStr);
                        setIsScheduleModalOpen(true);
                      }}
                      className="mt-2 px-3 py-1.5 bg-pink-500 hover:bg-pink-400 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Event</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Google Calendar Quick Add Hint */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40 border border-pink-200 dark:border-pink-800/30 text-[11px] text-[#5f6368] dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span>CareerMail automatically syncs interviews directly from your connected Gmail account.</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Agenda View */}
      {viewMode === 'AGENDA' && (
        <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d]">
            <h2 className="text-base font-black text-[#1f1f1f] dark:text-white">
              Chronological Career Agenda
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredEvents.length} events
            </span>
          </div>

          <div className="space-y-4">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setActiveEvent(ev)}
                className="p-4 rounded-2xl bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group shadow-xs"
              >
                <div className="flex items-start gap-4">
                  <CompanyLogo company={ev.company} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#1f1f1f] dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                        {ev.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ev.type === 'INTERVIEW'
                            ? 'bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300'
                            : ev.type === 'FOLLOWUP'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        {ev.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#5f6368] dark:text-slate-400 mt-0.5">
                      {ev.subtitle} {ev.interviewer ? `• Interviewer: ${ev.interviewer}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-pink-500" />
                    <span>
                      {ev.dateStr} {ev.timeStr ? `at ${ev.timeStr}` : ''}
                    </span>
                  </div>

                  {ev.meetingLink && (
                    <a
                      href={ev.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meeting</span>
                    </a>
                  )}
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                <CalendarIcon className="w-10 h-10 mx-auto opacity-50 text-pink-500" />
                <p className="text-sm font-bold text-[#1f1f1f] dark:text-white">No agenda events found</p>
                <p className="text-xs">Schedule an interview or connect your Gmail account to auto-populate events.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Event Detail Inspector Modal */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d]">
              <div className="flex items-center gap-3">
                <CompanyLogo company={activeEvent.company} size="lg" />
                <div>
                  <h3 className="text-base font-black text-[#1f1f1f] dark:text-white">
                    {activeEvent.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeEvent.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveEvent(null)}
                className="text-slate-400 hover:text-black dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#444746] dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-500" />
                <span className="font-semibold text-[#1f1f1f] dark:text-white">Date & Time:</span>
                <span>
                  {activeEvent.dateStr} {activeEvent.timeStr ? `at ${activeEvent.timeStr}` : ''} ({activeEvent.badge})
                </span>
              </div>

              {activeEvent.interviewer && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1f1f1f] dark:text-white">Interviewer:</span>
                  <span>{activeEvent.interviewer}</span>
                </div>
              )}

              {activeEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span className="font-semibold text-[#1f1f1f] dark:text-white">Location:</span>
                  <span>{activeEvent.location}</span>
                </div>
              )}

              {activeEvent.meetingLink && (
                <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Video className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                    <span className="truncate text-pink-700 dark:text-pink-300 font-semibold">
                      {activeEvent.meetingLink}
                    </span>
                  </div>
                  <a
                    href={activeEvent.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-pink-500 hover:bg-pink-400 text-white rounded-lg text-xs font-bold flex-shrink-0 shadow-sm"
                  >
                    Join Now
                  </a>
                </div>
              )}

              {activeEvent.notes && (
                <div className="space-y-1">
                  <span className="font-semibold text-[#1f1f1f] dark:text-white">Preparation Notes:</span>
                  <div className="p-3 rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] text-xs text-slate-700 dark:text-slate-300 border border-[#e0e2e7] dark:border-[#282a2d] whitespace-pre-wrap">
                    {activeEvent.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Export & Actions Toolbar */}
            <div className="pt-3 border-t border-[#e0e2e7] dark:border-[#282a2d] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a
                  href={generateGoogleCalendarUrl(activeEvent)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] hover:border-pink-400 text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  <span>Google Calendar</span>
                </a>

                <button
                  onClick={() => generateIcsFile(activeEvent)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] hover:border-pink-400 text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export .ics</span>
                </button>
              </div>

              <button
                onClick={() => handleCopyEventDetails(activeEvent)}
                className="px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Info'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Schedule Event Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d]">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-pink-500" />
                <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white">
                  Schedule Career Event
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Type Toggle */}
            <div className="flex p-1 bg-[#f6f8fc] dark:bg-[#1e1f20] rounded-xl border border-[#dadce0] dark:border-[#282a2d]">
              <button
                type="button"
                onClick={() => setScheduleType('INTERVIEW')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  scheduleType === 'INTERVIEW'
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Interview Round
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('FOLLOWUP')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  scheduleType === 'FOLLOWUP'
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Follow-up / Deadline
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="e.g. OpenAI"
                    className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">
                    Target Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Full Stack Engineer"
                    className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                  />
                </div>

                {scheduleType === 'INTERVIEW' ? (
                  <div>
                    <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">
                      Priority
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                    >
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                )}
              </div>

              {scheduleType === 'INTERVIEW' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">
                        Format
                      </label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                      >
                        <option value="Technical Interview">Technical Interview</option>
                        <option value="Screening Call">Screening Call</option>
                        <option value="System Design">System Design</option>
                        <option value="Behavioral">Behavioral</option>
                        <option value="Hiring Manager">Hiring Manager</option>
                        <option value="Final Round">Final Round</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">
                        Interviewer
                      </label>
                      <input
                        type="text"
                        value={formInterviewer}
                        onChange={(e) => setFormInterviewer(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">
                      Video Meeting Link
                    </label>
                    <input
                      type="url"
                      value={formMeetingLink}
                      onChange={(e) => setFormMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/abc-xyz or Zoom link"
                      className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">
                  Preparation Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Key talking points, resume highlights, questions to ask..."
                  className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e0e2e7] dark:border-[#282a2d]">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white shadow-md transition-all"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
