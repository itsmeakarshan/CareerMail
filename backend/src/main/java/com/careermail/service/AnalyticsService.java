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

        // Dynamic Trend Calculations: Max 3-Month, This Month Daily, Last 14 Days, and Last 7 Days
        DateTimeFormatter shortMonthFmt = DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH);
        DateTimeFormatter longMonthFmt = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
        DateTimeFormatter dayMonthFmt = DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH);

        // 1. Last 12 & 6 Months for backward compatibility
        List<AnalyticsResponse.MonthlyTrend> last12Months = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth targetMonth = currentYearMonth.minusMonths(i);
            int countInMonth = (int) applications.stream()
                    .filter(a -> a.getDateApplied() != null && YearMonth.from(a.getDateApplied()).equals(targetMonth))
                    .count();
            String monthShort = targetMonth.format(shortMonthFmt);
            String monthLong = targetMonth.format(longMonthFmt);
            last12Months.add(new AnalyticsResponse.MonthlyTrend(
                    monthShort,
                    countInMonth,
                    String.format("%s: %d Application%s", monthLong, countInMonth, countInMonth == 1 ? "" : "s")
            ));
        }
        response.setLast12MonthsTrends(last12Months);
        response.setLast6MonthsTrends(new ArrayList<>(last12Months.subList(6, 12)));

        // 2. Last 3 Months (Max 3 months)
        List<AnalyticsResponse.MonthlyTrend> last3Months = new ArrayList<>(last12Months.subList(9, 12));
        response.setLast3MonthsTrends(last3Months);
        response.setApplicationsOverTime(last3Months);

        // 3. This Month (Days Breakdown from Day 1 to Today / End of Month)
        List<AnalyticsResponse.MonthlyTrend> thisMonthDaily = new ArrayList<>();
        int todayDay = Math.max(now.getDayOfMonth(), 1);
        for (int d = 1; d <= todayDay; d++) {
            LocalDate targetDate = currentYearMonth.atDay(d);
            int countOnDay = (int) applications.stream()
                    .filter(a -> a.getDateApplied() != null && a.getDateApplied().equals(targetDate))
                    .count();
            String dayLabel = targetDate.format(dayMonthFmt);
            String dayShort = String.valueOf(d);
            thisMonthDaily.add(new AnalyticsResponse.MonthlyTrend(
                    dayShort,
                    countOnDay,
                    String.format("%s: %d Application%s", dayLabel, countOnDay, countOnDay == 1 ? "" : "s")
            ));
        }
        response.setThisMonthTrends(thisMonthDaily);
        response.setDailyTrendsThisMonth(thisMonthDaily);

        // 4. Last 14 Days (Daily)
        List<AnalyticsResponse.MonthlyTrend> last14Days = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate targetDate = now.minusDays(i);
            int countOnDay = (int) applications.stream()
                    .filter(a -> a.getDateApplied() != null && a.getDateApplied().equals(targetDate))
                    .count();
            String dayLabel = targetDate.format(dayMonthFmt);
            String dayShort = targetDate.format(DateTimeFormatter.ofPattern("M/d", Locale.ENGLISH));
            last14Days.add(new AnalyticsResponse.MonthlyTrend(
                    dayShort,
                    countOnDay,
                    String.format("%s: %d Application%s", dayLabel, countOnDay, countOnDay == 1 ? "" : "s")
            ));
        }
        response.setDailyTrendsLast14Days(last14Days);

        // 5. Last 7 Days (Daily)
        List<AnalyticsResponse.MonthlyTrend> last7Days = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = now.minusDays(i);
            int countOnDay = (int) applications.stream()
                    .filter(a -> a.getDateApplied() != null && a.getDateApplied().equals(targetDate))
                    .count();
            String dayLabel = targetDate.format(dayMonthFmt);
            String dayShort = targetDate.format(DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH));
            last7Days.add(new AnalyticsResponse.MonthlyTrend(
                    dayShort,
                    countOnDay,
                    String.format("%s: %d Application%s", dayLabel, countOnDay, countOnDay == 1 ? "" : "s")
            ));
        }
        response.setDailyTrendsLast7Days(last7Days);

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
