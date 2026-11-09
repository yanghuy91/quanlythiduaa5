import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  LayoutGrid, 
  Trophy, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Award, 
  Flame, 
  Shield, 
  Star, 
  BookOpen, 
  Calendar, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Camera,
  ChevronLeft,
  Check,
  Lock,
  KeyRound,
  LogOut,
  Search,
  ArrowUpDown,
  Filter,
  TrendingDown,
  TrendingUp,
  Sparkle,
  GraduationCap
} from 'lucide-react';
import { 
  Student, 
  SeatLayoutNode, 
  DisciplineRecord, 
  StudentWeekSummary, 
  TeacherSettings,
  HierarchyPeriodFilter,
  StudentAcademicRecord
} from '../../types';
import { StudentGradeCard } from '../grades/StudentGradeCard';
import { SeatGrid } from '../student-picker/SeatGrid';
import { CadreBadge } from '../common/CadreBadge';
import { CadreHonorsModal } from '../common/CadreHonorsModal';
import { PeriodHierarchyFilter as PeriodFilterComponent } from '../common/PeriodHierarchyFilter';
import { filterRecordsByHierarchy, calculateStudentPeriodSummary, CURRENT_SCHOOL_YEAR } from '../../utils/hierarchy';
import { 
  AchievementBadge, 
  BadgeCategory, 
  getBadgeCatalog, 
  getStudentBadgesMap, 
  getStudentActiveBadge, 
  setStudentActiveBadge 
} from '../../data/badgeCatalog';
import { BadgeEmblem } from '../common/BadgeEmblem';
import { AvatarFrame } from '../common/AvatarFrame';
import { getFrameForStudent } from '../../data/frameData';
import { AvatarUploadModal } from '../common/AvatarUploadModal';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { getCadreBanner } from '../../data/cadreBanners';
import { getStudentAvatarInitial, removeVietnameseAccents } from '../../utils/vietnamese';

interface StudentViewProps {
  currentStudent: Student;
  allStudents: Student[];
  layout: SeatLayoutNode[];
  records: DisciplineRecord[];
  studentSummaries: Record<string, StudentWeekSummary>;
  currentWeek: number;
  settings: TeacherSettings;
  academicRecords?: StudentAcademicRecord[];
  onSubmitExplanation: (recordId: string, explanation: string) => void;
  onUpdateStudentAvatar?: (studentId: string, avatarUrl: string) => void;
  onLogout?: () => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  currentStudent,
  allStudents,
  layout,
  records,
  studentSummaries,
  currentWeek,
  settings,
  academicRecords,
  onSubmitExplanation,
  onUpdateStudentAvatar,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'my_score' | 'grades' | 'badges' | 'seating' | 'ranking'>('my_score');

  const myAcademicRecord = useMemo(() => {
    return (academicRecords || []).find(r => r.maHS === currentStudent.maHS);
  }, [academicRecords, currentStudent.maHS]);
  const [selectedRecordForExplanation, setSelectedRecordForExplanation] = useState<DisciplineRecord | null>(null);
  const [explanationText, setExplanationText] = useState('');
  const [showCadreModal, setShowCadreModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState<'all' | BadgeCategory>('all');

  // Sorting & Filtering State for Bảng Thi Đua / Emulation Overview
  type RankingSortOption = 'score_desc' | 'score_asc' | 'stt' | 'name_asc' | 'name_desc' | 'to';
  const [rankingSortBy, setRankingSortBy] = useState<RankingSortOption>('score_desc');
  const [rankingToFilter, setRankingToFilter] = useState<'all' | number>('all');
  const [rankingRatingFilter, setRankingRatingFilter] = useState<'all' | 'Tot' | 'Kha' | 'Dat' | 'CanCoGang'>('all');
  const [rankingSearchQuery, setRankingSearchQuery] = useState('');
  const [rankingOnlyMe, setRankingOnlyMe] = useState(false);

  // Active displayed achievement badge next to student avatar
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(() => {
    try {
      const active = getStudentActiveBadge(currentStudent.maHS);
      if (active) return active;
      const saved = localStorage.getItem(`student_active_badge_${currentStudent.maHS}`);
      if (saved) return saved;
      return 'b_iron_discipline'; // default badge if unlocked
    } catch {
      return null;
    }
  });

  const handleToggleBadge = (badgeId: string) => {
    setSelectedBadgeId(prev => {
      const next = prev === badgeId ? null : badgeId;
      setStudentActiveBadge(currentStudent.maHS, next);
      try {
        if (next) {
          localStorage.setItem(`student_active_badge_${currentStudent.maHS}`, next);
        } else {
          localStorage.removeItem(`student_active_badge_${currentStudent.maHS}`);
        }
      } catch {}
      return next;
    });
  };

  // Re-sync selected badge when student changes (e.g. demo role switcher or login)
  useEffect(() => {
    try {
      const active = getStudentActiveBadge(currentStudent.maHS);
      if (active) {
        setSelectedBadgeId(active);
        return;
      }
      const saved = localStorage.getItem(`student_active_badge_${currentStudent.maHS}`);
      if (saved) {
        setSelectedBadgeId(saved);
      } else {
        setSelectedBadgeId('b_iron_discipline');
      }
    } catch {
      setSelectedBadgeId('b_iron_discipline');
    }
  }, [currentStudent.maHS]);

  // Time hierarchy filter state: Năm học -> Học kì -> Tuần -> Buổi (Bỏ qua tháng)
  const [periodFilter, setPeriodFilter] = useState<HierarchyPeriodFilter>({
    namHoc: CURRENT_SCHOOL_YEAR,
    hocKi: 1,
    thang: 'all',
    tuanHoc: currentWeek,
    ngayHoc: 'all',
    buoi: 'all',
  });

  // Filtered records based on hierarchy filter
  const filteredRecords = useMemo(() => {
    return filterRecordsByHierarchy(records, periodFilter);
  }, [records, periodFilter]);

  // Hierarchical summary for all students and current student
  const studentPeriodSummaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateStudentPeriodSummary>> = {};
    allStudents.forEach(st => {
      map[st.maHS] = calculateStudentPeriodSummary(st, records, periodFilter, settings);
    });
    return map;
  }, [allStudents, records, periodFilter, settings]);

  const myPeriodSummary = studentPeriodSummaries[currentStudent.maHS] || {
    diemTrungBinh: settings.diemKhoiDau,
    tongDiemTru: 0,
    tongDiemCong: 0,
    soLoi: 0,
    xepLoai: 'Tot',
    mucMau: 'none',
    lichSuTuan: [],
  };

  // My summary for current week
  const myWeekSummary = studentSummaries[currentStudent.maHS] || {
    diemHienTai: settings.diemKhoiDau,
    tongDiemTru: 0,
    tongDiemCong: 0,
    xepLoai: 'Tot',
    mucMau: 'none',
    soLoiTrongTuan: 0,
    coLoiNang: false,
  };

  // My personal records in filtered period
  const myRecords = useMemo(() => {
    return filteredRecords
      .filter(r => r.maHS === currentStudent.maHS && r.trangThai !== 'DaHuy')
      .sort((a, b) => new Date(b.thoiGianMayChu).getTime() - new Date(a.thoiGianMayChu).getTime());
  }, [filteredRecords, currentStudent.maHS]);

  // 4 rows: Current week and 3 immediately adjacent weeks
  const fourRecentWeeks = useMemo(() => {
    const list: { week: number; isCurrent: boolean; label: string; offset: number }[] = [];
    if (currentWeek >= 4) {
      for (let i = 0; i < 4; i++) {
        const w = currentWeek - i;
        list.push({
          week: w,
          isCurrent: i === 0,
          offset: i,
          label: i === 0 ? 'Tuần này (Hiện tại)' : `${i} tuần trước`,
        });
      }
    } else {
      const order: number[] = [currentWeek];
      for (let w = currentWeek - 1; w >= 1; w--) order.push(w);
      for (let w = currentWeek + 1; order.length < 4 && w <= 38; w++) order.push(w);
      order.slice(0, 4).forEach((w) => {
        const diff = currentWeek - w;
        list.push({
          week: w,
          isCurrent: w === currentWeek,
          offset: diff,
          label: w === currentWeek ? 'Tuần này (Hiện tại)' : diff > 0 ? `${diff} tuần trước` : `Tuần ${w}`,
        });
      });
    }
    return list;
  }, [currentWeek]);

  // Expand state for 4 weekly rows (currentWeek expanded by default)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(() => new Set([currentWeek]));

  // Auto-include currentWeek if it changes
  useEffect(() => {
    setExpandedWeeks(prev => new Set([...prev, currentWeek]));
  }, [currentWeek]);

  const toggleWeekExpand = (w: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(w)) {
        next.delete(w);
      } else {
        next.add(w);
      }
      return next;
    });
  };

  const handleExpandAllWeeks = () => {
    setExpandedWeeks(new Set(fourRecentWeeks.map(w => w.week)));
  };

  const handleCollapseAllWeeks = () => {
    setExpandedWeeks(new Set());
  };

  // Pre-calculate weekly stats for each of the 4 rows
  const fourWeeksData = useMemo(() => {
    return fourRecentWeeks.map(item => {
      const wRecords = records
        .filter(r => r.maHS === currentStudent.maHS && r.tuanHoc === item.week && r.trangThai !== 'DaHuy')
        .sort((a, b) => new Date(b.thoiGianMayChu).getTime() - new Date(a.thoiGianMayChu).getTime());

      const effectiveRecords = wRecords.filter(r => r.trangThai !== 'DaChapNhan');
      const tongTru = effectiveRecords
        .filter(r => r.loaiDiem === 'Tru')
        .reduce((sum, r) => sum + r.diemSo, 0);
      const tongCong = settings.batDiemCong
        ? effectiveRecords.filter(r => r.loaiDiem === 'Cong').reduce((sum, r) => sum + r.diemSo, 0)
        : 0;
      const soLoi = effectiveRecords.filter(r => r.loaiDiem === 'Tru').length;
      const score = Math.max(0, settings.diemKhoiDau - tongTru + tongCong);

      let xepLoai: 'Tot' | 'Kha' | 'Dat' | 'CanCoGang' = 'Tot';
      if (score >= 90) xepLoai = 'Tot';
      else if (score >= 75) xepLoai = 'Kha';
      else if (score >= 60) xepLoai = 'Dat';
      else xepLoai = 'CanCoGang';

      return {
        ...item,
        records: wRecords,
        effectiveRecords,
        tongTru,
        tongCong,
        soLoi,
        score,
        xepLoai,
      };
    });
  }, [fourRecentWeeks, records, currentStudent.maHS, settings]);

  // Compute Unlocked Badges for current student from the 30-badge catalog
  const myBadges = useMemo(() => {
    const hasLate = myRecords.some(r => r.maNoiQuy === 'NQ01' || r.tenHanhVi.includes('muộn'));
    const hasStudyFault = myRecords.some(r => r.nhomHanhVi === 'Học tập');
    const hasSanitationFault = myRecords.some(r => r.nhomHanhVi === 'Lao động - Vệ sinh');
    const isGoodScore = myWeekSummary.diemHienTai >= 90;
    const isIronDiscipline = myWeekSummary.diemHienTai === 100 && myWeekSummary.soLoiTrongTuan === 0;

    const catalog = getBadgeCatalog();
    const studentBadgesMap = getStudentBadgesMap();
    const explicitlyAwarded = studentBadgesMap[currentStudent.maHS] || [];

    return catalog.map(badge => {
      let unlocked = explicitlyAwarded.includes(badge.id);

      // Automated criteria fallbacks
      if (!unlocked) {
        if (badge.id === 'b_iron_discipline') unlocked = isIronDiscipline;
        else if (badge.id === 'b_punctuality_hero') unlocked = !hasLate;
        else if (badge.id === 'b_neat_attire') unlocked = true;
        else if (badge.id === 'b_green_classroom') unlocked = !hasSanitationFault;
        else if (badge.id === 'b_orderly_desk') unlocked = true;
        else if (badge.id === 'b_diligent_quill') unlocked = !hasStudyFault;
        else if (badge.id === 'b_positive_energy') unlocked = isGoodScore;
        else if (badge.id === 'b_fitness_warrior') unlocked = true;
        else if (badge.id === 'b_golden_hands') unlocked = !hasSanitationFault;
      }

      return { ...badge, unlocked };
    });
  }, [myRecords, myWeekSummary, currentStudent.maHS]);

  // Active badge to display beside student Avatar
  const activeDisplayedBadge = useMemo(() => {
    if (!selectedBadgeId) return null;
    return myBadges.find(b => b.id === selectedBadgeId && b.unlocked) || null;
  }, [selectedBadgeId, myBadges]);

  // Class Individual Official Ranking (Fixed official rank based on score descending)
  const officialClassRankings = useMemo(() => {
    const list = allStudents.map(student => {
      const summary = studentPeriodSummaries[student.maHS] || {
        diemTrungBinh: settings.diemKhoiDau,
        tongDiemTru: 0,
        tongDiemCong: 0,
        xepLoai: 'Tot',
      };
      return {
        student,
        score: summary.diemTrungBinh,
        xepLoai: summary.xepLoai,
        deductions: summary.tongDiemTru,
        bonuses: summary.tongDiemCong,
      };
    });

    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.student.hoTen.localeCompare(b.student.hoTen, 'vi');
    });

    return list.map((item, idx) => ({
      ...item,
      officialRank: idx + 1,
    }));
  }, [allStudents, studentPeriodSummaries, settings.diemKhoiDau]);

  // Current Student Rank & Frame
  const myRank = useMemo(() => {
    const found = officialClassRankings.find(item => item.student.maHS === currentStudent.maHS);
    return found ? found.officialRank : 1;
  }, [officialClassRankings, currentStudent.maHS]);

  // Sorted and filtered rankings for user viewing
  const displayedRankings = useMemo(() => {
    let list = [...officialClassRankings];

    if (rankingOnlyMe) {
      return list.filter(item => item.student.maHS === currentStudent.maHS);
    }

    if (rankingToFilter !== 'all') {
      list = list.filter(item => item.student.to === rankingToFilter);
    }

    if (rankingRatingFilter !== 'all') {
      if (rankingRatingFilter === 'CanCoGang') {
        list = list.filter(item => item.xepLoai === 'KhongDat');
      } else {
        list = list.filter(item => item.xepLoai === rankingRatingFilter);
      }
    }

    if (rankingSearchQuery.trim()) {
      const q = removeVietnameseAccents(rankingSearchQuery.trim());
      list = list.filter(item => {
        const name = removeVietnameseAccents(item.student.hoTen);
        const shortName = removeVietnameseAccents(item.student.tenRutGon);
        const ma = item.student.maHS.toLowerCase();
        const stt = `${item.student.viTriGhe}`;
        return name.includes(q) || shortName.includes(q) || ma.includes(q) || stt === q;
      });
    }

    list.sort((a, b) => {
      switch (rankingSortBy) {
        case 'score_asc':
          if (a.score !== b.score) return a.score - b.score;
          return a.student.hoTen.localeCompare(b.student.hoTen, 'vi');
        case 'stt':
          return a.student.viTriGhe - b.student.viTriGhe;
        case 'name_asc': {
          const partsA = a.student.hoTen.trim().split(/\s+/);
          const partsB = b.student.hoTen.trim().split(/\s+/);
          const firstNameA = partsA[partsA.length - 1];
          const firstNameB = partsB[partsB.length - 1];
          const cmp = firstNameA.localeCompare(firstNameB, 'vi', { sensitivity: 'base' });
          if (cmp !== 0) return cmp;
          return a.student.hoTen.localeCompare(b.student.hoTen, 'vi', { sensitivity: 'base' });
        }
        case 'name_desc': {
          const partsA = a.student.hoTen.trim().split(/\s+/);
          const partsB = b.student.hoTen.trim().split(/\s+/);
          const firstNameA = partsA[partsA.length - 1];
          const firstNameB = partsB[partsB.length - 1];
          const cmp = firstNameB.localeCompare(firstNameA, 'vi', { sensitivity: 'base' });
          if (cmp !== 0) return cmp;
          return b.student.hoTen.localeCompare(a.student.hoTen, 'vi', { sensitivity: 'base' });
        }
        case 'to':
          if (a.student.to !== b.student.to) return a.student.to - b.student.to;
          return a.student.viTriGhe - b.student.viTriGhe;
        case 'score_desc':
        default:
          if (b.score !== a.score) return b.score - a.score;
          return a.student.hoTen.localeCompare(b.student.hoTen, 'vi');
      }
    });

    return list;
  }, [officialClassRankings, rankingToFilter, rankingRatingFilter, rankingSearchQuery, rankingSortBy, rankingOnlyMe, currentStudent.maHS]);

  // Statistics for the currently filtered view
  const rankingStats = useMemo(() => {
    const total = displayedRankings.length;
    if (total === 0) return { avgScore: 0, totCount: 0, khaCount: 0, datCount: 0, canCoGangCount: 0 };
    const sumScore = displayedRankings.reduce((sum, item) => sum + item.score, 0);
    const avgScore = Math.round((sumScore / total) * 10) / 10;
    const totCount = displayedRankings.filter(item => item.xepLoai === 'Tot').length;
    const khaCount = displayedRankings.filter(item => item.xepLoai === 'Kha').length;
    const datCount = displayedRankings.filter(item => item.xepLoai === 'Dat').length;
    const canCoGangCount = displayedRankings.filter(item => item.xepLoai === 'KhongDat').length;
    return { avgScore, totCount, khaCount, datCount, canCoGangCount };
  }, [displayedRankings]);

  const myFrame = useMemo(() => {
    return getFrameForStudent(myRank, myPeriodSummary.diemTrungBinh, currentStudent.customFrameId);
  }, [myRank, myPeriodSummary.diemTrungBinh, currentStudent.customFrameId]);

  const handleOpenExplanation = (record: DisciplineRecord) => {
    setSelectedRecordForExplanation(record);
    setExplanationText(record.noiDungGiaiTrinh || '');
  };

  const handleSubmitExplanation = () => {
    if (!selectedRecordForExplanation || !explanationText.trim()) return;
    onSubmitExplanation(selectedRecordForExplanation.maGhiNhan, explanationText.trim());
    setSelectedRecordForExplanation(null);
    setExplanationText('');
  };

  const isCadre = currentStudent.vaiTro.some(r => r !== 'HS');
  const cadreRole = currentStudent.vaiTro.find(r => r !== 'HS');

  const studentBanner = useMemo(() => {
    const primaryRole = currentStudent.vaiTro.find(r => r !== 'HS') || 'HS';
    return getCadreBanner(primaryRole, currentStudent.toTruongTo || currentStudent.to);
  }, [currentStudent]);

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn">
      {/* Top Class Info Bar without cheesy slogans */}
      <div className="px-4 py-2.5 rounded-2xl bg-surface border border-token flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-main">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>Lớp 10A5 · THPT Số 2 Đức Phổ · Năm học {CURRENT_SCHOOL_YEAR}</span>
        </div>
        {isCadre && (
          <button
            onClick={() => setShowCadreModal(true)}
            className="shrink-0 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-500/25 transition-all cursor-pointer shadow-xs"
          >
            <span>👑 Ban cán sự</span>
          </button>
        )}
      </div>

      {/* Role & Student Illustrated Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-token shadow-xs bg-surface">
        <div className="relative h-28 sm:h-36 w-full overflow-hidden">
          {studentBanner.imageSrc ? (
            <img
              src={studentBanner.imageSrc}
              alt={studentBanner.roleName}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-r ${studentBanner.gradientFallback}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
          
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border backdrop-blur-md ${studentBanner.accentBadge}`}>
              {studentBanner.roleName}
            </span>
            <span className="text-[11px] font-bold text-white/90 drop-shadow-sm">
              {studentBanner.subtitle}
            </span>
          </div>
          
          <div className="absolute bottom-2.5 left-4 right-4 text-xs font-semibold text-white/90 italic drop-shadow-sm flex items-center justify-between gap-2">
            <span>"{studentBanner.tagline}"</span>
            {isCadre && (
              <button
                type="button"
                onClick={() => setShowCadreModal(true)}
                className="shrink-0 px-2.5 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold backdrop-blur-xs transition-all cursor-pointer"
              >
                👑 Vinh danh cán sự
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tab "Quay lại" (Back) button when viewing secondary tabs */}
      {activeTab !== 'my_score' && (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setActiveTab('my_score')}
            className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-2 border border-token text-main text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:border-accent"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-accent" />
            <span>← Quay lại Hồ sơ Của tôi</span>
          </button>
          <span className="text-xs font-bold text-muted">
            {activeTab === 'grades' ? 'Bảng điểm môn học' : activeTab === 'badges' ? 'Huy hiệu thành tích' : activeTab === 'seating' ? 'Sơ đồ lớp học' : 'Bảng xếp hạng thi đua'}
          </span>
        </div>
      )}

      {/* Student Nav Tabs */}
      <div className="flex items-center justify-center p-1 bg-surface-2 rounded-2xl border border-token max-w-xl mx-auto w-full overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('my_score')}
          className={`flex-1 min-w-[70px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'my_score' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          <User className="w-3.5 h-3.5 text-accent" />
          <span>Của tôi</span>
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`flex-1 min-w-[90px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'grades' 
              ? 'bg-surface text-main shadow-xs font-black ring-1 ring-accent/30 text-accent' 
              : 'text-muted hover:text-main'
          }`}
          title="Xem bảng điểm các môn học (Toán, Văn, Anh...)"
        >
          <GraduationCap className="w-3.5 h-3.5 text-accent" />
          <span>Điểm môn</span>
          {!settings.choPhepXemDiemMon && (
            <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`flex-1 min-w-[75px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'badges' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>Huy hiệu</span>
        </button>

        <button
          onClick={() => setActiveTab('seating')}
          className={`flex-1 min-w-[75px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'seating' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-accent" />
          <span>Sơ đồ lớp</span>
        </button>

        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex-1 min-w-[85px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'ranking' 
              ? 'bg-surface text-main shadow-xs' 
              : 'text-muted hover:text-main'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-accent" />
          <span>Thi đua</span>
        </button>
      </div>

      {/* TAB 1: CỦA TÔI */}
      {activeTab === 'my_score' && (
        <div className="space-y-4">
          {/* Main Score & Profile Card */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-surface border border-token shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              {/* Avatar with Custom Frame, Photo & Camera Upload Button */}
              <div className="relative shrink-0">
                <AvatarFrame
                  frame={myFrame}
                  cadreRole={
                    currentStudent.vaiTro.includes('LT')
                      ? 'LT'
                      : currentStudent.vaiTro.includes('BT')
                      ? 'BT'
                      : currentStudent.vaiTro.includes('LP_HT')
                      ? 'LP_HT'
                      : currentStudent.vaiTro.includes('LP_LD')
                      ? 'LP_LD'
                      : currentStudent.vaiTro.includes('TT')
                      ? `TT_${currentStudent.to}`
                      : undefined
                  }
                  size="lg"
                >
                  {currentStudent.avatarUrl ? (
                    <img
                      src={currentStudent.avatarUrl}
                      alt={currentStudent.hoTen}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div
                      className={`w-full h-full rounded-full flex items-center justify-center font-black text-lg ${
                        currentStudent.gioiTinh === 'Nu'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {getStudentAvatarInitial(currentStudent.hoTen)}
                    </div>
                  )}
                </AvatarFrame>

                {/* Camera upload button */}
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  title="Tải ảnh đại diện của bạn"
                  className="absolute -top-1 -right-1 z-20 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow-md transition-all cursor-pointer hover:scale-110 active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-main leading-tight truncate">
                    {currentStudent.hoTen}
                  </h2>
                  {cadreRole && (
                    <CadreBadge 
                      role={cadreRole} 
                      toTruongTo={currentStudent.toTruongTo} 
                      size="sm" 
                      onClick={() => setShowCadreModal(true)}
                    />
                  )}
                  {/* Active Selected Badge Displayed beside Avatar & Name */}
                  {activeDisplayedBadge && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('badges')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                      style={{
                        backgroundColor: `${activeDisplayedBadge.accentColor}18`,
                        borderColor: `${activeDisplayedBadge.accentColor}50`,
                        color: activeDisplayedBadge.accentColor,
                      }}
                      title={`Huy hiệu đang hiển thị: ${activeDisplayedBadge.name} - ${activeDisplayedBadge.description}. Bấm để đổi huy hiệu.`}
                    >
                      <BadgeEmblem type={activeDisplayedBadge.iconType} size="xs" />
                      <span>{activeDisplayedBadge.name}</span>
                    </button>
                  )}
                </div>
                <p className="text-xs font-semibold text-muted mt-0.5">
                  Tổ {currentStudent.to}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Đổi ảnh đại diện</span>
                  </button>
                  <span className="text-muted opacity-40">·</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('badges')}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Award className="w-3 h-3" />
                    <span>{activeDisplayedBadge ? 'Đổi huy hiệu' : 'Chọn huy hiệu'}</span>
                  </button>
                  <span className="text-muted opacity-40">·</span>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Đổi mật khẩu</span>
                  </button>
                  {onLogout && (
                    <>
                      <span className="text-muted opacity-40">·</span>
                      <button
                        type="button"
                        onClick={onLogout}
                        className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Đăng xuất khỏi tài khoản"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Đăng xuất</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Score & Ranking Pill with Trophy Visual */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-token">
              {myWeekSummary.diemHienTai >= 90 && (
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-amber-500/30 shadow-xs hidden sm:block shrink-0">
                  <img
                    src="/src/assets/images/honor_student_trophy_1794145975161.jpg"
                    alt="Cúp vinh danh"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="text-right">
                <div className="text-[11px] text-muted font-medium">
                  {periodFilter.tuanHoc !== 'all' ? `Điểm tuần ${periodFilter.tuanHoc}` : 'Điểm trung bình'}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-main leading-none mt-1">
                  {myPeriodSummary.diemTrungBinh} <span className="text-xs font-normal text-muted">/ 100</span>
                </div>
              </div>

              <div className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold shadow-xs ${
                myPeriodSummary.xepLoai === 'Tot' 
                  ? 'bg-[var(--st-ok)]/15 text-[var(--st-ok)] border border-[var(--st-ok)]/30'
                  : myPeriodSummary.xepLoai === 'Kha'
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : myPeriodSummary.xepLoai === 'Dat'
                  ? 'bg-[var(--st-warn)]/15 text-[var(--st-warn)] border border-[var(--st-warn)]/30'
                  : 'bg-[var(--st-bad)]/15 text-[var(--st-bad)] border border-[var(--st-bad)]/30'
              }`}>
                {myPeriodSummary.xepLoai === 'Tot' ? '🌟 Loại Tốt' :
                 myPeriodSummary.xepLoai === 'Kha' ? '🚀 Loại Khá' :
                 myPeriodSummary.xepLoai === 'Dat' ? '⚠️ Loại Đạt' : '❗ Cần cố gắng'}
              </div>
            </div>
          </div>

          {/* Time Hierarchy Period Filter */}
          <PeriodFilterComponent
            filter={periodFilter}
            onChangeFilter={setPeriodFilter}
            compact={true}
          />

          {/* Period Summary Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-surface border border-token">
              <span className="text-[11px] text-muted font-medium">Khởi đầu</span>
              <div className="text-lg font-bold text-main mt-0.5">{settings.diemKhoiDau} điểm</div>
            </div>

            <div className="p-3 rounded-2xl bg-surface border border-token">
              <span className="text-[11px] text-muted font-medium">Tổng điểm trừ</span>
              <div className="text-lg font-bold text-[var(--st-bad)] mt-0.5">-{myPeriodSummary.tongDiemTru}đ</div>
            </div>

            <div className="p-3 rounded-2xl bg-surface border border-token">
              <span className="text-[11px] text-muted font-medium">Điểm cộng bù</span>
              <div className="text-lg font-bold text-[var(--st-ok)] mt-0.5">+{myPeriodSummary.tongDiemCong}đ</div>
            </div>

            <div className="p-3 rounded-2xl bg-surface border border-token">
              <span className="text-[11px] text-muted font-medium">Tổng số lỗi</span>
              <div className="text-lg font-bold text-main mt-0.5">{myPeriodSummary.soLoi} lỗi</div>
            </div>
          </div>

          {/* 4-Row Weekly Discipline Log: Tuần hiện tại & 3 tuần liền kề gần nhất */}
          <div className="bg-surface rounded-3xl border border-token overflow-hidden shadow-xs">
            <div className="px-4 py-3.5 border-b border-token flex items-center justify-between flex-wrap gap-2 bg-surface-2/40">
              <div>
                <h3 className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>Nhật ký nề nếp cá nhân (4 tuần gần nhất)</span>
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  Hiển thị 4 dòng: Tuần hiện tại (Tuần {currentWeek}) và 3 tuần liền kề gần nhất
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExpandAllWeeks}
                  className="px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-main hover:bg-surface-2 rounded-xl border border-transparent hover:border-token transition-all cursor-pointer"
                >
                  Mở tất cả
                </button>
                <span className="text-muted/40 text-[11px]">·</span>
                <button
                  type="button"
                  onClick={handleCollapseAllWeeks}
                  className="px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-main hover:bg-surface-2 rounded-xl border border-transparent hover:border-token transition-all cursor-pointer"
                >
                  Thu gọn
                </button>
              </div>
            </div>

            <div className="divide-y divide-token">
              {fourWeeksData.map((weekData) => {
                const isExpanded = expandedWeeks.has(weekData.week);
                const isCurrent = weekData.isCurrent;

                const ratingBadge = weekData.xepLoai === 'Tot' 
                  ? { text: '🌟 Loại Tốt', cls: 'bg-[var(--st-ok)]/15 text-[var(--st-ok)] border-[var(--st-ok)]/30' }
                  : weekData.xepLoai === 'Kha'
                  ? { text: '🚀 Loại Khá', cls: 'bg-accent/15 text-accent border-accent/30' }
                  : weekData.xepLoai === 'Dat'
                  ? { text: '⚠️ Loại Đạt', cls: 'bg-[var(--st-warn)]/15 text-[var(--st-warn)] border-[var(--st-warn)]/30' }
                  : { text: '❗ Cần cố gắng', cls: 'bg-[var(--st-bad)]/15 text-[var(--st-bad)] border-[var(--st-bad)]/30' };

                return (
                  <div key={weekData.week} className={`transition-colors ${isCurrent ? 'bg-accent/[0.02]' : ''}`}>
                    {/* Week Row Header (Clickable Accordion) */}
                    <div
                      onClick={() => toggleWeekExpand(weekData.week)}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-2/60 transition-colors select-none"
                    >
                      {/* Left: Week Badge & Information */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border transition-transform ${
                          isCurrent
                            ? 'bg-gradient-to-br from-accent to-accent-hover text-white shadow-xs border-accent/40 scale-105'
                            : 'bg-surface-2 text-muted border-token'
                        }`}>
                          T{weekData.week}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-main">
                              Tuần {weekData.week}
                            </span>
                            {isCurrent ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 inline-flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Tuần này (Hiện tại)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-token">
                                {weekData.label}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5 flex-wrap">
                            {weekData.records.length === 0 ? (
                              <span className="text-[var(--st-ok)] font-medium flex items-center gap-1">
                                <Check className="w-3 h-3" /> Không có vi phạm · Điểm 100 tuyệt đối ⭐
                              </span>
                            ) : (
                              <span>
                                {weekData.soLoi > 0 && <strong className="text-[var(--st-bad)]">-{weekData.tongTru}đ ({weekData.soLoi} lỗi)</strong>}
                                {weekData.tongCong > 0 && <strong className="text-[var(--st-ok)] ml-1">+{weekData.tongCong}đ thưởng</strong>}
                                <span className="ml-1.5 text-muted">({weekData.records.length} sự việc)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Score, Rating & Expand Toggle */}
                      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-black tabular-nums text-main leading-tight">
                            {weekData.score}
                            <span className="text-[10px] font-normal text-muted ml-0.5">/100đ</span>
                          </div>
                          <div className="hidden sm:block mt-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${ratingBadge.cls}`}>
                              {ratingBadge.text}
                            </span>
                          </div>
                        </div>

                        <div className={`p-1.5 rounded-xl border border-token transition-colors ${
                          isExpanded ? 'bg-surface-2 text-main' : 'bg-surface text-muted hover:text-main'
                        }`}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Event Details List */}
                    {isExpanded && (
                      <div className="px-3.5 sm:px-4 pb-3.5 pt-1 bg-surface-2/30 border-t border-token/60 animate-in fade-in-50 duration-150">
                        {weekData.records.length === 0 ? (
                          <div className="py-4 px-3 rounded-2xl bg-surface border border-token text-center">
                            <p className="text-xs text-[var(--st-ok)] font-semibold flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-[var(--st-ok)]" />
                              <span>Tuần {weekData.week} em chấp hành nề nếp xuất sắc, không có ghi nhận vi phạm nào!</span>
                            </p>
                            <p className="text-[11px] text-muted mt-0.5">Điểm thi đua đạt mức tối đa 100/100 ⭐</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-1">
                              Chi tiết các sự việc trong Tuần {weekData.week} ({weekData.records.length})
                            </div>
                            {weekData.records.map(record => {
                              const isBonus = record.loaiDiem === 'Cong';
                              const canExplain = record.trangThai === 'HieuLuc' && !record.noiDungGiaiTrinh;

                              return (
                                <div
                                  key={record.maGhiNhan}
                                  className="p-3 rounded-2xl bg-surface border border-token hover:border-token-hover transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-main">
                                          {record.tenHanhVi}
                                        </span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                          isBonus ? 'bg-[var(--st-ok)]/15 text-[var(--st-ok)]' : 'bg-[var(--st-bad)]/15 text-[var(--st-bad)]'
                                        }`}>
                                          {isBonus ? `+${record.diemSo}` : `-${record.diemSo}`}đ
                                        </span>
                                        <span className="text-[10px] text-muted">
                                          HK{record.hocKi} · Buổi {record.buoi === 'Sang' ? 'Sáng' : 'Chiều'} · {record.ngayHoc}
                                        </span>
                                      </div>

                                      {record.ghiChu && (
                                        <p className="text-xs text-muted">
                                          Chi tiết: {record.ghiChu}
                                        </p>
                                      )}

                                      <div className="text-[11px] text-muted flex items-center gap-2 flex-wrap">
                                        <span>Người ghi: {record.nguoiGhi} ({record.vaiTroNguoiGhi})</span>
                                        {record.trangThai === 'ChoDuyet' && (
                                          <span className="text-[var(--st-warn)] font-semibold flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Đang chờ GV duyệt giải trình
                                          </span>
                                        )}
                                        {record.trangThai === 'DaChapNhan' && (
                                          <span className="text-[var(--st-ok)] font-semibold flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Đã chấp nhận giải trình
                                          </span>
                                        )}
                                        {record.trangThai === 'BiTuChoi' && (
                                          <span className="text-[var(--st-bad)] font-semibold flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Giải trình bị từ chối: {record.lyDoDuyet}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {canExplain && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenExplanation(record)}
                                        className="shrink-0 px-2.5 py-1 rounded-xl bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                        <span>Giải trình</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ĐIỂM MÔN HỌC */}
      {activeTab === 'grades' && (
        <StudentGradeCard
          currentStudent={currentStudent}
          academicRecord={myAcademicRecord}
          settings={settings}
          allAcademicRecords={academicRecords}
        />
      )}

      {/* TAB 2: HUY HIỆU */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-surface border border-token shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Bộ Sưu Tập Huy Hiệu Danh Dự (30 Danh Hiệu)</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Đã mở khóa: <strong>{myBadges.filter(b => b.unlocked).length}</strong> / {myBadges.length} huy hiệu · Bấm "Đeo cạnh Avatar" để hiển thị huy hiệu của bạn!
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('my_score')}
                className="px-3 py-1 rounded-xl bg-surface-2 border border-token text-xs font-bold text-main cursor-pointer hover:bg-surface"
              >
                ← Quay lại điểm số
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-2xl border border-token text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedBadgeCategory('all')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedBadgeCategory === 'all'
                    ? 'bg-surface text-main shadow-xs'
                    : 'text-muted hover:text-main'
                }`}
              >
                Tất cả (30)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBadgeCategory('discipline')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedBadgeCategory === 'discipline'
                    ? 'bg-surface text-main shadow-xs'
                    : 'text-muted hover:text-main'
                }`}
              >
                🛡️ Kỷ luật (8)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBadgeCategory('academic')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedBadgeCategory === 'academic'
                    ? 'bg-surface text-main shadow-xs'
                    : 'text-muted hover:text-main'
                }`}
              >
                📚 Học tập (8)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBadgeCategory('movement')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedBadgeCategory === 'movement'
                    ? 'bg-surface text-main shadow-xs'
                    : 'text-muted hover:text-main'
                }`}
              >
                🚩 Phong trào (7)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBadgeCategory('cadre')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedBadgeCategory === 'cadre'
                    ? 'bg-surface text-main shadow-xs'
                    : 'text-muted hover:text-main'
                }`}
              >
                👑 Cán sự & Lớp (7)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {myBadges
                .filter(b => selectedBadgeCategory === 'all' || b.category === selectedBadgeCategory)
                .map(badge => {
                  const isSelected = selectedBadgeId === badge.id && badge.unlocked;
                  return (
                    <div
                      key={badge.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        badge.unlocked
                          ? isSelected
                            ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 text-main shadow-md'
                            : 'bg-surface border-token hover:border-amber-400/50 text-main shadow-xs'
                          : 'bg-surface-2 border-token opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1 rounded-2xl bg-surface border border-token shrink-0 shadow-xs">
                          <BadgeEmblem
                            type={badge.iconType}
                            size="md"
                            isUnlocked={badge.unlocked}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-main">
                              {badge.name}
                            </h4>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-surface border border-token text-muted font-bold">
                              {badge.rarity}
                            </span>
                            {badge.unlocked ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                                Đã mở khóa
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-muted font-medium">
                                Chưa đạt
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-extrabold uppercase tracking-wide">
                                Đang đeo cạnh Avatar
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted mt-1 leading-snug">
                            {badge.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-token/60 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted font-medium truncate">
                          Tiêu chí: {badge.criteria}
                        </span>
                        {badge.unlocked ? (
                          <button
                            type="button"
                            onClick={() => handleToggleBadge(badge.id)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                                : 'bg-surface-2 border border-token hover:border-amber-500 text-main hover:bg-amber-50 dark:hover:bg-amber-950/20'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Gỡ khỏi Avatar</span>
                              </>
                            ) : (
                              <>
                                <span>✨</span>
                                <span>Đeo cạnh Avatar</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted italic flex items-center gap-1 shrink-0">
                            <Lock className="w-3 h-3" />
                            <span>Chưa mở khóa</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SƠ ĐỒ LỚP */}
      {activeTab === 'seating' && (
        <div className="space-y-3">
          <div className="bg-surface p-3 sm:p-4 rounded-3xl border border-token space-y-3">
            <div className="text-xs text-muted flex items-center justify-between">
              <span>Sơ đồ vị trí 42 học sinh &amp; Trạng thái nề nếp</span>
              <button
                type="button"
                onClick={() => setActiveTab('my_score')}
                className="px-3 py-1 rounded-xl bg-surface-2 border border-token text-xs font-bold text-main cursor-pointer"
              >
                ← Quay lại
              </button>
            </div>

            <SeatGrid
              layout={layout}
              students={allStudents}
              studentSummaries={studentSummaries}
              selectedStudentIds={[currentStudent.maHS]}
              onSelectStudent={() => {}}
              viewerRole="HS"
              showStatusColors={settings.hocSinhThayMau === 'CaLop'}
            />
          </div>
        </div>
      )}

      {/* TAB 4: BẢNG THI ĐUA CÁ NHÂN / TỔNG QUAN THI ĐUA HỌC SINH */}
      {activeTab === 'ranking' && (
        <div className="bg-surface rounded-3xl border border-token overflow-hidden shadow-xs space-y-0">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-token flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-2/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Trophy className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-main uppercase tracking-wider">
                  Bảng tổng quan thi đua lớp 10A5
                </h3>
              </div>
              <p className="text-[11px] text-muted mt-1">
                Khởi đầu 100 điểm · Xếp loại: Tốt (≥90đ), Khá (≥75đ), Đạt (≥60đ), Cần cố gắng (&lt;60đ)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setRankingOnlyMe(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs ${
                  rankingOnlyMe
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-surface hover:bg-surface-2 border-token text-main hover:border-accent'
                }`}
                title="Bấm để lọc nhanh xem riêng vị trí thi đua của bạn"
              >
                <span>⭐ Vị trí của bạn: Hạng #{myRank} ({myPeriodSummary.diemTrungBinh}đ)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('my_score')}
                className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-2 border border-token text-xs font-bold text-main cursor-pointer transition-colors shadow-xs"
              >
                ← Quay lại
              </button>
            </div>
          </div>

          {/* Sắp xếp & Bộ lọc Thanh công cụ (Sorting & Filter Toolbar) */}
          <div className="p-4 border-b border-token bg-surface space-y-3">
            {/* Hàng 1: Dropdown Sắp xếp + Ô Tìm kiếm */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Dropdown Sắp xếp */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-bold text-main flex items-center gap-1 shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-accent" />
                  <span>Sắp xếp:</span>
                </span>
                <select
                  value={rankingSortBy}
                  onChange={e => setRankingSortBy(e.target.value as RankingSortOption)}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-surface-2 border border-token text-xs font-bold text-main focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
                >
                  <option value="score_desc">🏆 Điểm thi đua cao nhất (Hạng 1 → 42)</option>
                  <option value="score_asc">📉 Điểm thi đua thấp nhất (Cần cố gắng)</option>
                  <option value="stt">🔢 Theo Số thứ tự danh sách (STT)</option>
                  <option value="name_asc">🔤 Theo Tên học sinh (A → Z)</option>
                  <option value="name_desc">🔤 Theo Tên học sinh (Z → A)</option>
                  <option value="to">👥 Gom theo Tổ (Tổ 1 → 4)</option>
                </select>
              </div>

              {/* Ô Tìm kiếm nhanh */}
              <div className="relative sm:w-64 shrink-0">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={rankingSearchQuery}
                  onChange={e => setRankingSearchQuery(e.target.value)}
                  placeholder="Tìm bạn theo tên, STT, mã HS..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-surface-2 border border-token text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                {rankingSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRankingSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-main p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Hàng 2: Nút bấm Sắp xếp nhanh (Quick sort pills) */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-semibold text-muted mr-1">Nhanh:</span>
              <button
                type="button"
                onClick={() => setRankingSortBy('score_desc')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  rankingSortBy === 'score_desc'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-surface-2 hover:bg-surface border border-token text-muted hover:text-main'
                }`}
              >
                🏆 Điểm cao nhất
              </button>
              <button
                type="button"
                onClick={() => setRankingSortBy('score_asc')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  rankingSortBy === 'score_asc'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-surface-2 hover:bg-surface border border-token text-muted hover:text-main'
                }`}
              >
                📉 Cần cố gắng
              </button>
              <button
                type="button"
                onClick={() => setRankingSortBy('stt')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  rankingSortBy === 'stt'
                    ? 'bg-accent text-on-accent shadow-xs'
                    : 'bg-surface-2 hover:bg-surface border border-token text-muted hover:text-main'
                }`}
              >
                🔢 STT danh sách
              </button>
              <button
                type="button"
                onClick={() => setRankingSortBy('name_asc')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  rankingSortBy === 'name_asc'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-surface-2 hover:bg-surface border border-token text-muted hover:text-main'
                }`}
              >
                🔤 Tên A → Z
              </button>
              <button
                type="button"
                onClick={() => setRankingSortBy('to')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  rankingSortBy === 'to'
                    ? 'bg-purple-500 text-white shadow-xs'
                    : 'bg-surface-2 hover:bg-surface border border-token text-muted hover:text-main'
                }`}
              >
                👥 Theo Tổ (1→4)
              </button>
            </div>

            {/* Hàng 3: Lọc theo Tổ */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-token/60">
              <span className="text-[11px] font-semibold text-muted mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-muted" />
                <span>Lọc theo:</span>
              </span>
              <button
                type="button"
                onClick={() => setRankingToFilter('all')}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  rankingToFilter === 'all'
                    ? 'bg-main text-surface shadow-xs'
                    : 'bg-surface-2 text-muted hover:text-main hover:bg-surface border border-token'
                }`}
              >
                Cả lớp ({allStudents.length})
              </button>
              {[1, 2, 3, 4].map(toNum => {
                const count = allStudents.filter(s => s.to === toNum).length;
                const isSelected = rankingToFilter === toNum;
                const isMyTo = currentStudent.to === toNum;
                return (
                  <button
                    key={toNum}
                    type="button"
                    onClick={() => setRankingToFilter(toNum)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-accent text-on-accent shadow-xs'
                        : 'bg-surface-2 text-muted hover:text-main hover:bg-surface border border-token'
                    }`}
                  >
                    <span>Tổ {toNum} ({count})</span>
                    {isMyTo && <span className="text-[9px] opacity-75">★ Tổ tôi</span>}
                  </button>
                );
              })}
            </div>

            {/* Hàng 4: Thống kê nhanh danh sách đang hiển thị */}
            <div className="pt-2 border-t border-token/60 flex items-center justify-between flex-wrap gap-2 text-[11px] text-muted">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Đang hiển thị: <strong className="text-main font-bold">{displayedRankings.length}</strong> / {allStudents.length} học sinh
                </span>
                <span>·</span>
                <span>
                  Điểm trung bình: <strong className="text-accent font-bold">{rankingStats.avgScore} đ</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap font-medium">
                <span className="text-[var(--st-ok)] font-bold">
                  🌟 Tốt: {rankingStats.totCount}
                </span>
                <span>·</span>
                <span className="text-accent font-bold">
                  🚀 Khá: {rankingStats.khaCount}
                </span>
                <span>·</span>
                <span className="text-[var(--st-warn)] font-bold">
                  ⚠️ Đạt: {rankingStats.datCount}
                </span>
                {rankingStats.canCoGangCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[var(--st-bad)] font-bold">
                      ❗ Cần cố gắng: {rankingStats.canCoGangCount}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Danh sách học sinh */}
          <div className="divide-y divide-token max-h-[640px] overflow-y-auto">
            {displayedRankings.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs text-muted">Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.</p>
                <button
                  type="button"
                  onClick={() => {
                    setRankingSearchQuery('');
                    setRankingToFilter('all');
                    setRankingOnlyMe(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:opacity-90 cursor-pointer shadow-xs"
                >
                  Xóa bộ lọc &amp; Hiện lại cả lớp
                </button>
              </div>
            ) : (
              displayedRankings.map((item, idx) => {
                const isMe = item.student.maHS === currentStudent.maHS;
                const officialRank = item.officialRank;
                const frameConfig = getFrameForStudent(officialRank, item.score, item.student.customFrameId);

                // Indicator on the left depends on sort mode
                let rankLabel: React.ReactNode;
                if (rankingSortBy === 'score_desc') {
                  rankLabel = officialRank === 1 ? '🥇' : officialRank === 2 ? '🥈' : officialRank === 3 ? '🥉' : `#${officialRank}`;
                } else if (rankingSortBy === 'stt') {
                  rankLabel = `#${item.student.viTriGhe < 10 ? '0' : ''}${item.student.viTriGhe}`;
                } else {
                  rankLabel = `${idx + 1}`;
                }

                return (
                  <div
                    key={item.student.maHS}
                    className={`px-4 py-3 flex items-center justify-between transition-colors ${
                      isMe 
                        ? 'bg-accent/12 border-l-4 border-l-accent font-semibold shadow-xs' 
                        : 'hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Left Rank / Order badge */}
                      <span className={`w-8 text-center text-xs font-bold shrink-0 ${
                        rankingSortBy === 'score_desc' && officialRank === 1 ? 'text-amber-500 font-extrabold text-base' :
                        rankingSortBy === 'score_desc' && officialRank === 2 ? 'text-slate-400 font-bold text-sm' :
                        rankingSortBy === 'score_desc' && officialRank === 3 ? 'text-amber-700 font-bold text-sm' :
                        'text-muted font-bold'
                      }`}>
                        {rankLabel}
                      </span>

                      {/* Avatar with Frame */}
                      <AvatarFrame frame={frameConfig} size="sm">
                        {item.student.avatarUrl ? (
                          <img
                            src={item.student.avatarUrl}
                            alt={item.student.hoTen}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div
                            className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs ${
                              item.student.gioiTinh === 'Nu'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {getStudentAvatarInitial(item.student.hoTen)}
                          </div>
                        )}
                      </AvatarFrame>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold truncate ${isMe ? 'text-accent' : 'text-main'}`}>
                            {item.student.hoTen}
                          </span>
                          
                          {isMe && (
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-accent text-on-accent shadow-xs">
                              BẠN
                            </span>
                          )}

                          {/* When sorted by something other than score_desc, explicitly display official emulation rank */}
                          {rankingSortBy !== 'score_desc' && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              officialRank === 1 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                              officialRank <= 3 ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' :
                              'bg-surface-2 text-muted border border-token'
                            }`}>
                              {officialRank === 1 ? '🥇 Hạng 1' : officialRank === 2 ? '🥈 Hạng 2' : officialRank === 3 ? '🥉 Hạng 3' : `Hạng #${officialRank}`}
                            </span>
                          )}

                          {officialRank === 1 && rankingSortBy === 'score_desc' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                              TOP 1
                            </span>
                          )}
                          {(officialRank === 2 || officialRank === 3) && rankingSortBy === 'score_desc' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                              TOP 2-3
                            </span>
                          )}
                          {officialRank >= 4 && officialRank <= 10 && rankingSortBy === 'score_desc' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              TOP 10
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] font-medium text-muted flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-token">Tổ {item.student.to}</span>
                          {item.student.vaiTro.some(r => r !== 'HS') && (
                            <>
                              <span>·</span>
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                {item.student.vaiTro.includes('LT') ? 'Lớp trưởng' :
                                 item.student.vaiTro.includes('BT') ? 'Bí thư' :
                                 item.student.vaiTro.includes('LP_HT') ? 'LP Học tập' :
                                 item.student.vaiTro.includes('LP_LD') ? 'LP Lao động' :
                                 item.student.vaiTro.includes('TT') ? `Tổ trưởng T${item.student.to}` : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {item.deductions > 0 && (
                        <span className="text-[10px] font-bold text-[var(--st-bad)] hidden sm:inline-block">
                          -{item.deductions}đ
                        </span>
                      )}
                      {item.bonuses > 0 && (
                        <span className="text-[10px] font-bold text-[var(--st-ok)] hidden sm:inline-block">
                          +{item.bonuses}đ
                        </span>
                      )}

                      <span className="text-xs font-black tabular-nums text-main">
                        {item.score} đ
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.xepLoai === 'Tot' ? 'bg-[var(--st-ok)]/15 text-[var(--st-ok)]' :
                        item.xepLoai === 'Kha' ? 'bg-accent/15 text-accent' :
                        item.xepLoai === 'Dat' ? 'bg-[var(--st-warn)]/15 text-[var(--st-warn)]' :
                        'bg-[var(--st-bad)]/15 text-[var(--st-bad)]'
                      }`}>
                        {item.xepLoai === 'Tot' ? 'Tốt' :
                         item.xepLoai === 'Kha' ? 'Khá' :
                         item.xepLoai === 'Dat' ? 'Đạt' : 'Cần cố gắng'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Cadre Honors Modal */}
      <CadreHonorsModal
        isOpen={showCadreModal}
        onClose={() => setShowCadreModal(false)}
        students={allStudents}
      />

      {/* Explanation Modal */}
      {selectedRecordForExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface border border-token rounded-3xl shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-token pb-2.5">
              <h4 className="text-sm font-bold text-main">
                Gửi giải trình vi phạm
              </h4>
              <button
                type="button"
                onClick={() => setSelectedRecordForExplanation(null)}
                className="p-1 rounded-md text-muted hover:text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <span className="font-semibold text-main">
                {selectedRecordForExplanation.tenHanhVi} (-{selectedRecordForExplanation.diemSo}đ)
              </span>
              <p className="text-[11px] text-muted">
                HK{selectedRecordForExplanation.hocKi} · Tuần {selectedRecordForExplanation.tuanHoc} · Ngày {selectedRecordForExplanation.ngayHoc} ({selectedRecordForExplanation.buoi === 'Sang' ? 'Sáng' : 'Chiều'})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-main mb-1">
                Lý do &amp; Minh chứng giải trình:
              </label>
              <textarea
                rows={3}
                value={explanationText}
                onChange={e => setExplanationText(e.target.value)}
                placeholder="Trình bày lý do khách quan hoặc hiểu lầm..."
                className="w-full p-2.5 bg-surface-2 border border-token rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-token">
              <button
                type="button"
                onClick={() => setSelectedRecordForExplanation(null)}
                className="px-3 py-1.5 rounded-xl border border-token text-xs text-muted hover:text-main"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!explanationText.trim()}
                onClick={handleSubmitExplanation}
                className="px-4 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Gửi đơn giải trình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Upload & Crop Modal */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        student={currentStudent}
        allStudents={allStudents}
        settings={settings}
        onSaveAvatar={(studentId, newAvatarUrl) => {
          if (onUpdateStudentAvatar) {
            onUpdateStudentAvatar(studentId || currentStudent.maHS, newAvatarUrl);
          }
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        student={currentStudent}
      />
    </div>
  );
};
