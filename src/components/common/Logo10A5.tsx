import React from 'react';
import logo3dImg from '../../assets/logo_10a5_3d.png';

interface Logo10A5Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

export const Logo10A5: React.FC<Logo10A5Props> = ({
  size = 'md',
  showText = false,
  className = '',
  animate = false,
}) => {
  const sizeMap = {
    sm: { box: 'w-9 h-9', imgSize: 36, textClass: 'text-xs' },
    md: { box: 'w-11 h-11', imgSize: 44, textClass: 'text-sm' },
    lg: { box: 'w-14 h-14', imgSize: 56, textClass: 'text-base' },
    xl: { box: 'w-20 h-20', imgSize: 80, textClass: 'text-lg' },
  };

  const { box, textClass } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* 3D Modern Luxury Shield Emblem */}
      <div 
        className={`relative shrink-0 flex items-center justify-center group cursor-pointer transition-all duration-300 hover:scale-105 ${box} ${
          animate ? 'animate-bounce-subtle' : ''
        }`}
      >
        {/* Ambient Pulsing Glow behind the crest */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-500 to-pink-500 blur-[8px] opacity-50 group-hover:opacity-90 group-hover:blur-[10px] transition-all duration-500 animate-pulse" />

        {/* 3D Emblem Container with Glass & Gold Border */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden p-0.5 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-md ring-1 ring-white/30">
          <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-950 relative flex items-center justify-center">
            {/* The 3D Illustrated Mascot/Emblem */}
            <img
              src={logo3dImg}
              alt="Logo 10A5"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Subtle Glass Glare Sweep */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Optional Integrated Text Label */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-black tracking-tight leading-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent ${textClass}`}>
              LỚP 10A5
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs">
              2026-2027
            </span>
          </div>
          <span className="text-[11px] font-semibold text-muted leading-tight mt-0.5 truncate">
            THPT Số 2 Đức Phổ · Kỷ Cương & Thi Đua
          </span>
        </div>
      )}
    </div>
  );
};
