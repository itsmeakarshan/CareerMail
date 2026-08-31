namespace CareerMail.Api.Services.JobProviders;

public class AggregatorJobProvider : IJobProvider
{
    public string ProviderName => "Global Aggregator Feed";

    public Task<List<JobListingDto>> FetchJobsAsync(string? query, string? location, string? workMode)
    {
        var catalog = new List<JobListingDto>
        {
            // 🎓 Graduate & Entry Level (0-1 Years Experience) Roles
            new JobListingDto
            {
                Id = "agg_grad_101",
                Title = "Graduate Software Engineer (0-1 Years Exp)",
                Company = "Google",
                CompanyDomain = "google.com",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=google.com&sz=128",
                Location = "London, United Kingdom",
                Country = "United Kingdom",
                City = "London",
                WorkMode = "HYBRID",
                EmploymentType = "Full-time",
                ExperienceLevel = "Entry Level",
                Salary = "£65,000 - £85,000 / year",
                Description = "Join Google's graduate engineering cohort in London. Designed specifically for new graduates and early-career developers (0-1 years experience) with skills in Python, C#, Java, React, SQL, and distributed systems.",
                Url = "https://careers.google.com",
                PostedDate = "2 hours ago",
                Source = "Google Graduate Careers",
                SourceJobId = "google_grad_101",
                Skills = new List<string> { "Python", "C#", "JavaScript", "SQL", "Git", "Algorithms", "Data Structures" }
            },
            new JobListingDto
            {
                Id = "agg_grad_102",
                Title = "Graduate Data Scientist & ML Associate",
                Company = "DeepMind",
                CompanyDomain = "deepmind.google",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=deepmind.google&sz=128",
                Location = "London, United Kingdom",
                Country = "United Kingdom",
                City = "London",
                WorkMode = "ONSITE",
                EmploymentType = "Full-time",
                ExperienceLevel = "Entry Level",
                Salary = "£70,000 - £95,000 / year",
                Description = "Exciting entry-level data scientist opportunity in London for graduates (0-1 years exp) passionate about frontier AI, neural networks, Python, PyTorch, SQL, and data analytics pipelines.",
                Url = "https://deepmind.google/careers",
                PostedDate = "3 hours ago",
                Source = "DeepMind Careers",
                SourceJobId = "deepmind_102",
                Skills = new List<string> { "Python", "Data Science", "Machine Learning", "SQL", "Git", "PyTorch" }
            },
            new JobListingDto
            {
                Id = "agg_grad_103",
                Title = "Junior C# .NET Developer (Graduate Welcome)",
                Company = "Bloomberg",
                CompanyDomain = "bloomberg.com",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=bloomberg.com&sz=128",
                Location = "London, United Kingdom",
                Country = "United Kingdom",
                City = "London",
                WorkMode = "HYBRID",
                EmploymentType = "Full-time",
                ExperienceLevel = "Entry Level",
                Salary = "£60,000 - £78,000 / year",
                Description = "Bloomberg London is hiring Junior & Graduate C# .NET Developers (0-1 years exp) to engineer low-latency real-time market data pipelines and financial tools.",
                Url = "https://bloomberg.com/careers",
                PostedDate = "5 hours ago",
                Source = "Bloomberg Careers",
                SourceJobId = "bloomberg_grad_103",
                Skills = new List<string> { "C#", ".NET", "SQL", "PostgreSQL", "REST API", "Git", "Unit Testing" }
            },
            new JobListingDto
            {
                Id = "agg_grad_104",
                Title = "Graduate Full Stack Developer (React & Node)",
                Company = "BBC",
                CompanyDomain = "bbc.co.uk",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=bbc.co.uk&sz=128",
                Location = "Manchester, United Kingdom",
                Country = "United Kingdom",
                City = "Manchester",
                WorkMode = "HYBRID",
                EmploymentType = "Full-time",
                ExperienceLevel = "Entry Level",
                Salary = "£38,000 - £52,000 / year",
                Description = "The BBC graduate engineering programme in MediaCityUK Manchester is welcoming new grads (0-1 years exp) to work on BBC iPlayer, web applications with React, TypeScript, and modern APIs.",
                Url = "https://bbc.co.uk/careers",
                PostedDate = "1 day ago",
                Source = "BBC Early Careers",
                SourceJobId = "bbc_grad_104",
                Skills = new List<string> { "React", "TypeScript", "JavaScript", "HTML", "CSS", "REST API", "Git" }
            },
            new JobListingDto
            {
                Id = "agg_grad_105",
                Title = "Junior Cloud & DevOps Associate (0-1 Years)",
                Company = "Cloudflare",
                CompanyDomain = "cloudflare.com",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=cloudflare.com&sz=128",
                Location = "Remote, United Kingdom",
                Country = "United Kingdom",
                City = "Remote",
                WorkMode = "REMOTE",
                EmploymentType = "Full-time",
                ExperienceLevel = "Entry Level",
                Salary = "£45,000 - £60,000 / year",
                Description = "Cloudflare is seeking an Entry-level / Junior Cloud & DevOps Associate in the UK. Great training program for candidates with 0-1 years of experience in Linux, Docker, AWS/GCP, and CI/CD automation.",
                Url = "https://cloudflare.com/careers",
                PostedDate = "1 day ago",
                Source = "Cloudflare Careers",
                SourceJobId = "cloudflare_grad_105",
                Skills = new List<string> { "Linux", "Docker", "AWS", "Git", "CI/CD", "DevOps" }
            },

            // 💼 Mid & Senior Level Roles
            new JobListingDto
            {
                Id = "agg_101",
                Title = "Senior C# .NET Core Engineer",
                Company = "Monzo Bank",
                CompanyDomain = "monzo.com",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=monzo.com&sz=128",
                Location = "London, United Kingdom",
                Country = "United Kingdom",
                City = "London",
                WorkMode = "HYBRID",
                EmploymentType = "Full-time",
                ExperienceLevel = "Senior Level",
                Salary = "£85,000 - £110,000 / year",
                Description = "Join Monzo's backend team in London building high-throughput C# .NET Core microservices, distributed banking systems, and PostgreSQL data stores.",
                Url = "https://monzo.com/careers",
                PostedDate = "1 day ago",
                Source = "Monzo Careers",
                SourceJobId = "monzo_101",
                Skills = new List<string> { "C#", ".NET", "PostgreSQL", "Docker", "Kubernetes", "Microservices", "REST API", "Git" }
            },
            new JobListingDto
            {
                Id = "agg_103",
                Title = "Full Stack React & C# Developer",
                Company = "Auto Trader UK",
                CompanyDomain = "autotrader.co.uk",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=autotrader.co.uk&sz=128",
                Location = "Manchester, United Kingdom",
                Country = "United Kingdom",
                City = "Manchester",
                WorkMode = "HYBRID",
                EmploymentType = "Full-time",
                ExperienceLevel = "Mid Level",
                Salary = "£60,000 - £75,000 / year",
                Description = "Auto Trader is looking for a C# and React full stack developer in Manchester to build high performance web applications and consumer features.",
                Url = "https://autotrader.co.uk/careers",
                PostedDate = "2 days ago",
                Source = "Auto Trader",
                SourceJobId = "autotrader_103",
                Skills = new List<string> { "React", "TypeScript", "C#", ".NET", "SQL", "JavaScript", "HTML", "CSS" }
            },
            new JobListingDto
            {
                Id = "agg_104",
                Title = "Lead Data Engineer & Analytics Specialist",
                Company = "Revolut",
                CompanyDomain = "revolut.com",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=revolut.com&sz=128",
                Location = "London, United Kingdom",
                Country = "United Kingdom",
                City = "London",
                WorkMode = "HYBRID",
                EmploymentType = "Full-time",
                ExperienceLevel = "Senior Level",
                Salary = "£95,000 - £130,000 / year",
                Description = "Revolut is hiring a Lead Data Engineer in London to manage large-scale SQL data warehouses, BigQuery pipelines, Python ETLs, and analytics models.",
                Url = "https://revolut.com/careers",
                PostedDate = "4 hours ago",
                Source = "Revolut Careers",
                SourceJobId = "revolut_104",
                Skills = new List<string> { "Python", "SQL", "PostgreSQL", "Data Science", "DevOps", "AWS", "Docker" }
            },
            new JobListingDto
            {
                Id = "agg_105",
                Title = "Senior React & TypeScript Frontend Engineer",
                Company = "Spotify",
                CompanyDomain = "spotify.com",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=spotify.com&sz=128",
                Location = "Remote, United Kingdom",
                Country = "United Kingdom",
                City = "Remote",
                WorkMode = "REMOTE",
                EmploymentType = "Full-time",
                ExperienceLevel = "Senior Level",
                Salary = "£80,000 - £105,000 / year",
                Description = "Spotify is seeking a Remote Frontend Engineer in the UK to build dynamic web audio playback controls and responsive client UI using React and TypeScript.",
                Url = "https://spotify.com/careers",
                PostedDate = "1 day ago",
                Source = "Spotify Careers",
                SourceJobId = "spotify_105",
                Skills = new List<string> { "React", "TypeScript", "JavaScript", "HTML", "CSS", "Jest", "UI/UX", "Git" }
            },
            new JobListingDto
            {
                Id = "agg_106",
                Title = "Backend Platform Engineer (Go & PostgreSQL)",
                Company = "Deliveroo",
                CompanyDomain = "deliveroo.co.uk",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=deliveroo.co.uk&sz=128",
                Location = "London, United Kingdom",
                Country = "United Kingdom",
                City = "London",
                WorkMode = "HYBRID",
                EmploymentType = "Full-time",
                ExperienceLevel = "Mid Level",
                Salary = "£75,000 - £95,000 / year",
                Description = "Deliveroo is hiring a Backend Engineer in London to optimize high-throughput order dispatch services using Go, PostgreSQL, Redis, and Kafka.",
                Url = "https://deliveroo.co.uk/careers",
                PostedDate = "6 hours ago",
                Source = "Deliveroo Careers",
                SourceJobId = "deliveroo_106",
                Skills = new List<string> { "Go", "PostgreSQL", "Redis", "Docker", "Kubernetes", "Microservices", "REST API" }
            },
            new JobListingDto
            {
                Id = "agg_107",
                Title = "Machine Learning Infrastructure Engineer",
                Company = "Stripe",
                CompanyDomain = "stripe.com",
                CompanyLogoUrl = "https://www.google.com/s2/favicons?domain=stripe.com&sz=128",
                Location = "Remote, United Kingdom",
                Country = "United Kingdom",
                City = "Remote",
                WorkMode = "REMOTE",
                EmploymentType = "Full-time",
                ExperienceLevel = "Senior Level",
                Salary = "£100,000 - £140,000 / year",
                Description = "Stripe is looking for a Remote ML Infrastructure Engineer in the UK to build scalable distributed training and inference platforms for fraud prevention.",
                Url = "https://stripe.com/careers",
                PostedDate = "3 days ago",
                Source = "Stripe Careers",
                SourceJobId = "stripe_107",
                Skills = new List<string> { "Python", "Machine Learning", "PyTorch", "Kubernetes", "AWS", "Distributed Systems" }
            }
        };

        // Apply Location and Query Filtering
        var filtered = catalog.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(location))
        {
            string locLower = location.Trim().ToLowerInvariant();
            filtered = filtered.Where(j => j.Location.ToLowerInvariant().Contains(locLower) ||
                                           j.Country.ToLowerInvariant().Contains(locLower) ||
                                           j.City.ToLowerInvariant().Contains(locLower) ||
                                           (locLower.Contains("remote") && j.WorkMode == "REMOTE") ||
                                           (locLower.Contains("uk") && (j.Country == "United Kingdom" || j.Location.ToLowerInvariant().Contains("london") || j.Location.ToLowerInvariant().Contains("manchester"))));
        }

        if (!string.IsNullOrWhiteSpace(query))
        {
            string qLower = query.Trim().ToLowerInvariant();
            filtered = filtered.Where(j => j.Title.ToLowerInvariant().Contains(qLower) ||
                                           j.Company.ToLowerInvariant().Contains(qLower) ||
                                           j.Description.ToLowerInvariant().Contains(qLower) ||
                                           j.Skills.Any(s => s.ToLowerInvariant().Contains(qLower)));
        }

        return Task.FromResult(filtered.ToList());
    }
}
