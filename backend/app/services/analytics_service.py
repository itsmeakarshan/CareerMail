from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.models.models import JobApplication, Interview
from app.models.enums import ApplicationStatus
from app.schemas.analytics import AnalyticsResponse, MonthlyTrend, StatusDistribution


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_analytics(self, user_id: int) -> AnalyticsResponse:
        apps = self.db.query(JobApplication).filter(JobApplication.user_id == user_id).all()
        interviews_list = self.db.query(Interview).filter(Interview.user_id == user_id).all()

        total_apps = len(apps)
        offers_count = sum(1 for a in apps if a.status == ApplicationStatus.OFFER.value)
        rejections_count = sum(1 for a in apps if a.status == ApplicationStatus.REJECTED.value)
        
        # Interviews: applications in interview stages or total scheduled interviews
        interview_apps = sum(1 for a in apps if a.status in (ApplicationStatus.INTERVIEW.value, ApplicationStatus.FINAL_INTERVIEW.value, ApplicationStatus.RECRUITER_SCREEN.value))
        interviews_count = max(interview_apps, len(interviews_list))

        # Response rate: applications that progressed beyond APPLIED
        progressed_count = sum(1 for a in apps if a.status != ApplicationStatus.APPLIED.value)
        response_rate = int((progressed_count / total_apps * 100)) if total_apps > 0 else 0

        # This month metrics
        today = date.today()
        first_day_this_month = date(today.year, today.month, 1)
        this_month_apps = [a for a in apps if a.date_applied and a.date_applied >= first_day_this_month]
        
        this_month_apps_count = len(this_month_apps)
        this_month_offers = sum(1 for a in this_month_apps if a.status == ApplicationStatus.OFFER.value)
        this_month_rejections = sum(1 for a in this_month_apps if a.status == ApplicationStatus.REJECTED.value)
        this_month_interviews = sum(1 for a in this_month_apps if a.status in (ApplicationStatus.INTERVIEW.value, ApplicationStatus.FINAL_INTERVIEW.value))

        # Build Status Distribution
        status_colors = {
            ApplicationStatus.APPLIED.value: "#6366F1",         # Indigo
            ApplicationStatus.ASSESSMENT.value: "#8B5CF6",      # Purple
            ApplicationStatus.RECRUITER_SCREEN.value: "#3B82F6",# Blue
            ApplicationStatus.INTERVIEW.value: "#06B6D4",       # Cyan
            ApplicationStatus.FINAL_INTERVIEW.value: "#EC4899", # Pink
            ApplicationStatus.OFFER.value: "#10B981",           # Emerald
            ApplicationStatus.REJECTED.value: "#EF4444",        # Red
            ApplicationStatus.WITHDRAWN.value: "#6B7280",       # Gray
        }

        status_counts = {}
        for a in apps:
            st = a.status or ApplicationStatus.APPLIED.value
            status_counts[st] = status_counts.get(st, 0) + 1

        status_distributions = []
        for enum_item in ApplicationStatus:
            cnt = status_counts.get(enum_item.value, 0)
            pct = int((cnt / total_apps * 100)) if total_apps > 0 else 0
            status_distributions.append(StatusDistribution(
                name=enum_item.get_display_name(),
                status=enum_item.value,
                count=cnt,
                percentage=pct,
                color=status_colors.get(enum_item.value, "#6366F1")
            ))

        # Build Trends
        last12_trends = self._build_monthly_trends(apps, 12)
        last6_trends = self._build_monthly_trends(apps, 6)
        last3_trends = self._build_monthly_trends(apps, 3)
        daily_this_month = self._build_daily_this_month_trends(apps)
        daily_30d = self._build_daily_trends(apps, 30)
        daily_14d = self._build_daily_trends(apps, 14)
        daily_7d = self._build_daily_trends(apps, 7)

        return AnalyticsResponse(
            total_applications=total_apps,
            interviews=interviews_count,
            offers=offers_count,
            rejections=rejections_count,
            response_rate=response_rate,
            this_month_applications=this_month_apps_count,
            this_month_interviews=this_month_interviews,
            this_month_offers=this_month_offers,
            this_month_rejections=this_month_rejections,
            this_month_response_rate_delta=5,
            applications_over_time=daily_30d,
            last12_months_trends=last12_trends,
            last6_months_trends=last6_trends,
            last3_months_trends=last3_trends,
            this_month_trends=daily_this_month,
            daily_trends_this_month=daily_this_month,
            daily_trends_last30_days=daily_30d,
            daily_trends_last14_days=daily_14d,
            daily_trends_last7_days=daily_7d,
            application_status=status_distributions
        )

    def _build_monthly_trends(self, apps: list[JobApplication], months_back: int) -> list[MonthlyTrend]:
        today = date.today()
        trends = []
        
        for i in range(months_back - 1, -1, -1):
            # Calculate year and month
            year = today.year
            month = today.month - i
            while month <= 0:
                month += 12
                year -= 1
                
            slot_date = date(year, month, 1)
            month_label = slot_date.strftime("%b")
            formatted_label = slot_date.strftime("%b %Y")

            cnt = sum(1 for a in apps if a.date_applied and a.date_applied.year == year and a.date_applied.month == month)
            trends.append(MonthlyTrend(
                month=month_label,
                count=cnt,
                label=formatted_label,
                formatted_label=formatted_label
            ))

        return trends

    def _build_daily_trends(self, apps: list[JobApplication], days_back: int) -> list[MonthlyTrend]:
        today = date.today()
        trends = []

        for i in range(days_back - 1, -1, -1):
            target_date = today - timedelta(days=i)
            day_label = target_date.strftime("%d %b")
            cnt = sum(1 for a in apps if a.date_applied == target_date)
            trends.append(MonthlyTrend(
                month=day_label,
                count=cnt,
                label=day_label,
                formatted_label=day_label
            ))

        return trends

    def _build_daily_this_month_trends(self, apps: list[JobApplication]) -> list[MonthlyTrend]:
        import calendar
        today = date.today()
        days_in_month = calendar.monthrange(today.year, today.month)[1]

        trends = []
        for day in range(1, days_in_month + 1):
            target_date = date(today.year, today.month, day)
            day_label = str(day)
            formatted = target_date.strftime("%d %b")
            cnt = sum(1 for a in apps if a.date_applied == target_date) if target_date <= today else 0
            trends.append(MonthlyTrend(
                month=day_label,
                count=cnt,
                label=formatted,
                formatted_label=formatted
            ))

        return trends
