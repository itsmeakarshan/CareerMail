package com.careermail.dto;

import java.util.List;

public class AnalyticsResponse {

    private long totalApplications;
    private long interviews;
    private long offers;
    private long rejections;
    private int responseRate;

    private int thisMonthApplications;
    private int thisMonthInterviews;
    private int thisMonthOffers;
    private int thisMonthRejections;
    private int thisMonthResponseRateDelta;

    private List<MonthlyTrend> applicationsOverTime;
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

    public int getThisMonthApplications() { return thisMonthApplications; }
    public void setThisMonthApplications(int thisMonthApplications) { this.thisMonthApplications = thisMonthApplications; }

    public int getThisMonthInterviews() { return thisMonthInterviews; }
    public void setThisMonthInterviews(int thisMonthInterviews) { this.thisMonthInterviews = thisMonthInterviews; }

    public int getThisMonthOffers() { return thisMonthOffers; }
    public void setThisMonthOffers(int thisMonthOffers) { this.thisMonthOffers = thisMonthOffers; }

    public int getThisMonthRejections() { return thisMonthRejections; }
    public void setThisMonthRejections(int thisMonthRejections) { this.thisMonthRejections = thisMonthRejections; }

    public int getThisMonthResponseRateDelta() { return thisMonthResponseRateDelta; }
    public void setThisMonthResponseRateDelta(int thisMonthResponseRateDelta) { this.thisMonthResponseRateDelta = thisMonthResponseRateDelta; }

    public List<MonthlyTrend> getApplicationsOverTime() { return applicationsOverTime; }
    public void setApplicationsOverTime(List<MonthlyTrend> applicationsOverTime) { this.applicationsOverTime = applicationsOverTime; }

    public List<StatusDistribution> getApplicationStatus() { return applicationStatus; }
    public void setApplicationStatus(List<StatusDistribution> applicationStatus) { this.applicationStatus = applicationStatus; }
}
