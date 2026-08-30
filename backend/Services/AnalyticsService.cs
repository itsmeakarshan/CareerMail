using System.Globalization;
using CareerMail.Api.Data;
using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Services;

public interface IAnalyticsService
{
    Task<AnalyticsResponse> GetDashboardAnalyticsAsync(long userId);
}

public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _context;

    public AnalyticsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AnalyticsResponse> GetDashboardAnalyticsAsync(long userId)
    {
        var applications = await _context.JobApplications
            .Where(ja => ja.UserId == userId)
            .ToListAsync();

        var userInterviews = await _context.Interviews
            .Where(i => i.UserId == userId)
            .OrderBy(i => i.InterviewDate)
            .ToListAsync();

        var total = applications.Count;
        var appliedCount = applications.Count(a => a.Status == ApplicationStatus.APPLIED);
        var assessmentCount = applications.Count(a => a.Status == ApplicationStatus.ASSESSMENT);
        var screenCount = applications.Count(a => a.Status == ApplicationStatus.RECRUITER_SCREEN);
        var interviewCount = applications.Count(a => a.Status == ApplicationStatus.INTERVIEW);
        var finalInterviewCount = applications.Count(a => a.Status == ApplicationStatus.FINAL_INTERVIEW);
        var offerCount = applications.Count(a => a.Status == ApplicationStatus.OFFER);
        var rejectedCount = applications.Count(a => a.Status == ApplicationStatus.REJECTED);
        var withdrawnCount = applications.Count(a => a.Status == ApplicationStatus.WITHDRAWN);

        var totalInterviews = userInterviews.Count > 0 ? userInterviews.Count : (interviewCount + finalInterviewCount);

        var response = new AnalyticsResponse
        {
            TotalApplications = total,
            Interviews = totalInterviews,
            Offers = offerCount,
            Rejections = rejectedCount,
            ResponseRate = total > 0 ? (int)Math.Round((double)(total - appliedCount) / total * 100) : 0
        };

        var now = DateTime.UtcNow;
        var currentYear = now.Year;
        var currentMonth = now.Month;

        response.ThisMonthApplications = applications.Count(a => a.DateApplied.HasValue && a.DateApplied.Value.Year == currentYear && a.DateApplied.Value.Month == currentMonth);
        response.ThisMonthInterviews = userInterviews.Count(i => i.InterviewDate.Year == currentYear && i.InterviewDate.Month == currentMonth);
        response.ThisMonthOffers = applications.Count(a => a.Status == ApplicationStatus.OFFER && a.LastActivityDate.HasValue && a.LastActivityDate.Value.Year == currentYear && a.LastActivityDate.Value.Month == currentMonth);
        response.ThisMonthRejections = applications.Count(a => a.Status == ApplicationStatus.REJECTED && a.LastActivityDate.HasValue && a.LastActivityDate.Value.Year == currentYear && a.LastActivityDate.Value.Month == currentMonth);
        response.ThisMonthResponseRateDelta = 0;

        // 1. Last 12 Months
        var last12Months = new List<AnalyticsResponse.MonthlyTrend>();
        for (var i = 11; i >= 0; i--)
        {
            var target = now.AddMonths(-i);
            var countInMonth = applications.Count(a => a.DateApplied.HasValue && a.DateApplied.Value.Year == target.Year && a.DateApplied.Value.Month == target.Month);
            var monthShort = target.ToString("MMM", CultureInfo.InvariantCulture);
            var monthLong = target.ToString("MMM yyyy", CultureInfo.InvariantCulture);
            last12Months.Add(new AnalyticsResponse.MonthlyTrend(
                monthShort,
                countInMonth,
                $"{monthLong}: {countInMonth} Application{(countInMonth == 1 ? "" : "s")}"
            ));
        }
        response.Last12MonthsTrends = last12Months;
        response.Last6MonthsTrends = last12Months.Skip(6).Take(6).ToList();
        response.Last3MonthsTrends = last12Months.Skip(9).Take(3).ToList();
        response.ApplicationsOverTime = response.Last3MonthsTrends;

        // 2. This Month Daily
        var thisMonthDaily = new List<AnalyticsResponse.MonthlyTrend>();
        var daysInMonth = DateTime.DaysInMonth(currentYear, currentMonth);
        var currentDay = Math.Min(now.Day, daysInMonth);
        for (var d = 1; d <= currentDay; d++)
        {
            var targetDate = new DateOnly(currentYear, currentMonth, d);
            var countOnDay = applications.Count(a => a.DateApplied.HasValue && a.DateApplied.Value == targetDate);
            var dayLabel = targetDate.ToString("MMM d", CultureInfo.InvariantCulture);
            thisMonthDaily.Add(new AnalyticsResponse.MonthlyTrend(
                d.ToString(),
                countOnDay,
                $"{dayLabel}: {countOnDay} Application{(countOnDay == 1 ? "" : "s")}"
            ));
        }
        response.ThisMonthTrends = thisMonthDaily;
        response.DailyTrendsThisMonth = thisMonthDaily;

        // 3. Last 14 Days
        var last14Days = new List<AnalyticsResponse.MonthlyTrend>();
        for (var i = 13; i >= 0; i--)
        {
            var targetDate = DateOnly.FromDateTime(now.AddDays(-i));
            var countOnDay = applications.Count(a => a.DateApplied.HasValue && a.DateApplied.Value == targetDate);
            var dayLabel = targetDate.ToString("MMM d", CultureInfo.InvariantCulture);
            var dayShort = targetDate.ToString("M/d", CultureInfo.InvariantCulture);
            last14Days.Add(new AnalyticsResponse.MonthlyTrend(
                dayShort,
                countOnDay,
                $"{dayLabel}: {countOnDay} Application{(countOnDay == 1 ? "" : "s")}"
            ));
        }
        response.DailyTrendsLast14Days = last14Days;

        // 4. Last 7 Days
        var last7Days = new List<AnalyticsResponse.MonthlyTrend>();
        for (var i = 6; i >= 0; i--)
        {
            var targetDate = DateOnly.FromDateTime(now.AddDays(-i));
            var countOnDay = applications.Count(a => a.DateApplied.HasValue && a.DateApplied.Value == targetDate);
            var dayLabel = targetDate.ToString("MMM d", CultureInfo.InvariantCulture);
            var dayShort = targetDate.ToString("ddd", CultureInfo.InvariantCulture);
            last7Days.Add(new AnalyticsResponse.MonthlyTrend(
                dayShort,
                countOnDay,
                $"{dayLabel}: {countOnDay} Application{(countOnDay == 1 ? "" : "s")}"
            ));
        }
        response.DailyTrendsLast7Days = last7Days;

        // 5. Status Distribution
        var donutInterviews = screenCount + interviewCount + finalInterviewCount;
        var donutSum = appliedCount + donutInterviews + assessmentCount + offerCount + rejectedCount + withdrawnCount;

        var appliedPct = donutSum > 0 ? (int)Math.Round((double)appliedCount / donutSum * 100) : 0;
        var interviewPct = donutSum > 0 ? (int)Math.Round((double)donutInterviews / donutSum * 100) : 0;
        var assessmentPct = donutSum > 0 ? (int)Math.Round((double)assessmentCount / donutSum * 100) : 0;
        var offerPct = donutSum > 0 ? (int)Math.Round((double)offerCount / donutSum * 100) : 0;
        var rejectedPct = donutSum > 0 ? (int)Math.Round((double)rejectedCount / donutSum * 100) : 0;
        var withdrawnPct = donutSum > 0 ? (int)Math.Round((double)withdrawnCount / donutSum * 100) : 0;

        response.ApplicationStatus = new List<AnalyticsResponse.StatusDistribution>
        {
            new("Applied", appliedCount, appliedPct, "#3b82f6"),
            new("Interview", donutInterviews, interviewPct, "#8b5cf6"),
            new("Assessment", assessmentCount, assessmentPct, "#f59e0b"),
            new("Offer", offerCount, offerPct, "#10b981"),
            new("Rejected", rejectedCount, rejectedPct, "#ef4444"),
            new("Withdrawn", withdrawnCount, withdrawnPct, "#64748b")
        };

        return response;
    }
}
