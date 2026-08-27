package com.careermail.service.analyzer;

public interface EmailAnalyzer {
    AnalysisResult analyze(String subject, String body, String sender, String senderEmail);
}
