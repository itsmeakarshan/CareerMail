import React from 'react';

interface CompanyLogoProps {
  company: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ company, className = '', size = 'md' }) => {
  const norm = company.toLowerCase().trim();

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }[size];

  // Render high-fidelity SVG logos matching dashboard.png
  if (norm.includes('google')) {
    return (
      <div className={`${sizeClasses} bg-white rounded-lg p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes('microsoft')) {
    return (
      <div className={`${sizeClasses} bg-white rounded-lg p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <rect fill="#F25022" x="1" y="1" width="10" height="10"/>
          <rect fill="#7FBA00" x="13" y="1" width="10" height="10"/>
          <rect fill="#00A4EF" x="1" y="13" width="10" height="10"/>
          <rect fill="#FFB900" x="13" y="13" width="10" height="10"/>
        </svg>
      </div>
    );
  }

  if (norm.includes('amazon')) {
    return (
      <div className={`${sizeClasses} bg-white rounded-lg p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="#111">
          <path d="M13.9 12.3c-.1-.7-.4-1.3-.9-1.7-.5-.4-1.1-.6-1.9-.6-1 0-1.8.3-2.3.9-.5.6-.8 1.4-.8 2.5 0 1 .3 1.8.8 2.4.5.6 1.3.9 2.2.9.9 0 1.6-.3 2.1-.8.5-.5.8-1.2.9-2.1v-1.5h-.1zm3.8 6.7h-3.3v-1.6c-.6.6-1.3 1.1-2 1.4-.8.3-1.6.5-2.6.5-1.7 0-3-.5-4.1-1.6-1-1-1.6-2.5-1.6-4.3 0-1.9.6-3.4 1.7-4.5 1.1-1.1 2.6-1.7 4.5-1.7 1.1 0 2 .2 2.8.6.8.4 1.3 1 1.7 1.6V7.4c0-1.4-.4-2.5-1.1-3.1-.8-.7-1.9-1-3.3-1-1.1 0-2.2.3-3.2.8-1 .5-1.7 1.2-2.1 2.2L1.8 4.7C2.5 3.3 3.6 2.2 5.1 1.4 6.6.6 8.4.2 10.5.2c2.4 0 4.2.6 5.5 1.7 1.3 1.1 1.9 2.8 1.9 5.1v12h-.2z"/>
          <path fill="#FF9900" d="M22.5 19.3c-2.3 1.6-5.2 2.5-8.6 2.5-4.4 0-8.2-1.6-11.2-4.4-.2-.2-.1-.5.2-.4 3.7 2.1 7.9 3.2 12.1 3.2 3.2 0 6.4-.8 9.2-2.3.4-.2.7.2.3.4z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes('capital one') || norm.includes('capitalone')) {
    return (
      <div className={`${sizeClasses} bg-[#101b33] rounded-lg p-1 flex items-center justify-center border border-slate-700/60 shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path fill="#D03027" d="M3 14.5c4-7 14-8 18-4-6 0-11 2-18 4z"/>
          <path fill="#004977" d="M4 16.5c3-1 12-2 17-7-4 6-12 8-17 7z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes('deloitte')) {
    return (
      <div className={`${sizeClasses} bg-[#111625] rounded-lg p-1 flex items-center justify-center border border-slate-700/60 shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-extrabold text-white text-base tracking-tighter">D<span className="text-[#86BC25] font-black">.</span></span>
      </div>
    );
  }

  if (norm.includes('zoho')) {
    return (
      <div className={`${sizeClasses} bg-white rounded-lg p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <div className="grid grid-cols-2 gap-0.5 w-full h-full p-0.5">
          <div className="bg-[#E42528] rounded-sm"></div>
          <div className="bg-[#218838] rounded-sm"></div>
          <div className="bg-[#0070BA] rounded-sm"></div>
          <div className="bg-[#F8A80D] rounded-sm"></div>
        </div>
      </div>
    );
  }

  if (norm.includes('jp morgan') || norm.includes('jpmorgan')) {
    return (
      <div className={`${sizeClasses} bg-[#fff8e7] rounded-lg p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-serif font-black text-[#2e1d0f] text-xs tracking-tight">JP</span>
      </div>
    );
  }

  if (norm.includes('salesforce')) {
    return (
      <div className={`${sizeClasses} bg-[#00A1E0] rounded-lg p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="white">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes('adobe')) {
    return (
      <div className={`${sizeClasses} bg-[#FA0F00] rounded-lg p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="white">
          <path d="M15.1 2H24v20L15.1 2zM8.9 2H0v20L8.9 2zM12 9.4l4.5 10.6h-3.1l-1.4-3.5H9.6L12 9.4z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes('meta') || norm.includes('facebook')) {
    return (
      <div className={`${sizeClasses} bg-white rounded-lg p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="#0081FB">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes('tesla')) {
    return (
      <div className={`${sizeClasses} bg-[#E82127] rounded-lg p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="white">
          <path d="M12 4.5c2.3 0 4.4.5 6.3 1.4l1.3-2.5C16.9 2.1 14.5 1.5 12 1.5S7.1 2.1 4.4 3.4L5.7 5.9c1.9-.9 4-1.4 6.3-1.4zm0 4.5c2.1 0 4.1.5 5.9 1.4l1.5-2.8C16.9 6.4 14.5 5.8 12 5.8S7.1 6.4 4.6 7.6l1.5 2.8c1.8-.9 3.8-1.4 5.9-1.4zm1.5 3.5V22h-3v-9.5c-1.8 0-3.5.4-5.1 1.2L4 11.2C6.4 9.8 9.1 9 12 9s5.6.8 8 2.2l-1.4 2.5c-1.6-.8-3.3-1.2-5.1-1.2z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes('apple')) {
    return (
      <div className={`${sizeClasses} bg-white dark:bg-slate-800 rounded-lg p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.79 1.06-1.88.94-2.97-.93.04-2.03.63-2.68 1.4-.58.68-1.09 1.77-.95 2.84 1.04.08 2.06-.51 2.69-1.27z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes('oracle')) {
    return (
      <div className={`${sizeClasses} bg-white rounded-lg p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="#F80000">
          <path d="M16.5 6h-9C4.5 6 2 8.7 2 12s2.5 6 5.5 6h9c3 0 5.5-2.7 5.5-6s-2.5-6-5.5-6zm-.2 9.5h-8.6C5.9 15.5 4.5 14 4.5 12s1.4-3.5 3.2-3.5h8.6c1.8 0 3.2 1.5 3.2 3.5s-1.4 3.5-3.2 3.5z"/>
        </svg>
      </div>
    );
  }

  // Fallback stylish monogram
  const initials = company
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const colors = [
    'from-blue-600 to-indigo-600',
    'from-purple-600 to-pink-600',
    'from-emerald-600 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-600 to-red-600',
    'from-cyan-600 to-blue-600',
  ];
  const charCode = company.charCodeAt(0) || 0;
  const grad = colors[charCode % colors.length];

  return (
    <div className={`${sizeClasses} rounded-lg bg-gradient-to-br ${grad} text-white font-bold flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
};
