import React from 'react';

interface CompanyLogoProps {
  company: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ company, className = '', size = 'md' }) => {
  const norm = (company || '').toLowerCase().trim();

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }[size];

  // Specific high-fidelity logos
  if (norm.includes('google')) {
    return (
      <div className={`${sizeClasses} bg-white rounded-xl p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes('revolut')) {
    return (
      <div className={`${sizeClasses} bg-black border border-slate-700 text-white rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 font-sans font-black text-sm tracking-tighter ${className}`}>
        R
      </div>
    );
  }

  if (norm.includes('mckinsey')) {
    return (
      <div className={`${sizeClasses} bg-[#051C2C] border border-blue-900/60 rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-serif font-black text-white text-[11px] tracking-tighter">McK</span>
      </div>
    );
  }

  if (norm.includes('huel')) {
    return (
      <div className={`${sizeClasses} bg-black border border-slate-700 rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-black text-white text-[10px] tracking-wider font-mono">HUEL</span>
      </div>
    );
  }

  if (norm.includes('learning curve') || norm.includes('learningcurve')) {
    return (
      <div className={`${sizeClasses} bg-[#582C83] rounded-xl p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-extrabold text-white text-[11px] tracking-tight">LCG</span>
      </div>
    );
  }

  if (norm.includes('oliver wyman')) {
    return (
      <div className={`${sizeClasses} bg-[#002D62] rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-serif font-black text-white text-[10px] tracking-tighter">OW</span>
      </div>
    );
  }

  if (norm.includes('abound')) {
    return (
      <div className={`${sizeClasses} bg-[#1D4ED8] rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-black text-white text-xs tracking-tight">ab</span>
      </div>
    );
  }

  if (norm.includes('playstation') || norm.includes('sony')) {
    return (
      <div className={`${sizeClasses} bg-[#003791] rounded-xl p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-black text-white text-xs tracking-tighter">PS</span>
      </div>
    );
  }

  if (norm.includes('pdi')) {
    return (
      <div className={`${sizeClasses} bg-[#042A2B] border border-cyan-700/60 rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-black text-[#54F2F2] text-[11px] tracking-tight">PDI</span>
      </div>
    );
  }

  if (norm.includes('knowbe4')) {
    return (
      <div className={`${sizeClasses} bg-[#0c1b33] border border-orange-500/40 rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-bold text-[#FF6A00] text-[10px] tracking-tight">KB4</span>
      </div>
    );
  }

  if (norm.includes('sparkbox')) {
    return (
      <div className={`${sizeClasses} bg-[#1a0f12] border border-rose-600/40 rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-extrabold text-[#FF453A] text-xs">SB</span>
      </div>
    );
  }

  if (norm.includes('chattermill')) {
    return (
      <div className={`${sizeClasses} bg-[#FF5A5F] rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-bold text-white text-xs">@</span>
      </div>
    );
  }

  if (norm.includes('sage')) {
    return (
      <div className={`${sizeClasses} bg-[#00D639] rounded-xl p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-bold text-black text-xs">sage</span>
      </div>
    );
  }

  if (norm.includes('stackadapt')) {
    return (
      <div className={`${sizeClasses} bg-[#0052FF] rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-black text-white text-[11px]">SA</span>
      </div>
    );
  }

  if (norm.includes('tesco')) {
    return (
      <div className={`${sizeClasses} bg-[#00539F] rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-black text-white text-[10px] tracking-wider font-sans">TESCO</span>
      </div>
    );
  }

  if (norm.includes('abound')) {
    return (
      <div className={`${sizeClasses} bg-gradient-to-tr from-violet-700 to-indigo-600 rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-black text-white text-xs">Ab</span>
      </div>
    );
  }

  if (norm.includes('lucideon')) {
    return (
      <div className={`${sizeClasses} bg-[#0E3A8A] rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-bold text-white text-xs">L</span>
      </div>
    );
  }

  if (norm.includes('conquer ai') || norm.includes('conquer')) {
    return (
      <div className={`${sizeClasses} bg-gradient-to-tr from-purple-700 to-pink-600 rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-bold text-white text-[10px]">AI</span>
      </div>
    );
  }

  if (norm.includes('tria')) {
    return (
      <div className={`${sizeClasses} bg-[#0A2540] border border-cyan-500/40 rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-black text-cyan-400 text-[10px]">TRIA</span>
      </div>
    );
  }

  if (norm.includes('spg')) {
    return (
      <div className={`${sizeClasses} bg-[#2D1B69] rounded-xl p-1 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <span className="font-black text-purple-300 text-[10px]">SPG</span>
      </div>
    );
  }

  if (norm.includes('microsoft')) {
    return (
      <div className={`${sizeClasses} bg-white rounded-xl p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
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
      <div className={`${sizeClasses} bg-white rounded-xl p-1.5 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="#111">
          <path d="M13.9 12.3c-.1-.7-.4-1.3-.9-1.7-.5-.4-1.1-.6-1.9-.6-1 0-1.8.3-2.3.9-.5.6-.8 1.4-.8 2.5 0 1 .3 1.8.8 2.4.5.6 1.3.9 2.2.9.9 0 1.6-.3 2.1-.8.5-.5.8-1.2.9-2.1v-1.5h-.1zm3.8 6.7h-3.3v-1.6c-.6.6-1.3 1.1-2 1.4-.8.3-1.6.5-2.6.5-1.7 0-3-.5-4.1-1.6-1-1-1.6-2.5-1.6-4.3 0-1.9.6-3.4 1.7-4.5 1.1-1.1 2.6-1.7 4.5-1.7 1.1 0 2 .2 2.8.6.8.4 1.3 1 1.7 1.6V7.4c0-1.4-.4-2.5-1.1-3.1-.8-.7-1.9-1-3.3-1-1.1 0-2.2.3-3.2.8-1 .5-1.7 1.2-2.1 2.2L1.8 4.7C2.5 3.3 3.6 2.2 5.1 1.4 6.6.6 8.4.2 10.5.2c2.4 0 4.2.6 5.5 1.7 1.3 1.1 1.9 2.8 1.9 5.1v12h-.2z"/>
          <path fill="#FF9900" d="M22.5 19.3c-2.3 1.6-5.2 2.5-8.6 2.5-4.4 0-8.2-1.6-11.2-4.4-.2-.2-.1-.5.2-.4 3.7 2.1 7.9 3.2 12.1 3.2 3.2 0 6.4-.8 9.2-2.3.4-.2.7.2.3.4z"/>
        </svg>
      </div>
    );
  }

  // Fallback stylish monogram badge
  const initials = (company || '?')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'JB';

  const colors = [
    'from-rose-500 to-pink-500',
    'from-pink-500 to-rose-400',
    'from-emerald-600 to-teal-700',
    'from-amber-500 to-orange-600',
    'from-rose-600 to-red-700',
    'from-cyan-600 to-blue-700',
  ];
  const charCode = (company || '').charCodeAt(0) || 0;
  const grad = colors[charCode % colors.length];

  return (
    <div className={`${sizeClasses} rounded-xl bg-gradient-to-br ${grad} text-white font-bold flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
};
