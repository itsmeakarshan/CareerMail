package com.careermail.service;

import com.careermail.dto.AnalyticsResponse;
import com.careermail.model.entity.Interview;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.User;
import com.careermail.model.enums.ApplicationStatus;
import com.careermail.repository.InterviewRepository;
import com.careermail.repository.JobApplicationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AnalyticsService {

    private final JobApplicationRepository jobApplicationRepository;
    private final InterviewRepository interviewRepository;
    private final AuthService authService;

    public AnalyticsService(JobApplicationRepository jobApplicationRepository,
                            InterviewRepository interviewRepository,
                            AuthService authService) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.interviewRepository = interviewRepository;
        this.authService = authService;
    }

    public AnalyticsResponse getDashboardAnalytics() {
        User user = authService.getCurrentUser();
        List<JobApplication> applications = jobApplicationRepository.findByUser(user);
        List<Interview> userInterviews = interviewRepository.findByUserOrderByInterviewDateAsc(user);

        long total = applications.size();
        long appliedCount = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.APPLIED).count();
        long assessmentCount = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.ASSESSMENT).count();
        long screenCount = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.RECRUITER_SCREEN).count();
        long interviewCount = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.INTERVIEW).count();
        long finalInterviewCount = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.FINAL_INTERVIEW).count();
        long offerCount = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.OFFER).count();
        long rejectedCount = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
        long withdrawnCount = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.WITHDRAWN).count();

        long totalInterviews = userInterviews.size() > 0 ? userInterviews.size() : (interviewCount + finalInterviewCount);

        AnalyticsResponse response = new AnalyticsResponse();
        response.setTotalApplications(total);
        response.setInterviews(totalInterviews);
        response.setOffers(offerCount);
        response.setRejections(rejectedCount);

        int responseRate = total > 0 ? (int) Math.round((double) (total - appliedCount) / total * 100) : 0;
        response.setResponseRate(responseRate);

        // Real calculations for current month (within current calendar month)
        LocalDate now = LocalDate.now();
        YearMonth currentYearMonth = YearMonth.from(now);
        long thisMonthApps = applications.stream()
                .filter(a -> a.getDateApplied() != null && YearMonth.from(a.getDateApplied()).equals(currentYearMonth))
                .count();
        long thisMonthInts = userInterviews.stream()
                .filter(i -> i.getInterviewDate() != null && YearMonth.from(i.getInterviewDate().toLocalDate()).equals(currentYearMonth))
                .count();
        long thisMonthOffs = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.OFFER && a.getLastActivityDate() != null && YearMonth.from(a.getLastActivityDate()).equals(currentYearMonth))
                .count();
        long thisMonthRejs = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.REJECTED && a.getLastActivityDate() != null && YearMonth.from(a.getLastActivityDate()).equals(currentYearMonth))
                .count();

        response.setThisMonthApplications(thisMonthApps);
        response.setThisMonthInterviews(thisMonthInts);
        response.setThisMonthOffers(thisMonthOffs);
        response.setThisMonthRejections(thisMonthRejs);
        response.setThisMonthResponseRateDelta(0);

        // Dynamic Applications Over Time: Real counts for the last 6 calendar months
        List<AnalyticsResponse.MonthlyTrend> trends = new ArrayList<>();
        DateTimeFormatter shortMonthFmt = DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH);
        DateTimeFormatter longMonthFmt = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

        for (int i = 5; i >= 0; i--) {
            YearMonth targetMonth = currentYearMonth.minusMonths(i);
            int countInMonth = (int) applications.stream()
                    .filter(a -> a.getDateApplied() != null && YearMonth.from(a.getDateApplied()).equals(targetMonth))
                    .count();
            String monthShort = targetMonth.format(shortMonthFmt);
            String monthLong = targetMonth.format(longMonthFmt);
            trends.add(new AnalyticsResponse.MonthlyTrend(
                    monthShort,
                    countInMonth,
                    String.format("%s: %d Application%s", monthLong, countInMonth, countInMonth == 1 ? "" : "s")
            ));
        }
        response.setApplicationsOverTime(trends);

        // Dynamic Status Distribution
        long donutInterviews = screenCount + interviewCount + finalInterviewCount;
        long donutSum = appliedCount + donutInterviews + assessmentCount + offerCount + rejectedCount + withdrawnCount;

        int appliedPct = donutSum > 0 ? (int) Math.round((double) appliedCount / donutSum * 100) : 0;
        int interviewPct = donutSum > 0 ? (int) Math.round((double) donutInterviews / donutSum * 100) : 0;
        int assessmentPct = donutSum > 0 ? (int) Math.round((double) assessmentCount / donutSum * 100) : 0;
        int offerPct = donutSum > 0 ? (int) Math.round((double) offerCount / donutSum * 100) : 0;
        int rejectedPct = donutSum > 0 ? (int) Math.round((double) rejectedCount / donutSum * 100) : 0;
        int withdrawnPct = donutSum > 0 ? (int) Math.round((double) withdrawnCount / donutSum * 100) : 0;

        List<AnalyticsResponse.StatusDistribution> distribution = new ArrayList<>();
        distribution.add(new AnalyticsResponse.StatusDistribution("Applied", appliedCount, appliedPct, "#3b82f6"));
        distribution.add(new AnalyticsResponse.StatusDistribution("Interview", donutInterviews, interviewPct, "#8b5cf6"));
        distribution.add(new AnalyticsResponse.StatusDistribution("Assessment", assessmentCount, assessmentPct, "#f59e0b"));
        distribution.add(new AnalyticsResponse.StatusDistribution("Offer", offerCount, offerPct, "#10b981"));
        distribution.add(new AnalyticsResponse.StatusDistribution("Rejected", rejectedCount, rejectedPct, "#ef4444"));
        distribution.add(new AnalyticsResponse.StatusDistribution("Withdrawn", withdrawnCount, withdrawnPct, "#64748b"));

        response.setApplicationStatus(distribution);

        return response;
    }
}
