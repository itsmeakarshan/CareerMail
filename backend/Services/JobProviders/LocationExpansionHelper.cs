namespace CareerMail.Api.Services.JobProviders;

public static class LocationExpansionHelper
{
    private static readonly HashSet<string> UkCities = new(StringComparer.OrdinalIgnoreCase)
    {
        "London",
        "Manchester",
        "Birmingham",
        "Bristol",
        "Leeds",
        "Edinburgh",
        "Cambridge",
        "Oxford",
        "Belfast",
        "Glasgow",
        "Newcastle",
        "Sheffield",
        "Cardiff",
        "Liverpool",
        "Nottingham",
        "Southampton",
        "Reading",
        "Brighton",
        "United Kingdom",
        "UK",
        "Great Britain",
        "England",
        "Scotland",
        "Wales",
        "Northern Ireland"
    };

    public static bool IsUkLocation(string? location)
    {
        if (string.IsNullOrWhiteSpace(location)) return false;
        string clean = location.ToLowerInvariant();

        if (clean.Contains("uk") || clean.Contains("united kingdom") || clean.Contains("great britain") || clean.Contains("england") || clean.Contains("scotland") || clean.Contains("wales"))
            return true;

        return UkCities.Any(city => clean.Contains(city.ToLowerInvariant()));
    }

    public static bool MatchesLocation(string? queryLocation, string? jobLocation, string? jobCountry, string? jobCity, string? workMode)
    {
        if (string.IsNullOrWhiteSpace(queryLocation) || queryLocation.Equals("Anywhere", StringComparison.OrdinalIgnoreCase) || queryLocation.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        string q = queryLocation.Trim().ToLowerInvariant();
        string jLoc = (jobLocation ?? "").ToLowerInvariant();
        string jCountry = (jobCountry ?? "").ToLowerInvariant();
        string jCity = (jobCity ?? "").ToLowerInvariant();
        string mode = (workMode ?? "").ToLowerInvariant();

        // If user is searching UK or United Kingdom
        if (q == "uk" || q == "united kingdom" || q == "great britain")
        {
            if (jCountry.Contains("united kingdom") || jCountry == "uk" || jCountry == "gb") return true;
            if (IsUkLocation(jLoc) || IsUkLocation(jCity)) return true;
            if (mode == "remote" && (jLoc.Contains("uk") || jLoc.Contains("europe") || jLoc.Contains("worldwide") || jLoc.Contains("anywhere"))) return true;
            return false;
        }

        // If user searched for Remote
        if (q == "remote")
        {
            return mode == "remote" || jLoc.Contains("remote");
        }

        // Direct matching on city, country, or location string
        if (jLoc.Contains(q) || jCountry.Contains(q) || jCity.Contains(q))
        {
            return true;
        }

        // UK cities alias matching
        if (IsUkLocation(q))
        {
            if (jLoc.Contains(q) || jCity.Contains(q)) return true;
            if (jCountry.Contains("united kingdom") && (jLoc.Contains(q) || mode == "remote")) return true;
        }

        return false;
    }
}
