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

export type RecruiterType =
  | 'HUMAN_RECRUITER'
  | 'POSSIBLE_RECRUITER'
  | 'AUTOMATED_SYSTEM'
  | 'NO_RECRUITER_IDENTIFIED';

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
  recruiterTitle?: string;
  recruiterPhone?: string;
  recruiterLinkedin?: string;
  recruiterType?: RecruiterType;
  contactConfidence?: number;
  contactExtractionSource?: string;
  source?: string;
  jobUrl?: string;
  notes?: string;
  lastActivityDate?: string;
  nextFollowUpDate?: string;
  companyLogo?: string;
  activitySubtitle?: string;
  timelineEvents?: TimelineEvent[];
  interviews?: Interview[];
  followUps?: FollowUp[];
}

export type SyncResult = GmailSyncResult;


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
  detectedRecruiterName?: string;
  detectedRecruiterEmail?: string;
  detectedRecruiterTitle?: string;
  detectedRecruiterType?: RecruiterType;
  detectedRecruiterConfidence?: number;
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
  thisMonthTrends?: MonthlyTrend[];
  last3MonthsTrends?: MonthlyTrend[];
  last6MonthsTrends?: MonthlyTrend[];
  last12MonthsTrends?: MonthlyTrend[];
  dailyTrendsLast7Days?: MonthlyTrend[];
  dailyTrendsLast14Days?: MonthlyTrend[];
  dailyTrendsThisMonth?: MonthlyTrend[];
  applicationStatus: StatusDistribution[];
}

export interface AssistantCard {
  cardType: string;
  id?: number;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  priority?: string;
  actionUrl?: string;
  company?: string;
  role?: string;
  status?: string;
  date?: string;
  recruiterName?: string;
  recruiterEmail?: string;
}

export interface AssistantEmailDraft {
  to?: string;
  subject: string;
  body: string;
  recruiterName?: string;
  company?: string;
  role?: string;
  draftType?: string;
}

export interface AssistantResponse {
  reply: string;
  suggestions?: string[];
  cards?: AssistantCard[];
  emailDraft?: AssistantEmailDraft;
  data?: any;
}

export interface AssistantRequest {
  query: string;
  currentScreen?: string;
  selectedApplicationId?: number;
  selectedEmailId?: number;
  action?: string;
}

export interface GmailStatus {
  connected: boolean;
  email?: string;
  provider: string;
  lastSyncedAt?: string;
  totalEmailsScanned: number;
  messagesScanned?: number;
  configured: boolean;
  scope?: string;
  hasSendScope?: boolean;
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

export interface Opportunity {
  id: number;
  company: string;
  role: string;
  recruiterName?: string;
  recruiterEmail?: string;
  subject: string;
  snippet?: string;
  fullBody?: string;
  receivedAt: string;
  location?: string;
  salary?: string;
  opportunityType?: string;
  isConverted: boolean;
  applicationId?: number;
  tags?: string[];
  isDismissed?: boolean;
}

export interface OpportunityScanResult {
  success: boolean;
  scannedCount: number;
  opportunitiesCount: number;
  message: string;
  opportunities?: Opportunity[];
}

export interface CvProfile {
  id: number;
  fileName: string;
  extractedSkills: string[];
  targetRoles: string[];
  experienceYears: number;
  educationLevel: string;
  preferredLocation: string;
  isRemotePreferred: boolean;
  uploadedAt: string;
}

export interface RelatedSkillMatch {
  candidateSkill: string;
  jobSkill: string;
  weightMultiplier: number;
  relationType: string;
  explanation: string;
}

export interface GeminiSettingsStatus {
  isConfigured: boolean;
  isEnabled: boolean;
  maskedKey: string;
  status: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyDomain?: string;
  companyLogoUrl?: string;
  location: string;
  country?: string;
  city?: string;
  workMode?: string;
  employmentType: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  salary: string;
  description: string;
  url: string;
  sourceUrl?: string;
  applyUrl?: string;
  linkedInUrl?: string;
  indeedUrl?: string;
  googleJobsUrl?: string;
  isAvailable?: boolean;
  isUrlVerified?: boolean;
  applicationUrlStatus?: string;
  isExternalApplication?: boolean;
  postedDate: string;
  source: string;
  sourceJobId?: string;
  skills: string[];
  matchScore: number;
  matchQualityLabel?: string;
  matchingSkills: string[];
  relatedSkills?: RelatedSkillMatch[];
  missingSkills: string[];
  skillsScore: number;
  roleRelevanceScore: number;
  experienceRelevanceScore: number;
  locationScore: number;
  educationScore: number;
  explanation: string;
}


