import React from 'react';
import { AvatarFrameConfig, CADRE_EMBLEMS } from '../../data/frameData';

interface AvatarFrameProps {
  frame?: AvatarFrameConfig;
  cadreRole?: string; // 'LT', 'BT', 'LP_HT', 'LP_LD', 'TT_1', 'TT_2', 'TT_3', 'TT_4'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
  children: React.ReactNode;
}

const SIZE_STYLES = {
  xs: {
    container: 'w-7 h-7',
    badge: 'text-[9px] -bottom-1 px-1 py-0',
    cadre: 'w-3.5 h-3.5 text-[8px] -top-1 -right-1',
  },
  sm: {
    container: 'w-9 h-9',
    badge: 'text-[10px] -bottom-1.5 px-1.5 py-0.5',
    cadre: 'w-4 h-4 text-[9px] -top-1 -right-1',
  },
  md: {
    container: 'w-12 h-12',
    badge: 'text-[10px] -bottom-2 px-2 py-0.5',
    cadre: 'w-5 h-5 text-[10px] -top-1.5 -right-1.5',
  },
  lg: {
    container: 'w-16 h-16',
    badge: 'text-xs -bottom-2.5 px-2.5 py-0.5 font-bold',
    cadre: 'w-6 h-6 text-xs -top-2 -right-2',
  },
  xl: {
    container: 'w-24 h-24',
    badge: 'text-xs -bottom-3 px-3 py-1 font-bold',
    cadre: 'w-8 h-8 text-base -top-2.5 -right-2.5',
  },
};

export const AvatarFrame: React.FC<AvatarFrameProps> = ({
  frame,
  cadreRole,
  size = 'md',
  className = '',
  children,
}) => {
  const styles = SIZE_STYLES[size];
  const cadreConfig = cadreRole ? CADRE_EMBLEMS[cadreRole] : undefined;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${styles.container} ${className}`}>
      {/* Background glow when framed */}
      {frame && (
        <div
          className={`absolute -inset-1 rounded-full bg-gradient-to-tr ${frame.bgGlowClass} blur-xs opacity-75 pointer-events-none`}
        />
      )}

      {/* Sharp Border wrapper (colored ring without covering photo) */}
      <div
        className={`relative w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
          frame ? frame.borderClass : 'ring-1 ring-slate-200 dark:ring-slate-700'
        }`}
      >
        {children}
      </div>

      {/* Cadre corner emblem */}
      {cadreConfig && (
        <span
          title={`${cadreConfig.name} (${cadreConfig.shortLabel})`}
          className={`absolute z-10 flex items-center justify-center rounded-full border border-white dark:border-slate-900 shadow-md ${styles.cadre} ${cadreConfig.badgeClass}`}
        >
          {cadreConfig.icon}
        </span>
      )}
    </div>
  );
};
