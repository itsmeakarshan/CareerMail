package com.careermail.dto;

import java.util.List;

public class AnalyticsResponse {

    private long totalApplications;
    private long interviews;
    private long offers;
    private long rejections;
    private int responseRate;

    private long thisMonthApplications;
    private long thisMonthInterviews;
    private long thisMonthOffers;
    private long thisMonthRejections;
    private int thisMonthResponseRateDelta;

    private List<MonthlyTrend> applicationsOverTime;
    private List<MonthlyTrend> thisMonthTrends;
    private List<MonthlyTrend> last3MonthsTrends;
    private List<MonthlyTrend> last6MonthsTrends;
    private List<MonthlyTrend> last12MonthsTrends;
    private List<MonthlyTrend> dailyTrendsLast7Days;
    private List<MonthlyTrend> dailyTrendsLast14Days;
    private List<MonthlyTrend> dailyTrendsThisMonth;
    private List<StatusDistribution> applicationStatus;

    public AnalyticsResponse() {}

    public static class MonthlyTrend {
        private String month;
        private int count;
        private String label;

        public MonthlyTrend() {}
        public MonthlyTrend(String month, int count, String label) {
            this.month = month;
            this.count = count;
            this.label = label;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }

        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
    }

    public static class StatusDistribution {
        private String name;
        private long count;
        private int percentage;
        private String color;

        public StatusDistribution() {}
        public StatusDistribution(String name, long count, int percentage, String color) {
            this.name = name;
            this.count = count;
            this.percentage = percentage;
            this.color = color;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }

        public int getPercentage() { return percentage; }
        public void setPercentage(int percentage) { this.percentage = percentage; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    public long getTotalApplications() { return totalApplications; }
    public void setTotalApplications(long totalApplications) { this.totalApplications = totalApplications; }

    public long getInterviews() { return interviews; }
    public void setInterviews(long interviews) { this.interviews = interviews; }

    public long getOffers() { return offers; }
    public void setOffers(long offers) { this.offers = offers; }

    public long getRejections() { return rejections; }
    public void setRejections(long rejections) { this.rejections = rejections; }

    public int getResponseRate() { return responseRate; }
    public void setResponseRate(int responseRate) { this.responseRate = responseRate; }

    public long getThisMonthApplications() { return thisMonthApplications; }
    public void setThisMonthApplications(long thisMonthApplications) { this.thisMonthApplications = thisMonthApplications; }

    public long getThisMonthInterviews() { return thisMonthInterviews; }
    public void setThisMonthInterviews(long thisMonthInterviews) { this.thisMonthInterviews = thisMonthInterviews; }

    public long getThisMonthOffers() { return thisMonthOffers; }
    public void setThisMonthOffers(long thisMonthOffers) { this.thisMonthOffers = thisMonthOffers; }

    public long getThisMonthRejections() { return thisMonthRejections; }
    public void setThisMonthRejections(long thisMonthRejections) { this.thisMonthRejections = thisMonthRejections; }

    public int getThisMonthResponseRateDelta() { return thisMonthResponseRateDelta; }
    public void setThisMonthResponseRateDelta(int thisMonthResponseRateDelta) { this.thisMonthResponseRateDelta = thisMonthResponseRateDelta; }

    public List<MonthlyTrend> getApplicationsOverTime() { return applicationsOverTime; }
    public void setApplicationsOverTime(List<MonthlyTrend> applicationsOverTime) { this.applicationsOverTime = applicationsOverTime; }

    public List<MonthlyTrend> getThisMonthTrends() { return thisMonthTrends; }
    public void setThisMonthTrends(List<MonthlyTrend> thisMonthTrends) { this.thisMonthTrends = thisMonthTrends; }

    public List<MonthlyTrend> getLast3MonthsTrends() { return last3MonthsTrends; }
    public void setLast3MonthsTrends(List<MonthlyTrend> last3MonthsTrends) { this.last3MonthsTrends = last3MonthsTrends; }

    public List<MonthlyTrend> getLast6MonthsTrends() { return last6MonthsTrends; }
    public void setLast6MonthsTrends(List<MonthlyTrend> last6MonthsTrends) { this.last6MonthsTrends = last6MonthsTrends; }

    public List<MonthlyTrend> getLast12MonthsTrends() { return last12MonthsTrends; }
    public void setLast12MonthsTrends(List<MonthlyTrend> last12MonthsTrends) { this.last12MonthsTrends = last12MonthsTrends; }

    public List<MonthlyTrend> getDailyTrendsLast7Days() { return dailyTrendsLast7Days; }
    public void setDailyTrendsLast7Days(List<MonthlyTrend> dailyTrendsLast7Days) { this.dailyTrendsLast7Days = dailyTrendsLast7Days; }

    public List<MonthlyTrend> getDailyTrendsLast14Days() { return dailyTrendsLast14Days; }
    public void setDailyTrendsLast14Days(List<MonthlyTrend> dailyTrendsLast14Days) { this.dailyTrendsLast14Days = dailyTrendsLast14Days; }

    public List<MonthlyTrend> getDailyTrendsThisMonth() { return dailyTrendsThisMonth; }
    public void setDailyTrendsThisMonth(List<MonthlyTrend> dailyTrendsThisMonth) { this.dailyTrendsThisMonth = dailyTrendsThisMonth; }

    public List<StatusDistribution> getApplicationStatus() { return applicationStatus; }
    public void setApplicationStatus(List<StatusDistribution> applicationStatus) { this.applicationStatus = applicationStatus; }
}
