namespace CareerMail.Api.Services.Analyzer;

public interface IEmailAnalyzer
{
    AnalysisResult Analyze(string? subject, string? body, string? sender, string? senderEmail);
}
