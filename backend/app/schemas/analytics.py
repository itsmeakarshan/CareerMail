from app.schemas.base import CamelModel


class MonthlyTrend(CamelModel):
    month: str
    count: int
    label: str | None = None
    formatted_label: str | None = None


class StatusDistribution(CamelModel):
    name: str
    status: str | None = None
    count: int
    percentage: int
    color: str


class AnalyticsResponse(CamelModel):
    total_applications: int
    interviews: int
    offers: int
    rejections: int
    response_rate: int

    this_month_applications: int
    this_month_interviews: int
    this_month_offers: int
    this_month_rejections: int
    this_month_response_rate_delta: int = 0

    applications_over_time: list[MonthlyTrend] = []
    last12_months_trends: list[MonthlyTrend] = []
    last6_months_trends: list[MonthlyTrend] = []
    last3_months_trends: list[MonthlyTrend] = []
    this_month_trends: list[MonthlyTrend] = []
    daily_trends_this_month: list[MonthlyTrend] = []
    daily_trends_last30_days: list[MonthlyTrend] = []
    daily_trends_last14_days: list[MonthlyTrend] = []
    daily_trends_last7_days: list[MonthlyTrend] = []

    application_status: list[StatusDistribution] = []
