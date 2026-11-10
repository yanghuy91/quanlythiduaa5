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
  GraduationCap,
  Settings,
  ClipboardList,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { 
  Student, 
  SeatLayoutNode, 
  DisciplineRecord, 
  StudentWeekSummary, 
  TeacherSettings,
  HierarchyPeriodFilter,
  StudentAcademicRecord,
  RoleCode,
  RuleItem
} from '../../types';
import { Logo10A5 } from '../common/Logo10A5';
import { StudentGradeCard } from '../grades/StudentGradeCard';
import { SeatGrid } from '../student-picker/SeatGrid';
import { StudentPicker } from '../student-picker/StudentPicker';
import { RecordBottomSheet } from '../record/RecordBottomSheet';
import { DuplicateWarningModal } from '../record/DuplicateWarningModal';
import { PeriodHierarchyFilter as PeriodFilterComponent } from '../common/PeriodHierarchyFilter';
import { checkDuplicateRecord, calculateDenseRankings } from '../../utils/emulation';
import { CadreBadge } from '../common/CadreBadge';
import { CadreHonorsModal } from '../common/CadreHonorsModal';
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
  cadreRole?: RoleCode;
  rules?: RuleItem[];
  onAddRecord?: (record: Omit<DisciplineRecord, 'maGhiNhan' | 'thoiGianMayChu' | 'thoiGianMay'>) => void;
  onVoidRecord?: (recordId: string, reason: string) => void;
  onSubmitExplanation?: (recordId: string, explanation: string) => void;
  onUpdateStudentAvatar?: (studentId: string, avatarUrl: string) => void;
  onLogout?: () => void;
  onChangeCurrentWeek?: (week: number) => void;
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
  cadreRole,
  rules = [],
  onAddRecord,
  onVoidRecord,
  onSubmitExplanation,
  onUpdateStudentAvatar,
  onLogout,
  onChangeCurrentWeek,
}) => {
  const primaryCadreRole = cadreRole || currentStudent.vaiTro.find(r => r !== 'HS') || 'HS';
  const isCadre = primaryCadreRole !== 'HS';

  const [activeTab, setActiveTab] = useState<'my_score' | 'grades' | 'badges' | 'seating' | 'ranking' | 'record' | 'my_log'>('my_score');

  // Quyền chuyển tuần hiện tại: Chỉ có Lớp trưởng (LT), Bí thư (BT), Lớp phó học tập (LP_HT)
  const canChangeCurrentWeek = useMemo(() => {
    return currentStudent.vaiTro.some(r => r === 'LT' || r === 'BT' || r === 'LP_HT') ||
      primaryCadreRole === 'LT' || primaryCadreRole === 'BT' || primaryCadreRole === 'LP_HT';
  }, [currentStudent.vaiTro, primaryCadreRole]);
  const [pendingWeekChange, setPendingWeekChange] = useState<number | null>(null);

  // Cadre specific state
  const [fastSaveEnabled, setFastSaveEnabled] = useState(false);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [duplicateWarningData, setDuplicateWarningData] = useState<{
    pendingRule: RuleItem;
    duplicateStudents: { student: Student; existingRecords: DisciplineRecord[] }[];
    safeStudentIds: string[];
  } | null>(null);
  const [voidModalRecord, setVoidModalRecord] = useState<DisciplineRecord | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const [logPeriodFilter, setLogPeriodFilter] = useState<HierarchyPeriodFilter>({
    namHoc: CURRENT_SCHOOL_YEAR,
    hocKi: 1,
    thang: 'all',
    tuanHoc: currentWeek,
    ngayHoc: 'all',
    buoi: 'all',
  });

  const selectedStudents = useMemo(() => {
    return allStudents.filter(s => selectedStudentIds.includes(s.maHS));
  }, [allStudents, selectedStudentIds]);

  const singleSelectedStudent = selectedStudents.length > 0 ? selectedStudents[0] : null;

  const filteredMyRecords = useMemo(() => {
    const list = filterRecordsByHierarchy(records, logPeriodFilter);
    return list.filter(r => r.nguoiGhi === currentStudent.hoTen);
  }, [records, logPeriodFilter, currentStudent.hoTen]);

  const handleSelectStudent = (student: Student) => {
    if (isMultiSelect) {
      setSelectedStudentIds(prev => {
        if (prev.includes(student.maHS)) {
          return prev.filter(id => id !== student.maHS);
        } else {
          return [...prev, student.maHS];
        }
      });
    } else {
      setSelectedStudentIds([student.maHS]);
      setIsBottomSheetOpen(true);
    }
  };

  const commitRecords = (
    targets: Student[],
    rule: RuleItem,
    extraNote?: string,
    date?: string,
    buoi?: 'Sang' | 'Chieu',
    confirmedDuplicate = false,
    hocKi: 1 | 2 = 1,
    tuanHoc: number = currentWeek
  ) => {
    if (!onAddRecord) return;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const targetBuoi = buoi || (new Date().getHours() < 12 ? 'Sang' : 'Chieu');

    targets.forEach(student => {
      onAddRecord({
        namHoc: CURRENT_SCHOOL_YEAR,
        hocKi: hocKi,
        thang: new Date(targetDate).getMonth() + 1,
        tuanHoc: tuanHoc,
        ngayHoc: targetDate,
        buoi: targetBuoi,
        doiTuong: 'HocSinh',
        maHS: student.maHS,
        hoTen: student.hoTen,
        to: student.to,
        maNoiQuy: rule.maNoiQuy,
        nhomHanhVi: rule.nhomHanhVi,
        tenHanhVi: rule.tenHanhVi,
        mucDo: rule.mucDo,
        diemSo: rule.diemSo,
        loaiDiem: rule.loaiDiem,
        ghiChu: extraNote,
        nguoiGhi: currentStudent.hoTen,
        vaiTroNguoiGhi: primaryCadreRole,
        nguonGhi: 'TrucTiep',
        lanThuTrongBuoi: 1,
        daXacNhanTrung: confirmedDuplicate,
        trangThai: 'HieuLuc',
      });
    });

    setSelectedStudentIds([]);
    setIsBottomSheetOpen(false);
    setDuplicateWarningData(null);
  };

  const handleAttemptSubmitRule = (
    rule: RuleItem, 
    extraNote?: string, 
    date?: string, 
    buoi?: 'Sang' | 'Chieu',
    hocKi: 1 | 2 = 1,
    tuanHoc: number = currentWeek
  ) => {
    const targetStudents = isMultiSelect ? selectedStudents : (singleSelectedStudent ? [singleSelectedStudent] : []);
    if (targetStudents.length === 0) return;

    const duplicates: { student: Student; existingRecords: DisciplineRecord[] }[] = [];
    const safeIds: string[] = [];
    const targetDate = date || new Date().toISOString().split('T')[0];
    const targetBuoi = buoi || (new Date().getHours() < 12 ? 'Sang' : 'Chieu');

    targetStudents.forEach(st => {
      const dupCheck = checkDuplicateRecord(
        records,
        st.maHS,
        targetDate,
        targetBuoi,
        rule.maNoiQuy
      );

      if (dupCheck.isDuplicate) {
        duplicates.push({ student: st, existingRecords: dupCheck.existingRecords });
      } else {
        safeIds.push(st.maHS);
      }
    });

    if (duplicates.length > 0) {
      setDuplicateWarningData({
        pendingRule: rule,
        duplicateStudents: duplicates,
        safeStudentIds: safeIds,
      });
      return;
    }

    commitRecords(targetStudents, rule, extraNote, date, buoi, false, hocKi, tuanHoc);
  };

  const handleConfirmVoid = () => {
    if (!voidModalRecord || !voidReason.trim() || !onVoidRecord) return;
    onVoidRecord(voidModalRecord.maGhiNhan, voidReason.trim());
    setVoidModalRecord(null);
    setVoidReason('');
  };

  const getRemainingHours = (isoTime: string) => {
    const recordTime = new Date(isoTime).getTime();
    const now = new Date().getTime();
    const limitMs = settings.thoiHanSuaHuyPhut * 60 * 1000;
    const diff = (recordTime + limitMs) - now;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  };

  const myAcademicRecord = useMemo(() => {
    return (academicRecords || []).find(r => r.maHS === currentStudent.maHS);
  }, [academicRecords, currentStudent.maHS]);
  const [selectedRecordForExplanation, setSelectedRecordForExplanation] = useState<DisciplineRecord | null>(null);
  const [explanationText, setExplanationText] = useState('');
  const [showCadreModal, setShowCadreModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

  // Hỗ trợ nút quay lại trên điện thoại (Hardware/Browser Back Button)
  useEffect(() => {
    // Đẩy lịch sử khi mở tab phụ hoặc mở popup/modal để nút Back bắt được
    if (activeTab !== 'my_score') {
      window.history.pushState({ studentTab: activeTab }, '', '');
    }

    const handlePopState = () => {
      // Đóng các popup cài đặt / vinh danh trước nếu đang mở
      if (showSettingsModal) {
        setShowSettingsModal(false);
        return;
      }
      if (showAvatarModal) {
        setShowAvatarModal(false);
        return;
      }
      if (showPasswordModal) {
        setShowPasswordModal(false);
        return;
      }
      if (showCadreModal) {
        setShowCadreModal(false);
        return;
      }
      // Quay về màn hình chính của học sinh
      setActiveTab('my_score');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab, showSettingsModal, showAvatarModal, showPasswordModal, showCadreModal]);

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

  // Class Individual Official Ranking (Thuật toán xếp hạng chuẩn: cùng điểm thì cùng xếp hạng)
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

    return calculateDenseRankings(
      list,
      item => item.score,
      item => item.deductions,
      item => item.bonuses
    );
  }, [allStudents, studentPeriodSummaries, settings.diemKhoiDau]);

  // Current Student Rank & Frame
  const myRankItem = useMemo(() => {
    return officialClassRankings.find(item => item.student.maHS === currentStudent.maHS);
  }, [officialClassRankings, currentStudent.maHS]);

  const myRank = myRankItem ? myRankItem.officialRank : 1;

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
      list = list.filter(item => item.xepLoai === rankingRatingFilter);
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
    const canCoGangCount = displayedRankings.filter(item => item.xepLoai === 'ChuaDat').length;
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
    onSubmitExplanation?.(selectedRecordForExplanation.maGhiNhan, explanationText.trim());
    setSelectedRecordForExplanation(null);
    setExplanationText('');
  };

  const studentBanner = useMemo(() => {
    return getCadreBanner(primaryCadreRole, currentStudent.toTruongTo || currentStudent.to);
  }, [primaryCadreRole, currentStudent]);

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn">
      {/* Integrated Banner Header (Replaces separate top header on mobile & desktop) */}
      <div className="relative overflow-hidden rounded-3xl border border-token shadow-md bg-surface">
        <div className="relative min-h-[145px] sm:min-h-[155px] w-full overflow-hidden flex flex-col justify-between p-3.5 sm:p-4">
          {studentBanner.imageSrc ? (
            <img
              src={studentBanner.imageSrc}
              alt={studentBanner.roleName}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className={`absolute inset-0 w-full h-full bg-gradient-to-r ${studentBanner.gradientFallback}`} />
          )}
          {/* Deep dark gradient overlay ensures all text is crisp and never sunken */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />

          {/* Top Row: Logo, Title horizontal, and Logout button */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div 
              className="flex items-center gap-2 min-w-0 cursor-pointer group select-none"
              onClick={() => setActiveTab('my_score')}
              title="Bấm vào logo để về màn hình chính"
            >
              <Logo10A5 size="sm" animate={false} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-black tracking-tight text-white drop-shadow-md uppercase whitespace-nowrap truncate group-hover:text-amber-300 transition-colors">
                  TRƯỜNG THPT SỐ 2 ĐỨC PHỔ
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-semibold text-slate-300 drop-shadow leading-none">
                  Năm học 2026-2027
                </span>
              </div>
            </div>

            {/* Quick Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1 rounded-xl bg-rose-500/50 hover:bg-rose-600/80 border border-rose-300/40 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 backdrop-blur-md shrink-0"
                title="Đăng xuất khỏi tài khoản"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-200" />
                <span>Thoát</span>
              </button>
            )}
          </div>

          {/* Bottom Area: Week Selector (ép sang trái) + Role Badge & Slogan */}
          <div className="relative z-10 pt-2 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Interactive Week Capsule Selector: Chỉ có Lớp trưởng, Bí thư, Lớp phó học tập mới có quyền đổi tuần */}
              {canChangeCurrentWeek && onChangeCurrentWeek ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/50 hover:bg-black/70 border border-white/25 text-amber-300 font-extrabold text-[11px] shadow-xs backdrop-blur-md transition-all">
                  <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <select
                    value={currentWeek}
                    onChange={e => {
                      const newW = Number(e.target.value);
                      if (newW !== currentWeek) {
                        setPendingWeekChange(newW);
                      }
                    }}
                    className="bg-transparent text-white font-bold cursor-pointer focus:outline-none pr-0.5 text-[11px]"
                    title="Chạm để chuyển tuần học (Chỉ dành cho Lớp trưởng, Bí thư, LP Học tập)"
                  >
                    {Array.from({ length: 38 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w} className="bg-slate-900 text-white font-semibold">
                        Tuần {w} {w <= 19 ? '(HK1)' : '(HK2)'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/40 border border-white/20 text-amber-300 font-extrabold text-[11px] shadow-xs backdrop-blur-md">
                  <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Tuần {currentWeek} {currentWeek <= 19 ? '(HK1)' : '(HK2)'}</span>
                </div>
              )}

              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-xs ${studentBanner.accentBadge}`}>
                {studentBanner.roleName}
              </span>
            </div>

            {/* Slogan with customizable text, icon, color, style */}
            <div className="flex items-center gap-1.5 text-[11px] text-white/95 font-semibold drop-shadow-md">
              <span
                style={{
                  color: settings?.bannerSloganColor || '#ffffff',
                  fontStyle: (settings?.bannerSloganStyle ?? 'italic') === 'italic' ? 'italic' : 'normal',
                  fontWeight: (settings?.bannerSloganStyle ?? 'italic') === 'bold' ? 800 : 600,
                }}
              >
                "{settings?.bannerSloganText || 'Chăm ngoan - Sáng tạo - Đoàn kết vững bước tương lai'} {settings?.bannerSloganIcon || '🌟'}"
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Student Nav Tabs: Đối với Ban cán sự chia làm 2 hàng gọn gàng trên điện thoại */}
      {isCadre ? (
        <div className="flex flex-col gap-1.5 p-1.5 bg-surface-2 rounded-2xl border border-token w-full max-w-xl mx-auto shadow-2xs">
          {/* HÀNG 1 (Cán sự & Cá nhân): Ghi vi phạm | Sổ ghi | Của tôi */}
          <div className="grid grid-cols-3 gap-1.5 w-full">
            <button
              onClick={() => setActiveTab('record')}
              className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                activeTab === 'record'
                  ? 'bg-rose-500 text-white shadow-sm font-black'
                  : 'bg-surface text-rose-600 dark:text-rose-400 hover:bg-surface-2 border border-rose-200 dark:border-rose-900/50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span>Ghi vi phạm</span>
            </button>

            <button
              onClick={() => setActiveTab('my_log')}
              className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                activeTab === 'my_log'
                  ? 'bg-sky-600 text-white shadow-sm font-black'
                  : 'bg-surface text-sky-600 dark:text-sky-400 hover:bg-surface-2 border border-sky-200 dark:border-sky-900/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Sổ ghi ({filteredMyRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('my_score')}
              className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                activeTab === 'my_score'
                  ? 'bg-surface text-main shadow-xs ring-2 ring-accent font-black'
                  : 'bg-surface/80 text-muted hover:text-main'
              }`}
            >
              <User className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Của tôi</span>
            </button>
          </div>

          {/* HÀNG 2 (Xem chung lớp học): Điểm | Huy hiệu | Sơ đồ | Thi đua */}
          <div className="grid grid-cols-4 gap-1 w-full pt-1 border-t border-token/50">
            <button
              onClick={() => setActiveTab('grades')}
              className={`py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'grades'
                  ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black text-accent'
                  : 'text-muted hover:text-main'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Điểm</span>
              {!settings.choPhepXemDiemMon && <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
            </button>

            <button
              onClick={() => setActiveTab('badges')}
              className={`py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'badges'
                  ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black text-amber-600 dark:text-amber-400'
                  : 'text-muted hover:text-main'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Huy hiệu</span>
            </button>

            <button
              onClick={() => setActiveTab('seating')}
              className={`py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'seating'
                  ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black text-purple-600 dark:text-purple-400'
                  : 'text-muted hover:text-main'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Sơ đồ</span>
            </button>

            <button
              onClick={() => setActiveTab('ranking')}
              className={`py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ranking'
                  ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black text-emerald-600 dark:text-emerald-400'
                  : 'text-muted hover:text-main'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Thi đua</span>
            </button>
          </div>
        </div>
      ) : (
        /* Regular Student Nav Tabs (5 tabs 1 hàng gọn gàng) */
        <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-2xl border border-token w-full max-w-xl mx-auto overflow-x-auto scrollbar-none justify-between">
          <button
            onClick={() => setActiveTab('my_score')}
            className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'my_score' 
                ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black' 
                : 'text-muted hover:text-main'
            }`}
          >
            <User className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Của tôi</span>
          </button>

          <button
            onClick={() => setActiveTab('grades')}
            className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'grades' 
                ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black text-accent' 
                : 'text-muted hover:text-main'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Điểm</span>
            {!settings.choPhepXemDiemMon && (
              <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'badges' 
                ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black text-amber-600 dark:text-amber-400' 
                : 'text-muted hover:text-main'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Huy hiệu</span>
          </button>

          <button
            onClick={() => setActiveTab('seating')}
            className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'seating' 
                ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black text-purple-600 dark:text-purple-400' 
                : 'text-muted hover:text-main'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Sơ đồ</span>
          </button>

          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'ranking' 
                ? 'bg-surface text-main shadow-xs ring-1 ring-token font-black text-emerald-600 dark:text-emerald-400' 
                : 'text-muted hover:text-main'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Thi đua</span>
          </button>
        </div>
      )}

      {/* TAB 1: CỦA TÔI */}
      {activeTab === 'my_score' && (
        <div className="space-y-4">
          {/* Main Score & Profile Card */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-surface border border-token shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Avatar with Custom Frame, Photo & Camera Upload Button - Enlarged on mobile */}
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
                  size="xl"
                  className="w-20 h-20 sm:w-24 sm:h-24 cursor-pointer group"
                >
                  {currentStudent.avatarUrl ? (
                    <img
                      src={currentStudent.avatarUrl}
                      alt={currentStudent.hoTen}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                      onClick={() => setShowAvatarModal(true)}
                    />
                  ) : (
                    <div
                      onClick={() => setShowAvatarModal(true)}
                      className={`w-full h-full rounded-full flex flex-col items-center justify-center font-black p-1 text-center select-none ${
                        currentStudent.gioiTinh === 'Nu'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      <span className="text-sm font-black leading-tight">
                        {currentStudent.tenRutGon || currentStudent.hoTen.split(' ').slice(-1)[0]}
                      </span>
                    </div>
                  )}
                </AvatarFrame>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-main leading-tight truncate">
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

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-muted">
                    Tổ {currentStudent.to}
                  </span>
                  <span className="text-muted/40">•</span>
                  {/* Unified Cài Đặt Button */}
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(true)}
                    className="px-2.5 py-1 rounded-xl bg-surface-2 hover:bg-surface-3 border border-token text-[11px] font-bold text-main transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-accent active:scale-95"
                    title="Cài đặt tài khoản: Đổi ảnh đại diện, đổi huy hiệu, đổi mật khẩu"
                  >
                    <Settings className="w-3 h-3 text-accent" />
                    <span>Cài đặt tài khoản</span>
                  </button>
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

          

          {/* Period Summary Statistics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-surface border border-token">
              <span className="text-[10.5px] sm:text-[11px] text-muted font-medium">Tổng điểm trừ</span>
              <div className="text-base sm:text-lg font-bold text-[var(--st-bad)] mt-0.5">-{myPeriodSummary.tongDiemTru}đ</div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-surface border border-token">
              <span className="text-[10.5px] sm:text-[11px] text-muted font-medium">Điểm cộng bù</span>
              <div className="text-base sm:text-lg font-bold text-[var(--st-ok)] mt-0.5">+{myPeriodSummary.tongDiemCong}đ</div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-surface border border-token">
              <span className="text-[10.5px] sm:text-[11px] text-muted font-medium">Tổng số lỗi</span>
              <div className="text-base sm:text-lg font-bold text-main mt-0.5">{myPeriodSummary.soLoi} lỗi</div>
            </div>
          </div>

          {/* 4-Row Weekly Discipline Log: Tuần hiện tại & 3 tuần liền kề gần nhất */}
          <div className="bg-surface rounded-3xl border border-token overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-token flex items-center justify-between flex-wrap gap-2 bg-surface-2/40">
              <h3 className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-accent" />
                <span>Nhật ký nề nếp cá nhân (4 tuần gần nhất)</span>
              </h3>
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
                                <Check className="w-3 h-3" /> Chưa có ghi nhận vi phạm
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
                              <span>Chưa có ghi nhận vi phạm</span>
                            </p>
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

      {/* CADRE TAB 1: GHI NHẬN VI PHẠM */}
      {isCadre && activeTab === 'record' && (
        <div className="space-y-3">
          <StudentPicker
            students={allStudents}
            layout={layout}
            studentSummaries={studentSummaries}
            selectedStudentIds={selectedStudentIds}
            onSelectStudent={handleSelectStudent}
            viewerRole={primaryCadreRole}
            viewerTo={primaryCadreRole === 'TT' ? (currentStudent.toTruongTo || currentStudent.to) : undefined}
            showStatusColors={true}
            isMultiSelect={isMultiSelect}
            onToggleMultiSelect={() => {
              setIsMultiSelect(!isMultiSelect);
              if (isMultiSelect) setSelectedStudentIds([]);
            }}
            fastSaveEnabled={fastSaveEnabled}
            onToggleFastSave={() => setFastSaveEnabled(!fastSaveEnabled)}
          />

          {isMultiSelect && selectedStudentIds.length > 0 && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md bg-primary text-on-primary rounded-2xl shadow-2xl p-3 border border-token flex items-center justify-between animate-slide-up">
              <div className="text-xs font-semibold">
                Đã chọn <strong className="text-accent underline">{selectedStudentIds.length}</strong> học sinh
              </div>
              <button
                type="button"
                onClick={() => setIsBottomSheetOpen(true)}
                className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-xs hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-1.5"
              >
                <span>Tiếp tục chọn lỗi</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CADRE TAB 2: SỔ GHI CỦA TÔI */}
      {isCadre && activeTab === 'my_log' && (
        <div className="space-y-3">
          <PeriodFilterComponent
            filter={logPeriodFilter}
            onChangeFilter={setLogPeriodFilter}
            compact={true}
          />

          <div className="bg-surface rounded-3xl border border-token overflow-hidden shadow-xs">
            <div className="px-4 py-3.5 border-b border-token flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-main uppercase tracking-wider">
                  Sổ ghi nhận nề nếp của bạn
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  Có thể sửa hoặc hủy trong thời hạn 24 giờ kể từ thời điểm ghi
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-2 text-muted">
                {filteredMyRecords.length} lượt
              </span>
            </div>

            <div className="divide-y divide-token">
              {filteredMyRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[var(--st-ok)] mx-auto" />
                  <p>Không có lượt ghi nhận nào trong khoảng thời gian đã chọn.</p>
                </div>
              ) : (
                filteredMyRecords.map(rec => {
                  const isVoided = rec.trangThai === 'DaHuy';
                  const remainingHours = getRemainingHours(rec.thoiGianMayChu);
                  const canModify = !isVoided && remainingHours > 0;

                  return (
                    <div key={rec.maGhiNhan} className="p-3.5 space-y-2 hover:bg-surface-2/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-main">
                              {rec.hoTen}
                            </span>
                            <span className="text-[11px] text-muted">
                              (Tổ {rec.to})
                            </span>
                            <span className="text-xs font-bold text-[var(--st-bad)]">
                              -{rec.diemSo}đ
                            </span>
                          </div>
                          <div className="text-xs font-medium text-main mt-0.5">
                            {rec.tenHanhVi}
                          </div>
                          <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                            <span>{rec.ngayHoc} ({rec.buoi === 'Sang' ? 'Sáng' : 'Chiều'})</span>
                            <span>·</span>
                            <span>Lần {rec.lanThuTrongBuoi} trong buổi</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isVoided ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-2 text-muted">
                              Đã hủy
                            </span>
                          ) : canModify ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted flex items-center gap-1">
                                <Clock className="w-3 h-3 text-accent" />
                                <span>Còn {remainingHours}h</span>
                              </span>
                              {onVoidRecord && (
                                <button
                                  type="button"
                                  onClick={() => setVoidModalRecord(rec)}
                                  className="p-1.5 rounded-lg text-[var(--st-bad)] hover:bg-[var(--st-bad)]/10 transition-colors cursor-pointer"
                                  title="Hủy bản ghi này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted">
                              Đã hết hạn 24h
                            </span>
                          )}
                        </div>
                      </div>

                      {rec.lyDoHuy && (
                        <div className="text-[10px] text-[var(--st-bad)] italic bg-[var(--st-bad)]/5 p-2 rounded-xl border border-[var(--st-bad)]/20">
                          <strong>Lý do hủy:</strong> {rec.lyDoHuy}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
                  <span>Bộ sưu tập huy hiệu</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Đã mở khóa: <strong>{myBadges.filter(b => b.unlocked).length}</strong> / {myBadges.length} huy hiệu
                </p>
              </div>

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
                ⭐ Cán sự & Lớp (7)
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
                                Đang mang
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
                                <X className="w-3 h-3 stroke-[3]" />
                                <span>Tháo ra</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Mang vào</span>
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
          <div className="bg-surface p-1 sm:p-4 rounded-3xl border border-token space-y-3">
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
                <span>⭐ Vị trí của bạn: {myRank === 1 ? '🥇 Hạng 1' : myRank === 2 ? '🥈 Hạng 2' : myRank === 3 ? '🥉 Hạng 3' : `Hạng #${myRank}`}{myRankItem?.isTied ? ' (Đồng hạng)' : ''} ({myPeriodSummary.diemTrungBinh}đ)</span>
              </button>

              </div>
          </div>

          {/* Sắp xếp Toolbar (Gọn gàng 1 dòng dropdown) */}
          <div className="p-3 sm:p-4 border-b border-token bg-surface space-y-2.5">
            <div className="flex items-center justify-between gap-2">
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
                            className={`w-full h-full rounded-full flex items-center justify-center font-bold text-[10px] text-center px-0.5 leading-tight truncate ${
                              item.student.gioiTinh === 'Nu'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {item.student.tenRutGon || item.student.hoTen.split(' ').slice(-1)[0]}
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
                              {officialRank === 1 ? (item.isTied ? '🥇 Đồng hạng 1' : '🥇 Hạng 1') :
                               officialRank === 2 ? (item.isTied ? '🥈 Đồng hạng 2' : '🥈 Hạng 2') :
                               officialRank === 3 ? (item.isTied ? '🥉 Đồng hạng 3' : '🥉 Hạng 3') :
                               (item.isTied ? `Đồng hạng #${officialRank}` : `Hạng #${officialRank}`)}
                            </span>
                          )}

                          {officialRank === 1 && rankingSortBy === 'score_desc' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                              {item.isTied ? 'ĐỒNG HẠNG 1' : 'TOP 1'}
                            </span>
                          )}
                          {(officialRank === 2 || officialRank === 3) && rankingSortBy === 'score_desc' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                              {item.isTied ? `ĐỒNG HẠNG ${officialRank}` : 'TOP 2-3'}
                            </span>
                          )}
                          {officialRank >= 4 && officialRank <= 10 && rankingSortBy === 'score_desc' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              {item.isTied ? `ĐỒNG HẠNG ${officialRank}` : 'TOP 10'}
                            </span>
                          )}
                          {officialRank > 10 && item.isTied && rankingSortBy === 'score_desc' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
                              ĐỒNG HẠNG #{officialRank}
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

      {/* Week Change Warning Modal (Cảnh báo chuyển tuần học cho LT, BT, LP HT) */}
      {pendingWeekChange !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-surface border border-token rounded-3xl p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-main">Xác nhận chuyển tuần</h4>
                <p className="text-[11px] text-muted">Quyền hạn Cán sự cốt cán (LT, BT, LP Học tập)</p>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              Bạn có chắc chắn muốn chuyển tuần hiện tại của cả lớp từ <strong>Tuần {currentWeek}</strong> sang <strong>Tuần {pendingWeekChange}</strong> ({pendingWeekChange <= 19 ? 'Học kỳ 1' : 'Học kỳ 2'})?
              <div className="mt-1 text-[11px] opacity-80">
                ⚠️ Việc chuyển tuần sẽ cập nhật tuần làm việc hiện tại, ảnh hưởng đến việc ghi nhận nề nếp và thống kê thi đua của toàn bộ học sinh.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingWeekChange(null)}
                className="px-3.5 py-2 rounded-xl bg-surface-2 text-muted hover:text-main text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onChangeCurrentWeek && pendingWeekChange !== null) {
                    onChangeCurrentWeek(pendingWeekChange);
                  }
                  setPendingWeekChange(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Xác nhận chuyển
              </button>
            </div>
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

      {/* Cài đặt tài khoản Modal (Unified Settings for ALL students) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 space-y-4 animate-scale-up text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Cài đặt tài khoản</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick profile preview */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200">
                {currentStudent.avatarUrl ? (
                  <img src={currentStudent.avatarUrl} alt={currentStudent.hoTen} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center font-bold text-xs text-center px-0.5 leading-tight truncate ${
                    currentStudent.gioiTinh === 'Nu' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {currentStudent.tenRutGon || currentStudent.hoTen.split(' ').slice(-1)[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900 truncate">{currentStudent.hoTen}</div>
                <div className="text-[11px] text-slate-500 font-medium">Tổ {currentStudent.to} · STT #{currentStudent.viTriGhe || currentStudent.maHS}</div>
              </div>
            </div>

            {/* Menu options */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowAvatarModal(true);
                }}
                className="w-full p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600">Đổi ảnh đại diện</div>
                    <div className="text-[10.5px] text-slate-500">Chọn từ kho 40 avatar hoặc tải ảnh lên</div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-indigo-600 text-xs">→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setActiveTab('badges');
                }}
                className="w-full p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-300 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 group-hover:text-amber-600">Đổi huy hiệu danh dự</div>
                    <div className="text-[10.5px] text-slate-500">Mang vào / tháo ra huy hiệu thi đua</div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-amber-600 text-xs">→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowPasswordModal(true);
                }}
                className="w-full p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-600">Đổi mật khẩu</div>
                    <div className="text-[10.5px] text-slate-500">Cập nhật mật khẩu bảo mật cá nhân (Mặc định: 123456)</div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-600 text-xs">→</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    onLogout();
                  }}
                  className="w-full p-3 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-rose-700">Đăng xuất tài khoản</div>
                      <div className="text-[10.5px] text-rose-500">Thoát khỏi phiên làm việc hiện tại</div>
                    </div>
                  </div>
                  <span className="text-rose-600 text-xs">→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cadre Record Bottom Sheet */}
      <RecordBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => {
          setIsBottomSheetOpen(false);
          if (!isMultiSelect) setSelectedStudentIds([]);
        }}
        students={isMultiSelect ? selectedStudents : (singleSelectedStudent ? [singleSelectedStudent] : [])}
        rules={rules}
        allowBonus={settings.batDiemCong}
        initialWeek={currentWeek}
        onSave={(payload) => {
          handleAttemptSubmitRule(
            payload.rule, 
            payload.note, 
            payload.date, 
            payload.session, 
            payload.hocKi, 
            payload.tuanHoc
          );
        }}
        currentUserRole={primaryCadreRole}
        existingRecords={records}
      />

      {/* Cadre Duplicate Warning Modal */}
      {duplicateWarningData && (
        <DuplicateWarningModal
          isOpen={true}
          onClose={() => setDuplicateWarningData(null)}
          onConfirm={(confirmedStudents) => {
            commitRecords(
              confirmedStudents,
              duplicateWarningData.pendingRule,
              undefined,
              undefined,
              undefined,
              true
            );
          }}
          selectedStudents={isMultiSelect ? selectedStudents : (singleSelectedStudent ? [singleSelectedStudent] : [])}
          selectedRule={duplicateWarningData.pendingRule}
          existingRecordsByStudent={
            duplicateWarningData.duplicateStudents.reduce((acc, item) => {
              acc[item.student.maHS] = item.existingRecords;
              return acc;
            }, {} as Record<string, DisciplineRecord[]>)
          }
        />
      )}

      {/* Cadre Void Record Confirmation Modal */}
      {voidModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-surface border border-token rounded-3xl shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-token pb-2.5">
              <h4 className="text-sm font-bold text-main">
                Hủy bản ghi vi phạm 🗑️
              </h4>
              <button
                onClick={() => setVoidModalRecord(null)}
                className="p-1 rounded-md text-muted hover:text-main cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted">
              Bạn đang hủy ghi nhận lỗi của <strong>{voidModalRecord.hoTen}</strong> ({voidModalRecord.tenHanhVi}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-main mb-1">
                Lý do hủy (bắt buộc):
              </label>
              <textarea
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                rows={2}
                placeholder="Ghi nhầm tên học sinh, bạn đã giải thích đúng..."
                className="w-full p-2.5 bg-surface-2 border border-token rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-token">
              <button
                type="button"
                onClick={() => setVoidModalRecord(null)}
                className="px-3 py-1.5 rounded-xl border border-token text-xs text-muted hover:text-main cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={!voidReason.trim()}
                onClick={handleConfirmVoid}
                className="px-4 py-1.5 rounded-xl bg-[var(--st-bad)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Xác nhận hủy
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
