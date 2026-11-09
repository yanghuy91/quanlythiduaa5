import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  LogOut, 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  Calendar, 
  GraduationCap, 
  Check, 
  Camera,
  Activity,
  Layers,
  Edit3
} from 'lucide-react';
import { Student, RoleCode } from '../../types';
import { ROLE_CONFIG } from '../../data/mockData';
import { getStudentAvatarInitial } from '../../utils/vietnamese';
import { Logo10A5 } from './Logo10A5';

interface HeaderProps {
  currentUser: Student | { hoTen: string; vaiTro: RoleCode[]; avatarUrl?: string; statusText?: string } | null;
  currentRole: RoleCode;
  onLogout: () => void;
  currentWeek: number;
  onChangeCurrentWeek?: (week: number) => void;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onOpenCallingGames?: () => void;
  onOpenTeacherAvatar?: () => void;
  onOpenStudentAvatar?: () => void;
  onOpenTeacherProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onLogout,
  currentWeek,
  onChangeCurrentWeek,
  theme,
  onThemeChange,
  onOpenCallingGames,
  onOpenTeacherAvatar,
  onOpenStudentAvatar,
  onOpenTeacherProfile,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const roleInfo = ROLE_CONFIG[currentRole] || ROLE_CONFIG.HS;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-token shadow-xs transition-colors">
      {/* Top Edge Multi-color Luminous Accent Line */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-amber-400 via-indigo-500 via-purple-500 to-rose-500 shadow-xs" />

      {/* Main Unified Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Left Side: Modern 3D Logo & App Title Lockup */}
        <div className="flex items-center gap-3 min-w-0">
          {/* 3D Luxury Crest Emblem */}
          <Logo10A5 size="md" animate={false} />

          <div className="flex flex-col min-w-0">
            {/* Upper Title Line: Class Name & Module Title */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent select-none drop-shadow-xs">
                LỚP 10A5
              </span>
              <span className="h-3.5 w-px bg-token/80 hidden xs:inline-block" />
              <h1 className="text-xs sm:text-sm font-extrabold text-main tracking-tight select-none">
                Quản Lý Nề Nếp &amp; Thi Đua
              </h1>
            </div>

            {/* Lower Meta Line: School info, Live status, Week Selector */}
            <div className="flex items-center gap-2 text-xs text-muted font-medium flex-wrap mt-0.5">
              <span className="text-[11px] font-semibold text-muted hidden md:inline">
                THPT Số 2 Đức Phổ
              </span>
              <span className="text-muted/40 hidden md:inline">•</span>

              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="hidden sm:inline">Trực tuyến</span>
              </span>

              <span className="text-muted/40">•</span>

              {/* Interactive Week Capsule Selector */}
              <div className="relative inline-flex items-center">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-token hover:border-accent text-accent font-extrabold text-[11px] shadow-2xs transition-all cursor-pointer">
                  <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                  {onChangeCurrentWeek ? (
                    <select
                      value={currentWeek}
                      onChange={e => onChangeCurrentWeek(Number(e.target.value))}
                      className="bg-transparent text-main font-bold cursor-pointer focus:outline-none pr-1"
                      title="Chạm để chuyển tuần học của lớp"
                    >
                      {Array.from({ length: 38 }, (_, i) => i + 1).map(w => (
                        <option key={w} value={w} className="bg-white dark:bg-slate-900 text-main font-semibold">
                          Tuần {w} {w <= 19 ? '(HK1)' : '(HK2)'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>Tuần {currentWeek}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Calling Games, Theme & Profile Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

          {/* 10 Calling Games Quick Button (Teacher Only) */}
          {onOpenCallingGames && currentRole === 'GV' && (
            <button
              type="button"
              onClick={onOpenCallingGames}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group"
              title="Mở 10 trò chơi gọi học sinh lên bảng đang hot"
            >
              <span className="text-sm transition-transform group-hover:rotate-12">🎲</span>
              <span className="hidden sm:inline">10 Trò Gọi Bảng</span>
              <span className="sm:hidden">Trò chơi</span>
              <span className="hidden md:inline-block text-[9px] bg-black/25 px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider">
                HOT
              </span>
            </button>
          )}

          {/* Theme Switcher Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-xl border border-token text-muted hover:text-main hover:bg-surface-2 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Đổi giao diện Sáng / Tối / Hệ thống"
              aria-label="Đổi giao diện Sáng / Tối / Hệ thống"
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Monitor className="w-4 h-4 text-accent" />
              )}
            </button>

            {showThemeMenu && (
              <div 
                className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl py-1 z-50 text-xs animate-scale-up"
                onClick={() => setShowThemeMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-token/60 bg-slate-50 dark:bg-slate-800 rounded-t-xl">
                  Giao diện
                </div>
                <button
                  type="button"
                  onClick={() => onThemeChange('light')}
                  className={`w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center justify-between transition-colors ${
                    theme === 'light' ? 'font-bold text-accent bg-accent/5' : 'text-main'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sáng</span>
                  </div>
                  {theme === 'light' && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
                <button
                  type="button"
                  onClick={() => onThemeChange('dark')}
                  className={`w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center justify-between transition-colors ${
                    theme === 'dark' ? 'font-bold text-accent bg-accent/5' : 'text-main'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tối</span>
                  </div>
                  {theme === 'dark' && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
                <button
                  type="button"
                  onClick={() => onThemeChange('system')}
                  className={`w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center justify-between transition-colors ${
                    theme === 'system' ? 'font-bold text-accent bg-accent/5' : 'text-main'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-accent" />
                    <span>Hệ thống</span>
                  </div>
                  {theme === 'system' && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
              </div>
            )}
          </div>

          {/* Current User Badge & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-1 border-l border-token/70">
              {/* User Avatar thumbnail with subtle ring - click to change avatar in ANY role */}
              <button
                type="button"
                onClick={() => {
                  if (currentRole === 'GV') {
                    onOpenTeacherAvatar?.();
                  } else {
                    onOpenStudentAvatar?.();
                  }
                }}
                className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full overflow-hidden border-2 border-token/80 bg-surface-2 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-token group cursor-pointer hover:ring-2 hover:ring-accent transition-all active:scale-95"
                title={`Bấm để đổi ảnh đại diện ${currentRole === 'GV' ? 'Giáo viên' : 'Học sinh'} (chọn từ kho ảnh hoặc tải ảnh lên)`}
              >
                {'avatarUrl' in currentUser && (currentUser as Student).avatarUrl ? (
                  <img
                    src={(currentUser as Student).avatarUrl}
                    alt={currentUser.hoTen}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-black text-accent">
                    {getStudentAvatarInitial(currentUser.hoTen)}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px]">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </button>

              <div 
                className="hidden md:flex flex-col items-start leading-tight cursor-pointer group"
                onClick={() => {
                  if (currentRole === 'GV') {
                    onOpenTeacherProfile ? onOpenTeacherProfile() : onOpenTeacherAvatar?.();
                  } else {
                    onOpenStudentAvatar?.();
                  }
                }}
                title={currentRole === 'GV' ? 'Bấm để đổi tên, trạng thái và ảnh đại diện Thầy' : 'Bấm để đổi ảnh đại diện'}
              >
                <span className="text-xs font-bold text-main truncate max-w-[140px] group-hover:text-accent transition-colors flex items-center gap-1">
                  <span>{currentUser.hoTen}</span>
                  <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-accent transition-opacity" />
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span 
                    className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md leading-tight shadow-2xs"
                    style={{ color: roleInfo.fg, backgroundColor: roleInfo.bg }}
                  >
                    {roleInfo.label}
                  </span>
                  {currentRole === 'GV' && 'statusText' in currentUser && currentUser.statusText && (
                    <span className="text-[10px] text-muted truncate max-w-[130px] font-medium hidden lg:inline" title={currentUser.statusText}>
                      • {currentUser.statusText}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 hover:border-rose-400 font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Đăng xuất khỏi hệ thống"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-300 shrink-0" />
                <span className="text-xs font-bold whitespace-nowrap">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
