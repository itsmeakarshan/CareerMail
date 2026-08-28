export type ApplicationStatus =
  | 'APPLIED'
  | 'ASSESSMENT'
  | 'RECRUITER_SCREEN'
  | 'INTERVIEW'
  | 'FINAL_INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface TimelineEvent {
  id?: number;
  title: string;
  description: string;
  eventDate: string;
  eventType: string;
}

export interface Interview {
  id: number;
  jobApplicationId?: number;
  company: string;
  title: string;
  interviewDate: string;
  type: string;
  interviewer?: string;
  location?: string;
  meetingLink?: string;
  preparationNotes?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  daysAwayBadge?: string;
  companyLogo?: string;
}

export interface FollowUp {
  id: number;
  jobApplicationId?: number;
  company: string;
  role?: string;
  dueDate: string;
  appliedSubtitle?: string;
  daysDueBadge?: string;
  companyLogo?: string;
  status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
  notes?: string;
}

export interface JobApplication {
  id: number;
  company: string;
  title: string;
  location?: string;
  employmentType?: string;
  salary?: string;
  dateApplied: string;
  status: ApplicationStatus;
  priority: Priority;
  recruiterName?: string;
  recruiterEmail?: string;
  source?: string;
  notes?: string;
  lastActivityDate?: string;
  nextFollowUpDate?: string;
  companyLogo?: string;
  activitySubtitle?: string;
  timelineEvents?: TimelineEvent[];
  interviews?: Interview[];
  followUps?: FollowUp[];
}

export interface Email {
  id: number;
  sender: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  important: boolean;
  folder: 'INBOX' | 'SENT' | 'DRAFTS' | 'ARCHIVE' | 'TRASH';
  labels?: string;
  jobRelated?: boolean;
  detectedCompany?: string;
  detectedRole?: string;
  detectedStatus?: string;
  classification?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  jobApplication?: JobApplication;
}

export interface MonthlyTrend {
  month: string;
  count: number;
  label: string;
}

export interface StatusDistribution {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AnalyticsData {
  totalApplications: number;
  interviews: number;
  offers: number;
  rejections: number;
  responseRate: number;
  thisMonthApplications: number;
  thisMonthInterviews: number;
  thisMonthOffers: number;
  thisMonthRejections: number;
  thisMonthResponseRateDelta: number;
  applicationsOverTime: MonthlyTrend[];
  applicationStatus: StatusDistribution[];
}

export interface AssistantResponse {
  reply: string;
  suggestions: string[];
  data?: any;
}

export interface GmailStatus {
  connected: boolean;
  email?: string;
  provider: string;
  lastSyncedAt?: string;
  totalEmailsScanned: number;
  messagesScanned?: number;
  configured: boolean;
}

export interface GmailSyncResult {
  success?: boolean;
  scannedCount?: number;
  messagesScanned?: number;
  jobEmailsFound: number;
  applicationsCreated: number;
  applicationsUpdated: number;
  duplicatesSkipped?: number;
  interviewsFound?: number;
  interviewsCreated?: number;
  followUpsFound?: number;
  followUpsCreated?: number;
  message: string;
  syncedAt: string;
}

export interface GoogleAuthUrlResponse {
  url: string;
  state: string;
}

export interface GoogleConfigResponse {
  configured: boolean;
  redirectUri: string;
  frontendUrl: string;
}
