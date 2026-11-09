import React from 'react';
import { RoleCode } from '../../types';
import { CADRE_ROLES_INFO } from '../../data/badgeData';

interface CadreBadgeProps {
  role: RoleCode;
  toTruongTo?: number;
  size?: 'sm' | 'md' | 'lg';
  showDuty?: boolean;
  onClick?: () => void;
}

export const CadreBadge: React.FC<CadreBadgeProps> = ({
  role,
  toTruongTo,
  size = 'md',
  showDuty = false,
  onClick
}) => {
  const info = CADRE_ROLES_INFO[role] || CADRE_ROLES_INFO.HS;
  const isCadre = role !== 'HS';

  const title = role === 'TT' && toTruongTo ? `Tổ trưởng Tổ ${toTruongTo}` : info.title;
  const badgeName = role === 'TT' && toTruongTo ? `Thủ Lĩnh Tổ ${toTruongTo}` : info.badgeName;

  if (size === 'sm') {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-transform ${
          onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        }`}
        style={{
          color: info.accentColor,
          backgroundColor: `${info.accentColor}18`,
          border: `1px solid ${info.accentColor}35`
        }}
        title={`${title} · ${badgeName}`}
      >
        <span>{info.shortEmoji}</span>
        <span>{title}</span>
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        onClick={onClick}
        className={`relative overflow-hidden p-3.5 rounded-2xl border transition-all ${
          info.borderTone
        } bg-gradient-to-br ${info.gradientBg} bg-surface ${
          onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0"
            style={{ backgroundColor: `${info.accentColor}25`, border: `1.5px solid ${info.accentColor}50` }}
          >
            {info.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {info.badgeLevel}
              </span>
            </div>
            <h4 className="text-base font-extrabold text-main truncate leading-tight mt-0.5">
              {badgeName}
            </h4>
            <p className="text-xs font-semibold" style={{ color: info.accentColor }}>
              {title}
            </p>
          </div>
        </div>

        {showDuty && (
          <div className="mt-3 pt-2.5 border-t border-token/60 space-y-1 text-xs">
            <div className="italic text-muted font-medium">"{info.motto}"</div>
            <div className="text-[11px] text-main opacity-90 leading-relaxed">
              <strong>Nhiệm vụ:</strong> {info.duty}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Medium (default)
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
        info.borderTone
      } ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
      style={{
        color: info.accentColor,
        backgroundColor: `${info.accentColor}15`
      }}
      title={`${title} - ${info.motto}`}
    >
      <span className="text-sm">{info.shortEmoji}</span>
      <span>{badgeName}</span>
      <span className="text-[10px] opacity-75 font-medium">({title})</span>
    </div>
  );
};
