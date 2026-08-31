namespace CareerMail.Api.Services.JobProviders;

public interface IJobProvider
{
    string ProviderName { get; }
    Task<List<JobListingDto>> FetchJobsAsync(string? query, string? location, string? workMode);
}
