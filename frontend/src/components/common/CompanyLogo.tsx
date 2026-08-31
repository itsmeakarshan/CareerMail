import React, { useState, useEffect } from 'react';

interface CompanyLogoProps {
  company: string;
  domain?: string;
  logoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  sizeClassName?: string;
  className?: string;
}

// Curated high-res SVG vector icons for well-known tech employers
const BRAND_SVG_MAP: Record<string, string> = {
  google: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
  deepmind: 'https://www.google.com/s2/favicons?domain=deepmind.google&sz=128',
  bloomberg: 'https://www.google.com/s2/favicons?domain=bloomberg.com&sz=128',
  bbc: 'https://www.google.com/s2/favicons?domain=bbc.co.uk&sz=128',
  monzo: 'https://www.google.com/s2/favicons?domain=monzo.com&sz=128',
  revolut: 'https://www.google.com/s2/favicons?domain=revolut.com&sz=128',
  spotify: 'https://www.google.com/s2/favicons?domain=spotify.com&sz=128',
  cloudflare: 'https://www.google.com/s2/favicons?domain=cloudflare.com&sz=128',
  deliveroo: 'https://www.google.com/s2/favicons?domain=deliveroo.co.uk&sz=128',
  stripe: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=128',
  autotrader: 'https://www.google.com/s2/favicons?domain=autotrader.co.uk&sz=128',
  amazon: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128',
  microsoft: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128',
  apple: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128',
  meta: 'https://www.google.com/s2/favicons?domain=meta.com&sz=128',
  netflix: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=128',
  gitlab: 'https://www.google.com/s2/favicons?domain=gitlab.com&sz=128',
  vercel: 'https://www.google.com/s2/favicons?domain=vercel.com&sz=128',
  supabase: 'https://www.google.com/s2/favicons?domain=supabase.com&sz=128',
};

export const inferCompanyDomain = (companyName: string, explicitDomain?: string): string => {
  if (explicitDomain && explicitDomain.trim()) return explicitDomain.trim().toLowerCase();
  if (!companyName) return 'company.com';

  const clean = companyName.toLowerCase().trim();
  if (clean.includes('google')) return 'google.com';
  if (clean.includes('deepmind')) return 'deepmind.google';
  if (clean.includes('bloomberg')) return 'bloomberg.com';
  if (clean.includes('bbc')) return 'bbc.co.uk';
  if (clean.includes('monzo')) return 'monzo.com';
  if (clean.includes('revolut')) return 'revolut.com';
  if (clean.includes('spotify')) return 'spotify.com';
  if (clean.includes('cloudflare')) return 'cloudflare.com';
  if (clean.includes('deliveroo')) return 'deliveroo.co.uk';
  if (clean.includes('stripe')) return 'stripe.com';
  if (clean.includes('autotrader') || clean.includes('auto trader')) return 'autotrader.co.uk';
  if (clean.includes('amazon')) return 'amazon.com';
  if (clean.includes('microsoft')) return 'microsoft.com';
  if (clean.includes('apple')) return 'apple.com';
  if (clean.includes('meta')) return 'meta.com';
  if (clean.includes('netflix')) return 'netflix.com';
  if (clean.includes('gitlab')) return 'gitlab.com';
  if (clean.includes('vercel')) return 'vercel.com';
  if (clean.includes('supabase')) return 'supabase.com';

  const slug = clean.replace(/[^a-z0-9]/g, '');
  return slug ? `${slug}.com` : 'company.com';
};

const getSizeClass = (size?: string, sizeClassName?: string): string => {
  if (sizeClassName) return sizeClassName;
  switch (size) {
    case 'xs':
      return 'w-6 h-6 text-[10px] rounded-lg';
    case 'sm':
      return 'w-8 h-8 text-xs rounded-xl';
    case 'md':
      return 'w-10 h-10 text-sm rounded-xl';
    case 'lg':
      return 'w-12 h-12 text-base rounded-2xl';
    case 'xl':
    default:
      return 'w-14 h-14 text-lg rounded-2xl';
  }
};

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  company,
  domain,
  logoUrl,
  size = 'xl',
  sizeClassName,
  className = ''
}) => {
  const cleanDomain = inferCompanyDomain(company, domain);
  const companyKey = (company || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Build ordered list of candidate URLs
  const candidateUrls: string[] = [];

  // Check static brand map first
  for (const [k, url] of Object.entries(BRAND_SVG_MAP)) {
    if (companyKey.includes(k)) {
      candidateUrls.push(url);
      break;
    }
  }

  // Next: direct logoUrl if valid (and not clearbit which is deprecated)
  if (logoUrl && !logoUrl.includes('logo.clearbit.com')) {
    candidateUrls.push(logoUrl);
  }

  // Next: Google High-Res Favicon (128px)
  candidateUrls.push(`https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`);

  // Next: Unavatar
  candidateUrls.push(`https://unavatar.io/${cleanDomain}`);

  // Next: Icon Horse
  candidateUrls.push(`https://icon.horse/icon/${cleanDomain}`);

  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [hasFailedAll, setHasFailedAll] = useState<boolean>(false);

  // Reset if company or domain changes
  useEffect(() => {
    setCandidateIndex(0);
    setHasFailedAll(false);
  }, [company, domain, logoUrl]);

  const handleImgError = () => {
    if (candidateIndex < candidateUrls.length - 1) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const initial = company && company.trim().length > 0
    ? company.trim().charAt(0).toUpperCase()
    : 'C';

  const containerSizeClass = getSizeClass(size, sizeClassName);

  return (
    <div
      className={`${containerSizeClass} bg-white dark:bg-[#202227] border border-slate-200 dark:border-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs relative p-1.5 transition-all ${className}`}
    >
      {!hasFailedAll && candidateUrls[candidateIndex] ? (
        <img
          src={candidateUrls[candidateIndex]}
          alt={`${company} logo`}
          onError={handleImgError}
          loading="lazy"
          className="w-full h-full object-contain rounded-lg"
        />
      ) : (
        <div className="w-full h-full rounded-lg bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-white font-black shadow-inner">
          {initial}
        </div>
      )}
    </div>
  );
};
