import React from 'react';
import { RoleCode } from '../../types';
import { ROLE_CONFIG } from '../../data/mockData';

interface RecorderBadgeProps {
  vaiTro: RoleCode;
  nguoiGhi: string;
  size?: 'xs' | 'sm' | 'md';
}

export const RecorderBadge: React.FC<RecorderBadgeProps> = ({
  vaiTro,
  nguoiGhi,
  size = 'md',
}) => {
  const config = ROLE_CONFIG[vaiTro] || ROLE_CONFIG.HS;

  const icon = 
    vaiTro === 'GV' ? '👨‍🏫' :
    vaiTro === 'LT' ? '👑' :
    vaiTro === 'BT' ? '🚩' :
    vaiTro === 'LP_HT' ? '📖' :
    vaiTro === 'LP_LD' ? '⚡' :
    vaiTro === 'TT' ? '🛡️' : '👤';

  if (size === 'xs') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shadow-2xs"
        style={{
          color: config.fg,
          backgroundColor: config.bg,
          borderColor: `${config.fg}35`,
        }}
        title={`Người ghi: ${nguoiGhi} (${config.label})`}
      >
        <span>{icon}</span>
        <span className="font-extrabold">{config.short}:</span>
        <span className="truncate max-w-[90px]">{nguoiGhi}</span>
      </span>
    );
  }

  if (size === 'sm') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border shadow-2xs"
        style={{
          color: config.fg,
          backgroundColor: config.bg,
          borderColor: `${config.fg}35`,
        }}
        title={`Người phê bình: ${nguoiGhi} (${config.label})`}
      >
        <span>{icon}</span>
        <span className="font-extrabold">[{config.short}]</span>
        <span className="font-semibold">{nguoiGhi}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs"
      style={{
        color: config.fg,
        backgroundColor: config.bg,
        borderColor: `${config.fg}40`,
      }}
      title={`Người phê bình vi phạm: ${nguoiGhi} - Vai trò: ${config.label}`}
    >
      <span>{icon}</span>
      <span className="font-extrabold">{config.label}:</span>
      <span className="font-semibold">{nguoiGhi}</span>
    </span>
  );
};
