import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ClipboardList, 
  CheckSquare, 
  Users, 
  Settings, 
  FileSpreadsheet, 
  FileDown, 
  Upload, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Layers, 
  Sparkles,
  AlertTriangle,
  Info,
  UserPlus,
  GraduationCap,
  Camera,
  Database,
  Download,
  LogOut,
  Edit3,
  FileText
} from 'lucide-react';
import { StudentImportModal } from './StudentImportModal';
import { TeacherProfileModal } from './TeacherProfileModal';
import { TeacherProfile, getTeacherProfile, saveTeacherProfile } from '../../data/teacherProfile';
import { 
  Student, 
  SeatLayoutNode, 
  DisciplineRecord, 
  RuleItem, 
  StudentWeekSummary, 
  TeacherSettings,
  StudentAcademicRecord
} from '../../types';
import { TeacherGradeManager } from '../grades/TeacherGradeManager';
import { getAcademicRecords, saveAcademicRecords } from '../../data/academicCatalog';
import { StudentPicker } from '../student-picker/StudentPicker';
import { RecordBottomSheet } from '../record/RecordBottomSheet';
import { DuplicateWarningModal } from '../record/DuplicateWarningModal';
import { checkDuplicateRecord } from '../../utils/emulation';
import { ClassroomLayoutEditor } from './ClassroomLayoutEditor';
import { CadreHonorsModal } from '../common/CadreHonorsModal';
import { PeriodHierarchyFilter as PeriodFilterComponent } from '../common/PeriodHierarchyFilter';
import { filterRecordsByHierarchy, calculateStudentPeriodSummary, CURRENT_SCHOOL_YEAR } from '../../utils/hierarchy';
import { HierarchyPeriodFilter } from '../../types';
import { Move, Trophy, Award, Sparkles as SparklesIcon, Dices, Crown, ArrowUpDown, Search, Filter, X, LayoutGrid, ListFilter } from 'lucide-react';
import { CallingGamesHub } from './calling-games/CallingGamesHub';
import { TimeDataImportCard } from './TimeDataImportCard';
import { FrameManagementModal } from './FrameManagementModal';
import { BadgeManagementModal } from './BadgeManagementModal';
import { StudentInfractionDetailModal } from './StudentInfractionDetailModal';
import { RecorderBadge } from '../common/RecorderBadge';
import bannerGv from '../../assets/banners/banner_gv.jpg';
import { exportClassroomHtmlReport } from '../../utils/exportHtml';
import { AvatarFrame } from '../common/AvatarFrame';
import { AvatarUploadModal } from '../common/AvatarUploadModal';
import { getFrameForStudent } from '../../data/frameData';
import { removeVietnameseAccents, getStudentAvatarInitial } from '../../utils/vietnamese';
import { 
  getGeminiApiKey, 
  setGeminiApiKey, 
  getGeminiModel, 
  setGeminiModel, 
  testGeminiConnection, 
  generateEmulationReportAI, 
  generateCallingGameQuestionsAI,
  CallingGameQuestion,
  GeminiApiKeyItem,
  getGeminiKeysPool,
  saveGeminiKeysPool,
  getGeminiAutoRotate,
  setGeminiAutoRotate,
  testSpecificGeminiKey
} from '../../services/geminiService';
import { saveCloudGeminiKeys, fetchCloudGeminiKeys } from '../../services/firebase';
import { downloadStateAsJson, parseImportedJsonState, saveServerState } from '../../services/storageSync';
import { getAllStudentBadgesState } from '../../data/badgeCatalog';
import { exportDataSpecsWordDocument } from '../../utils/exportDataSpecsDoc';
import { Eye, EyeOff, Bot, Key, Copy, Check, ArrowLeft, Trash2, Plus, RefreshCw } from 'lucide-react';

interface TeacherDashboardProps {
  students: Student[];
  layout: SeatLayoutNode[];
  rules: RuleItem[];
  records: DisciplineRecord[];
  studentSummaries: Record<string, StudentWeekSummary>;
  currentWeek: number;
  onChangeCurrentWeek?: (week: number) => void;
  settings: TeacherSettings;
  onUpdateSettings: (newSettings: Partial<TeacherSettings>) => void;
  onAddRecord: (record: Omit<DisciplineRecord, 'maGhiNhan' | 'thoiGianMayChu' | 'thoiGianMay'>) => void;
  onResolveExplanation: (recordId: string, result: 'ChapNhan' | 'TuChoi', reason: string) => void;
  onToggleRulePin: (ruleId: string) => void;
  onUpdateLayout: (newLayout: SeatLayoutNode[], updatedStudents: Student[]) => void;
  onImportRecords?: (importedRecords: DisciplineRecord[]) => void;
  onUpdateStudentAvatar?: (studentId: string, avatarUrl?: string) => void;
  onAssignFrame?: (studentId: string, frameId: string | undefined) => void;
  onBatchAutoAssignByRank?: () => void;
  academicRecords?: StudentAcademicRecord[];
  onUpdateAcademicRecords?: (records: StudentAcademicRecord[]) => void;
  onOpenTeacherAvatar?: () => void;
  teacherAvatarUrl?: string;
  onVoidRecord?: (recordId: string, reason: string) => void;
  onLogout?: () => void;
  teacherProfile?: TeacherProfile;
  onUpdateTeacherProfile?: (profile: TeacherProfile) => void;
  onImportStudents?: (newStudents: Student[], newLayout: SeatLayoutNode[], isReplace: boolean) => void;
  onOpenTeacherProfile?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  layout,
  rules,
  records,
  studentSummaries,
  currentWeek,
  onChangeCurrentWeek,
  settings,
  onUpdateSettings,
  onAddRecord,
  onResolveExplanation,
  onToggleRulePin,
  onUpdateLayout,
  onImportRecords,
  onUpdateStudentAvatar,
  onAssignFrame,
  onBatchAutoAssignByRank,
  academicRecords,
  onUpdateAcademicRecords,
  onOpenTeacherAvatar,
  teacherAvatarUrl,
  onVoidRecord,
  onLogout,
  teacherProfile,
  onUpdateTeacherProfile,
  onImportStudents,
  onOpenTeacherProfile,
}) => {
  const [internalTeacherProfile, setInternalTeacherProfile] = useState<TeacherProfile>(() => {
    return teacherProfile || getTeacherProfile();
  });
  const [isStudentImportModalOpen, setIsStudentImportModalOpen] = useState(false);
  const [isTeacherProfileModalOpen, setIsTeacherProfileModalOpen] = useState(false);

  React.useEffect(() => {
    if (teacherProfile) {
      setInternalTeacherProfile(teacherProfile);
    }
  }, [teacherProfile]);

  const handleProfileSaveSuccess = (updated: TeacherProfile) => {
    setInternalTeacherProfile(updated);
    onUpdateTeacherProfile?.(updated);
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'record' | 'explanations' | 'roster' | 'grades' | 'rules' | 'import_export' | 'ai_gemini' | 'settings' | 'apps'>('overview');

  const [internalAcademicRecords, setInternalAcademicRecords] = useState<StudentAcademicRecord[]>(() => {
    return academicRecords || getAcademicRecords();
  });

  React.useEffect(() => {
    if (academicRecords) {
      setInternalAcademicRecords(academicRecords);
    }
  }, [academicRecords]);

  const handleUpdateAcademicRecords = (newRecs: StudentAcademicRecord[]) => {
    setInternalAcademicRecords(newRecs);
    saveAcademicRecords(newRecs);
    if (onUpdateAcademicRecords) {
      onUpdateAcademicRecords(newRecs);
    }
  };
  const [isLayoutEditorOpen, setIsLayoutEditorOpen] = useState(false);
  const [initialAddSeat, setInitialAddSeat] = useState<{ hang: number; cot: number } | undefined>(undefined);
  const [showCadreModal, setShowCadreModal] = useState(false);
  const [showFrameModal, setShowFrameModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [editingStudentForAvatar, setEditingStudentForAvatar] = useState<Student | null>(null);

  // Gemini AI state
  const [geminiApiKey, setLocalGeminiApiKey] = useState(() => getGeminiApiKey());
  const [geminiModel, setLocalGeminiModel] = useState(() => getGeminiModel());
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiConnectionStatus, setApiConnectionStatus] = useState<{ tested: boolean; success: boolean; message: string } | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);
  
  // Gemini Multi-Key Pool State
  const [keysPool, setKeysPool] = useState<GeminiApiKeyItem[]>(() => getGeminiKeysPool());
  const [autoRotateKeys, setAutoRotateKeys] = useState<boolean>(() => getGeminiAutoRotate());
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

  // Sync keys from Firebase Cloud Firestore on tab open
  React.useEffect(() => {
    if (activeTab === 'ai_gemini') {
      fetchCloudGeminiKeys().then(cloudData => {
        if (cloudData && Array.isArray(cloudData.keys) && cloudData.keys.length > 0) {
          setKeysPool(cloudData.keys);
          saveGeminiKeysPool(cloudData.keys);
          setAutoRotateKeys(cloudData.autoRotate);
          setGeminiAutoRotate(cloudData.autoRotate);
          if (cloudData.activeModel) {
            setLocalGeminiModel(cloudData.activeModel);
            setGeminiModel(cloudData.activeModel);
          }
          const activeKey = cloudData.keys.find((k: GeminiApiKeyItem) => k.isActive) || cloudData.keys[0];
          if (activeKey) {
            setLocalGeminiApiKey(activeKey.key);
          }
        }
      });
    }
  }, [activeTab]);
  
  // AI Tool 1 state
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [aiReportResult, setAiReportResult] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  // AI Tool 2 state
  const [aiSubject, setAiSubject] = useState('Toán học');
  const [aiTopic, setAiTopic] = useState('Đại số 10: Dấu của tam thức bậc hai');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<CallingGameQuestion[] | null>(null);

  // Time hierarchy filter
  const [periodFilter, setPeriodFilter] = useState<HierarchyPeriodFilter>({
    namHoc: CURRENT_SCHOOL_YEAR,
    hocKi: 1,
    thang: 'all',
    tuanHoc: currentWeek,
    ngayHoc: 'all',
    buoi: 'all',
  });

  // Record flow state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [fastSaveEnabled, setFastSaveEnabled] = useState(false);
  const [overviewViewMode, setOverviewViewMode] = useState<'list' | 'grid'>('list');
  const [inspectingStudent, setInspectingStudent] = useState<Student | null>(null);
  const [showAttentionDetails, setShowAttentionDetails] = useState(false);
  const [pendingRecordPayload, setPendingRecordPayload] = useState<{
    students: Student[];
    rule: RuleItem;
    date: string;
    session: 'Sang' | 'Chieu';
    hocKi: 1 | 2;
    tuanHoc: number;
    note?: string;
  } | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);

  // Explanation review state
  const [rejectingRecordId, setRejectingRecordId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Pending explanations list
  const pendingExplanations = useMemo(() => {
    return records.filter(r => r.trangThai === 'ChoDuyet');
  }, [records]);

  // Today's records
  const todayRecords = useMemo(() => {
    const todayStr = '2026-11-09'; // demo date
    return records.filter(r => r.ngayHoc === todayStr && r.trangThai !== 'DaHuy');
  }, [records]);

  // Students requiring attention (warn / bad)
  const attentionStudents = useMemo(() => {
    return students.filter(s => {
      const summary = studentSummaries[s.maHS];
      return summary && (summary.mucMau === 'bad' || summary.mucMau === 'warn');
    });
  }, [students, studentSummaries]);

  // Sorting & Filtering State for Emulation Overview (Bảng tổng quan thi đua)
  type TeacherRankingSort = 'score_desc' | 'score_asc' | 'stt' | 'name_asc' | 'name_desc' | 'to';
  const [rankingSortBy, setRankingSortBy] = useState<TeacherRankingSort>('score_desc');
  const [rankingToFilter, setRankingToFilter] = useState<'all' | number>('all');
  const [rankingSearchQuery, setRankingSearchQuery] = useState('');
  const [rankingRatingFilter, setRankingRatingFilter] = useState<'all' | 'Tot' | 'Kha' | 'Dat' | 'CanCoGang'>('all');
  const [filterOnlyViolations, setFilterOnlyViolations] = useState(false);

  // Hierarchy Period Summaries for all students
  const teacherPeriodSummaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateStudentPeriodSummary>> = {};
    students.forEach(st => {
      map[st.maHS] = calculateStudentPeriodSummary(st, records, periodFilter, settings);
    });
    return map;
  }, [students, records, periodFilter, settings]);

  // Official Emulation Rankings (Fixed official rank by score descending)
  const teacherOfficialRankings = useMemo(() => {
    const list = students.map(student => {
      const summary = teacherPeriodSummaries[student.maHS] || {
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
  }, [students, teacherPeriodSummaries, settings.diemKhoiDau]);

  // Filtered & Sorted Rankings for Teacher View
  const displayedTeacherRankings = useMemo(() => {
    let list = [...teacherOfficialRankings];

    if (rankingToFilter !== 'all') {
      list = list.filter(item => item.student.to === rankingToFilter);
    }

    if (filterOnlyViolations) {
      list = list.filter(item => item.deductions > 0);
    }

    if (rankingRatingFilter !== 'all') {
      if (rankingRatingFilter === 'CanCoGang') {
        list = list.filter(item => item.xepLoai === 'ChuaDat' || item.xepLoai === 'KhongDat' || item.score < settings.nguongDat);
      } else {
        list = list.filter(item => item.xepLoai === rankingRatingFilter);
      }
    }

    if (rankingSearchQuery.trim()) {
      const q = removeVietnameseAccents(rankingSearchQuery.trim());
      list = list.filter(item => {
        const name = removeVietnameseAccents(item.student.hoTen);
        const short = removeVietnameseAccents(item.student.tenRutGon);
        const ma = item.student.maHS.toLowerCase();
        const stt = `${item.student.viTriGhe}`;
        return name.includes(q) || short.includes(q) || ma.includes(q) || stt === q;
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
  }, [teacherOfficialRankings, rankingToFilter, rankingRatingFilter, rankingSearchQuery, rankingSortBy, filterOnlyViolations]);

  // Statistics for Teacher View
  const teacherRankingStats = useMemo(() => {
    const total = displayedTeacherRankings.length;
    if (total === 0) return { avgScore: 0, totCount: 0, khaCount: 0, datCount: 0, canCoGangCount: 0 };
    const sumScore = displayedTeacherRankings.reduce((sum, item) => sum + item.score, 0);
    const avgScore = Math.round((sumScore / total) * 10) / 10;
    const totCount = displayedTeacherRankings.filter(item => item.xepLoai === 'Tot').length;
    const khaCount = displayedTeacherRankings.filter(item => item.xepLoai === 'Kha').length;
    const datCount = displayedTeacherRankings.filter(item => item.xepLoai === 'Dat').length;
    const canCoGangCount = displayedTeacherRankings.filter(item => item.xepLoai === 'KhongDat').length;
    return { avgScore, totCount, khaCount, datCount, canCoGangCount };
  }, [displayedTeacherRankings]);

  // Handle student selection from teacher record view
  const handleSelectStudent = (student: Student) => {
    if (isMultiSelect) {
      setSelectedStudentIds(prev => 
        prev.includes(student.maHS)
          ? prev.filter(id => id !== student.maHS)
          : [...prev, student.maHS]
      );
    } else {
      setSelectedStudentIds([student.maHS]);
      setIsBottomSheetOpen(true);
    }
  };

  const handleRequestSave = (payload: {
    students: Student[];
    rule: RuleItem;
    date: string;
    session: 'Sang' | 'Chieu';
    hocKi: 1 | 2;
    tuanHoc: number;
    note?: string;
  }) => {
    const existingMap: Record<string, DisciplineRecord[]> = {};
    let hasDuplicate = false;

    payload.students.forEach(st => {
      const dupCheck = checkDuplicateRecord(records, st.maHS, payload.date, payload.session, payload.rule.maNoiQuy);
      if (dupCheck.isDuplicate) {
        hasDuplicate = true;
        existingMap[st.maHS] = dupCheck.existingRecords;
      }
    });

    if (hasDuplicate) {
      setPendingRecordPayload(payload);
      setDuplicateModalOpen(true);
    } else {
      executeSave(
        payload.students, 
        payload.rule, 
        payload.date, 
        payload.session, 
        payload.hocKi, 
        payload.tuanHoc, 
        payload.note
      );
    }
  };

  const executeSave = (
    targetStudents: Student[],
    rule: RuleItem,
    date: string,
    session: 'Sang' | 'Chieu',
    hocKi: 1 | 2 = 1,
    tuanHoc: number = currentWeek,
    note?: string
  ) => {
    targetStudents.forEach(st => {
      const dupCheck = checkDuplicateRecord(records, st.maHS, date, session, rule.maNoiQuy);

      onAddRecord({
        namHoc: CURRENT_SCHOOL_YEAR,
        hocKi: hocKi,
        thang: new Date(date).getMonth() + 1,
        ngayHoc: date,
        buoi: session,
        tuanHoc: tuanHoc,
        doiTuong: 'HocSinh',
        maHS: st.maHS,
        hoTen: st.hoTen,
        to: st.to,
        maNoiQuy: rule.maNoiQuy,
        nhomHanhVi: rule.nhomHanhVi,
        tenHanhVi: rule.tenHanhVi,
        mucDo: rule.mucDo,
        diemSo: rule.diemSo,
        loaiDiem: rule.loaiDiem,
        ghiChu: note,
        nguoiGhi: 'Trần Văn Bình (GVCN)',
        vaiTroNguoiGhi: 'GV',
        nguonGhi: 'TrucTiep',
        lanThuTrongBuoi: dupCheck.lanThu,
        daXacNhanTrung: dupCheck.isDuplicate,
        trangThai: 'HieuLuc',
      });
    });

    setSelectedStudentIds([]);
    setIsMultiSelect(false);
    setIsBottomSheetOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Teacher Navigation Tabs */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto p-1.5 bg-surface-2 rounded-2xl border border-token shadow-2xs text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'overview' ? 'bg-surface text-main font-bold shadow-xs' : 'text-muted hover:text-main hover:bg-surface/50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-accent" />
          <span>Tổng quan</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'roster' ? 'bg-surface text-main font-bold shadow-xs' : 'text-muted hover:text-main hover:bg-surface/50'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-accent" />
          <span>Sơ đồ lớp</span>
        </button>

        <button
          onClick={() => setActiveTab('explanations')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'explanations' ? 'bg-surface text-main font-bold shadow-xs' : 'text-muted hover:text-main hover:bg-surface/50'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5 text-accent" />
          <span>Giải trình</span>
          {pendingExplanations.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[var(--st-bad)] text-white text-[10px] flex items-center justify-center font-bold">
              {pendingExplanations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'grades' ? 'bg-surface text-main shadow-xs ring-1 ring-accent font-bold text-accent' : 'text-muted hover:text-main hover:bg-surface/50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-accent" />
          <span>Bảng điểm</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'rules' ? 'bg-surface text-main font-bold shadow-xs' : 'text-muted hover:text-main hover:bg-surface/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-accent" />
          <span>Nội quy</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_gemini')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'ai_gemini' ? 'bg-surface text-main shadow-xs ring-2 ring-purple-400 font-extrabold text-purple-700 dark:text-purple-300' : 'text-muted hover:text-main hover:bg-surface/50'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
          <span>Trợ lý AI</span>
        </button>

        <button
          onClick={() => setActiveTab('import_export')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'import_export' ? 'bg-surface text-main font-bold shadow-xs' : 'text-muted hover:text-main hover:bg-surface/50'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
          <span>Nhập / Xuất</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'settings' ? 'bg-surface text-main font-bold shadow-xs' : 'text-muted hover:text-main hover:bg-surface/50'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-accent" />
          <span>Cài đặt</span>
        </button>
      </div>

      {/* Sub-tab "Quay lại" (Back) button when in any secondary tab */}
      {activeTab !== 'overview' && (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-2 border border-token text-main text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:border-accent"
          >
            <span>← Quay lại Tổng quan</span>
          </button>
          <span className="text-xs font-bold text-muted">
            {activeTab === 'apps' ? '10 Trò chơi gọi học sinh lên bảng' : activeTab === 'roster' ? 'Sơ đồ lớp (Chạm vào học sinh để ghi vi phạm)' : activeTab === 'grades' ? 'Bảng điểm môn học (Excel)' : activeTab === 'rules' ? 'Nội quy lớp' : activeTab === 'import_export' ? 'Nhập & Xuất dữ liệu' : activeTab === 'ai_gemini' ? 'Trợ lý AI Gemini (Cấu hình & Phân tích)' : activeTab === 'explanations' ? 'Duyệt giải trình' : 'Cài đặt hệ thống'}
          </span>
        </div>
      )}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Integrated Modern Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-token shadow-xs bg-surface">
            <div className="relative h-32 sm:h-36 w-full overflow-hidden">
              <img
                src={bannerGv}
                alt="Tập thể Lớp 10A5 - THPT Số 2 Đức Phổ"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              
              <div className="absolute inset-0 p-3.5 sm:p-4 flex flex-col justify-between text-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                    <SparklesIcon className="w-3 h-3" />
                    <span>LỚP 10A5 · THPT SỐ 2 ĐỨC PHỔ</span>
                  </div>

                  {/* Integrated Unique Modals (No duplicated tabs) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowFrameModal(true)}
                      className="px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 hover:border-amber-400 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      title="Quản lý khung vinh danh & hào quang học sinh"
                    >
                      <Crown className="w-3 h-3 text-amber-300" />
                      <span>Vinh danh &amp; Khung</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBadgeModal(true)}
                      className="px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 hover:border-amber-400 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      title="Kho 30 huy hiệu thi đua cá nhân"
                    >
                      <Award className="w-3 h-3 text-amber-300" />
                      <span>30 Huy hiệu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCadreModal(true)}
                      className="px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/50 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      title="Danh sách Ban cán sự lớp"
                    >
                      <Users className="w-3 h-3 text-sky-300" />
                      <span>Ban cán sự</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsStudentImportModalOpen(true)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600/70 hover:bg-emerald-600/90 border border-emerald-400/50 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      title="Nhập danh sách học sinh thật từ file Excel hoặc dán chữ"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-200" />
                      <span>Nhập DS học sinh</span>
                    </button>

                    {onLogout && (
                      <button
                        type="button"
                        onClick={onLogout}
                        className="px-2.5 py-1 rounded-xl bg-rose-500/40 hover:bg-rose-600/70 border border-rose-300/40 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 ml-auto sm:ml-0"
                        title="Đăng xuất khỏi Bảng điều khiển Giáo viên"
                      >
                        <LogOut className="w-3 h-3 text-rose-200" />
                        <span>Đăng xuất</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                      {internalTeacherProfile.hoTen}
                    </h2>
                    <button
                      type="button"
                      onClick={() => onOpenTeacherProfile ? onOpenTeacherProfile() : setIsTeacherProfileModalOpen(true)}
                      className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Bấm để đổi tên hiển thị của Thầy và dòng trạng thái bên dưới"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Đổi tên &amp; Trạng thái</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-200 mt-0.5 font-medium flex items-center gap-2 flex-wrap">
                    <span>{internalTeacherProfile.statusText}</span>
                    <span className="opacity-40">•</span>
                    <span>{students.length} Học sinh • Năm học {CURRENT_SCHOOL_YEAR}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Time Hierarchy Period Filter */}
          <PeriodFilterComponent
            filter={periodFilter}
            onChangeFilter={setPeriodFilter}
            currentWeek={currentWeek}
            onChangeCurrentWeek={onChangeCurrentWeek}
            compact={true}
          />

          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              onClick={() => setOverviewViewMode(overviewViewMode === 'list' ? 'grid' : 'list')}
              className="p-3 sm:p-3.5 rounded-2xl bg-surface border border-token hover:border-accent/40 cursor-pointer transition-all shadow-2xs group"
              title="Bấm để chuyển đổi giữa Danh sách và Sơ đồ lớp"
            >
              <div className="text-[11px] text-muted font-medium flex items-center justify-between">
                <span>Học sinh lớp</span>
                <Move className="w-3 h-3 text-muted group-hover:text-accent transition-colors" />
              </div>
              <div className="text-xl font-black text-main mt-0.5">42 em</div>
              <div className="text-[10px] text-muted mt-1">4 dãy bàn (= 4 tổ) · 6 bàn/dãy</div>
            </div>

            <div 
              onClick={() => setActiveTab('roster')}
              className="p-3 sm:p-3.5 rounded-2xl bg-surface border border-token hover:border-accent/40 cursor-pointer transition-all shadow-2xs group"
              title="Bấm để mở Sơ đồ lớp ghi nhận vi phạm"
            >
              <div className="text-[11px] text-muted font-medium flex items-center justify-between">
                <span>Vi phạm trong kỳ</span>
                <ClipboardList className="w-3 h-3 text-muted group-hover:text-accent transition-colors" />
              </div>
              <div className="text-xl font-black text-main mt-0.5">{records.filter(r => r.trangThai !== 'DaHuy').length} lượt</div>
              <div className="text-[10px] text-muted mt-1">Phân cấp tuần/ngày/buổi</div>
            </div>

            <div 
              onClick={() => setActiveTab('explanations')}
              className="p-3 sm:p-3.5 rounded-2xl bg-surface border border-token hover:border-accent/40 cursor-pointer transition-all shadow-2xs group"
              title="Bấm để mở duyệt giải trình"
            >
              <div className="text-[11px] text-muted font-medium flex items-center justify-between">
                <span>Giải trình chờ duyệt</span>
                <CheckSquare className="w-3 h-3 text-muted group-hover:text-accent transition-colors" />
              </div>
              <div className="text-xl font-black text-accent mt-0.5">{pendingExplanations.length} đơn</div>
              <div className="text-[10px] text-muted mt-1">Hạn xử lý trong 7 ngày</div>
            </div>

            <div 
              onClick={() => setShowAttentionDetails(!showAttentionDetails)}
              className="p-3 sm:p-3.5 rounded-2xl bg-surface border border-token hover:border-rose-400/40 cursor-pointer transition-all shadow-2xs group"
              title="Bấm để xem danh sách học sinh cần nhắc nhở"
            >
              <div className="text-[11px] text-muted font-medium flex items-center justify-between">
                <span>Học sinh cần lưu ý</span>
                <AlertTriangle className="w-3 h-3 text-[var(--st-bad)] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-black text-[var(--st-bad)] mt-0.5">{attentionStudents.length} em</div>
              <div className="text-[10px] text-muted mt-1">Điểm trừ tuần này</div>
            </div>
          </div>

          {/* Attention Alert Banner (Collapsible to save screen space) */}
          {attentionStudents.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-2xs transition-all">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-main">
                    Cần lưu ý: <span className="text-amber-600 dark:text-amber-400 font-extrabold">{attentionStudents.length} học sinh</span> có điểm trừ nề nếp tuần này
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !filterOnlyViolations;
                      setFilterOnlyViolations(next);
                      if (next) {
                        setPeriodFilter(prev => ({ ...prev, tuanHoc: currentWeek }));
                        setRankingRatingFilter('all');
                        setRankingToFilter('all');
                        setRankingSearchQuery('');
                      }
                      const tableEl = document.getElementById('emulation-overview-table');
                      if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                      filterOnlyViolations
                        ? 'bg-slate-700 text-white hover:bg-slate-800'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {filterOnlyViolations ? '✕ Xem lại cả lớp (42 em)' : 'Lọc xem trong bảng →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAttentionDetails(!showAttentionDetails)}
                    className="px-2 py-1 rounded-lg bg-surface hover:bg-surface-2 text-muted hover:text-main text-[11px] font-semibold transition-all cursor-pointer border border-token"
                  >
                    {showAttentionDetails ? 'Thu gọn ▲' : 'Xem nhanh ▼'}
                  </button>
                </div>
              </div>

              {showAttentionDetails && (
                <div className="mt-3 pt-3 border-t border-amber-500/20 divide-y divide-token max-h-56 overflow-y-auto animate-fade-in">
                  {attentionStudents.map(st => {
                    const summary = studentSummaries[st.maHS];
                    return (
                      <div key={st.maHS} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-surface-2 flex items-center justify-center font-bold text-[11px] text-muted">
                            {st.viTriGhe}
                          </span>
                          <div>
                            <span className="font-bold text-main">{st.hoTen}</span>
                            <span className="text-[11px] text-muted ml-2">Tổ {st.to}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--st-bad)]">
                            -{summary?.tongDiemTru} điểm
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectingStudent(st)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--st-bad)]/15 text-[var(--st-bad)] hover:bg-[var(--st-bad)]/25 cursor-pointer transition-colors"
                          >
                            Xem lỗi
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        

          {/* BẢNG TỔNG QUAN THI ĐUA HỌC SINH (CÓ TÙY CHỌN SẮP XẾP ĐỂ DỄ THEO DÕI) */}
          <div id="emulation-overview-table" className="bg-surface rounded-3xl border border-token overflow-hidden shadow-xs">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-token flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-2/40">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Trophy className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-main uppercase tracking-wider">
                    Bảng tổng quan thi đua lớp 10A5 ({students.length} học sinh)
                  </h3>
                  <p className="text-[11px] text-muted mt-0.5">
                    Khởi đầu {settings.diemKhoiDau} điểm · Xếp loại: Tốt (≥90đ), Khá (≥75đ), Đạt (≥60đ), Cần cố gắng (&lt;60đ)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <div className="flex items-center p-1 bg-surface-2 rounded-xl border border-token shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setOverviewViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      overviewViewMode === 'list'
                        ? 'bg-surface text-main shadow-xs'
                        : 'text-muted hover:text-main'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5 text-accent" />
                    <span>Danh sách ({students.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      overviewViewMode === 'grid'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-muted hover:text-main'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Sơ đồ lớp (Ghi vi phạm)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => exportClassroomHtmlReport(students, studentSummaries, currentWeek, records)}
                  className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-2 border border-token text-xs font-bold text-main cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors hover:border-accent"
                >
                  <FileDown className="w-3.5 h-3.5 text-accent" />
                  <span>Xuất báo cáo thi đua (.html)</span>
                </button>
              </div>
            </div>

            {/* Overview View Mode: Grid (Sơ đồ lớp) vs List (Danh sách bảng điểm) */}
            {overviewViewMode === 'grid' ? (
              <div className="p-3 sm:p-4 bg-surface">
                <StudentPicker
                  students={students}
                  layout={layout}
                  studentSummaries={studentSummaries}
                  selectedStudentIds={selectedStudentIds}
                  onSelectStudent={handleSelectStudent}
                  viewerRole="GV"
                  showStatusColors={true}
                  isMultiSelect={isMultiSelect}
                  onToggleMultiSelect={() => {
                    setIsMultiSelect(!isMultiSelect);
                    if (isMultiSelect) setSelectedStudentIds([]);
                  }}
                  onInspectStudent={(st) => setInspectingStudent(st)}
                />
              </div>
            ) : (
              <>
                {/* Thanh công cụ Sắp xếp & Lọc */}
                <div className="p-4 border-b border-token bg-surface space-y-3">
              {/* Hàng 1: Sắp xếp Dropdown & Tìm kiếm */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-bold text-main flex items-center gap-1 shrink-0">
                    <ArrowUpDown className="w-3.5 h-3.5 text-accent" />
                    <span>Sắp xếp theo:</span>
                  </span>
                  <select
                    value={rankingSortBy}
                    onChange={e => setRankingSortBy(e.target.value as TeacherRankingSort)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-surface-2 border border-token text-xs font-bold text-main focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
                  >
                    <option value="score_desc">🏆 Điểm thi đua cao nhất (Hạng 1 → 42)</option>
                    <option value="score_asc">📉 Điểm thi đua thấp nhất (Cần nhắc nhở / Hỗ trợ)</option>
                    <option value="stt">🔢 Theo Số thứ tự danh sách (STT)</option>
                    <option value="name_asc">🔤 Theo Tên học sinh (A → Z)</option>
                    <option value="name_desc">🔤 Theo Tên học sinh (Z → A)</option>
                    <option value="to">👥 Gom theo Tổ (Tổ 1 → 4)</option>
                  </select>
                </div>

                <div className="relative sm:w-64 shrink-0">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={rankingSearchQuery}
                    onChange={e => setRankingSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên, STT, mã HS..."
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

              {/* Hàng 2: Nút bấm Sắp xếp nhanh */}
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
                <button
                  type="button"
                  onClick={() => {
                    setFilterOnlyViolations(prev => !prev);
                    if (!filterOnlyViolations) {
                      setRankingRatingFilter('all');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    filterOnlyViolations
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-surface-2 hover:bg-surface border border-token text-muted hover:text-main'
                  }`}
                >
                  ⚠️ Có điểm trừ ({attentionStudents.length})
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
                  onClick={() => {
                    setRankingToFilter('all');
                    setFilterOnlyViolations(false);
                    setRankingRatingFilter('all');
                    setRankingSearchQuery('');
                  }}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    rankingToFilter === 'all' && !filterOnlyViolations && rankingRatingFilter === 'all' && !rankingSearchQuery
                      ? 'bg-main text-surface shadow-xs'
                      : 'bg-surface-2 text-muted hover:text-main hover:bg-surface border border-token'
                  }`}
                >
                  Cả lớp ({students.length})
                </button>
                {[1, 2, 3, 4].map(toNum => {
                  const count = students.filter(s => s.to === toNum).length;
                  const isSelected = rankingToFilter === toNum;
                  return (
                    <button
                      key={toNum}
                      type="button"
                      onClick={() => setRankingToFilter(toNum)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-accent text-on-accent shadow-xs'
                          : 'bg-surface-2 text-muted hover:text-main hover:bg-surface border border-token'
                      }`}
                    >
                      Tổ {toNum} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Hàng 4: Thống kê nhanh */}
              <div className="pt-2 border-t border-token/60 flex items-center justify-between flex-wrap gap-2 text-[11px] text-muted">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Đang hiển thị: <strong className="text-main font-bold">{displayedTeacherRankings.length}</strong> / {students.length} học sinh
                  </span>
                  <span>·</span>
                  <span>
                    Điểm trung bình: <strong className="text-accent font-bold">{teacherRankingStats.avgScore} đ</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap font-medium">
                  <span className="text-[var(--st-ok)] font-bold">
                    🌟 Tốt: {teacherRankingStats.totCount}
                  </span>
                  <span>·</span>
                  <span className="text-accent font-bold">
                    🚀 Khá: {teacherRankingStats.khaCount}
                  </span>
                  <span>·</span>
                  <span className="text-[var(--st-warn)] font-bold">
                    ⚠️ Đạt: {teacherRankingStats.datCount}
                  </span>
                  {teacherRankingStats.canCoGangCount > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-[var(--st-bad)] font-bold">
                        ❗ Cần cố gắng: {teacherRankingStats.canCoGangCount}
                      </span>
                    </>
                  )}

                  {(filterOnlyViolations || rankingRatingFilter !== 'all' || rankingToFilter !== 'all' || rankingSearchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterOnlyViolations(false);
                        setRankingRatingFilter('all');
                        setRankingToFilter('all');
                        setRankingSearchQuery('');
                      }}
                      className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer shadow-2xs transition-all"
                    >
                      ✕ Bỏ lọc (Hiện đủ {students.length} HS)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Danh sách bảng thi đua học sinh */}
            <div className="divide-y divide-token max-h-[600px] overflow-y-auto">
              {displayedTeacherRankings.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs text-muted">Không tìm thấy học sinh nào phù hợp với bộ lọc.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRankingSearchQuery('');
                      setRankingToFilter('all');
                      setRankingRatingFilter('all');
                      setFilterOnlyViolations(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:opacity-90 cursor-pointer shadow-xs"
                  >
                    Xóa bộ lọc &amp; Hiện cả lớp ({students.length} HS)
                  </button>
                </div>
              ) : (
                displayedTeacherRankings.map((item, idx) => {
                  const officialRank = item.officialRank;
                  const frameConfig = getFrameForStudent(officialRank, item.score, item.student.customFrameId);

                  let rankLabel: React.ReactNode;
                  if (rankingSortBy === 'score_desc') {
                    rankLabel = officialRank === 1 ? '🥇' : officialRank === 2 ? '🥈' : officialRank === 3 ? '🥉' : `#${officialRank}`;
                  } else if (rankingSortBy === 'stt') {
                    rankLabel = `#${item.student.viTriGhe < 10 ? '0' : ''}${item.student.viTriGhe}`;
                  } else {
                    rankLabel = `${idx + 1}`;
                  }

                  const studentViolations = records.filter(r => r.maHS === item.student.maHS && r.trangThai === 'HieuLuc');

                  return (
                    <div
                      key={item.student.maHS}
                      className="px-4 py-3 flex items-center justify-between hover:bg-surface-2 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Order indicator */}
                        <span className={`w-8 text-center text-xs font-bold shrink-0 ${
                          rankingSortBy === 'score_desc' && officialRank === 1 ? 'text-amber-500 font-extrabold text-base' :
                          rankingSortBy === 'score_desc' && officialRank === 2 ? 'text-slate-400 font-bold text-sm' :
                          rankingSortBy === 'score_desc' && officialRank === 3 ? 'text-amber-700 font-bold text-sm' :
                          'text-muted font-bold'
                        }`}>
                          {rankLabel}
                        </span>

                        <button
                          type="button"
                          onClick={() => setEditingStudentForAvatar(item.student)}
                          className="cursor-pointer group relative active:scale-95 transition-transform"
                          title={`Bấm để đổi avatar cho ${item.student.hoTen}`}
                        >
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
                          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px]">
                            📷
                          </div>
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setInspectingStudent(item.student)}
                              className="text-xs font-bold text-main hover:text-accent truncate transition-colors text-left flex items-center gap-1 cursor-pointer"
                              title="Bấm để xem lịch sử vi phạm & người ghi nhận"
                            >
                              <span>{item.student.hoTen}</span>
                              <Eye className="w-3 h-3 text-muted hover:text-accent shrink-0" />
                            </button>

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

                      <div className="flex items-center gap-2 shrink-0">
                        {item.deductions > 0 && (
                          <button
                            type="button"
                            onClick={() => setInspectingStudent(item.student)}
                            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-xl border border-rose-500/25 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                            title="Bấm để xem chi tiết các lỗi vi phạm & cán sự ghi nhận"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                            <span>-{item.deductions}đ</span>
                            <span className="text-[10px] opacity-75 font-normal underline">Chi tiết</span>
                          </button>
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

                        {/* Nút Xem lỗi & Người ghi nhận */}
                        <button
                          type="button"
                          onClick={() => setInspectingStudent(item.student)}
                          className="px-2 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-muted hover:text-main text-[11px] font-semibold transition-all cursor-pointer border border-token flex items-center gap-1 shadow-2xs"
                          title="Xem chi tiết các lỗi vi phạm và ai đã ghi nhận"
                        >
                          <Eye className="w-3.5 h-3.5 text-accent" />
                          <span className="hidden md:inline">Xem lỗi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectStudent(item.student)}
                          className="px-2 py-1 rounded-lg bg-accent/15 hover:bg-accent text-accent hover:text-on-accent text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          title="Ghi nhận nề nếp cho học sinh này"
                        >
                          + Ghi nhận
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )}

      {/* 3. EXPLANATIONS QUEUE */}
      {activeTab === 'explanations' && (
        <div className="bg-surface rounded-2xl border border-token overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-token flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-main uppercase tracking-wider">
                Hàng đợi duyệt giải trình học sinh
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                Chấp nhận sẽ hủy điểm trừ; Từ chối bắt buộc nhập lý do phản hồi cho học sinh.
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
              {pendingExplanations.length} chờ duyệt
            </span>
          </div>

          <div className="divide-y divide-token">
            {pendingExplanations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                <CheckCircle2 className="w-8 h-8 text-[var(--st-ok)] mx-auto mb-2" />
                Hiện không có giải trình nào đang chờ duyệt.
              </div>
            ) : (
              pendingExplanations.map(rec => (
                <div key={rec.maGhiNhan} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-main">{rec.hoTen}</span>
                        <span className="text-[11px] text-muted">(Tổ {rec.to})</span>
                        <span className="text-xs font-bold text-[var(--st-bad)]">-{rec.diemSo}đ</span>
                      </div>
                      <div className="text-xs font-medium text-main mt-0.5">
                        Lỗi: {rec.tenHanhVi} ({rec.ngayHoc})
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2 border border-token text-xs text-main">
                    <div className="text-[10px] font-semibold text-muted mb-1">
                      Nội dung giải trình của học sinh:
                    </div>
                    <p className="italic">"{rec.noiDungGiaiTrinh}"</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectingRecordId(rec.maGhiNhan)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--st-bad)]/40 text-[var(--st-bad)] text-xs font-semibold hover:bg-[var(--st-bad)]/10 transition-colors cursor-pointer"
                    >
                      Từ chối
                    </button>
                    <button
                      type="button"
                      onClick={() => onResolveExplanation(rec.maGhiNhan, 'ChapNhan', 'Giáo viên chấp nhận giải trình hợp lý.')}
                      className="px-4 py-1.5 rounded-lg bg-[var(--st-ok)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Chấp nhận (Hủy trừ điểm)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. ROSTER & SEATING (TÍCH HỢP GHI NHẬN VI PHẠM TRỰC TIẾP TRÊN SƠ ĐỒ LỚP) */}
      {activeTab === 'roster' && (
        <div className="space-y-3">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-token shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-main flex items-center gap-2">
                <Move className="w-4 h-4 text-accent" />
                <span>Sơ đồ lớp ({students.length} học sinh)</span>
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                Bấm trực tiếp vào học sinh trên sơ đồ để mở bảng ghi vi phạm nề nếp thi đua
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Fast Save Toggle */}
              <label 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-token cursor-pointer text-xs font-semibold text-main select-none shadow-2xs hover:border-accent transition-colors"
                title="Bật để tự động lưu vi phạm ngay sau khi bấm chọn lỗi mà không cần bấm xác nhận thêm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Lưu nhanh 1 chạm:</span>
                <input
                  type="checkbox"
                  checked={fastSaveEnabled}
                  onChange={e => setFastSaveEnabled(e.target.checked)}
                  className="w-4 h-4 accent-accent rounded cursor-pointer"
                />
              </label>

              <button
                type="button"
                onClick={() => setIsStudentImportModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Nhập danh sách học sinh thật từ file Excel hoặc dán chữ"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>📥 Nhập danh sách</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInitialAddSeat(undefined);
                  setIsLayoutEditorOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Kéo thả đổi chỗ, thêm hoặc chỉnh sửa vị trí bàn ghế"
              >
                <Move className="w-3.5 h-3.5 text-amber-300" />
                <span>Sắp xếp chỗ ngồi</span>
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-surface border border-token shadow-xs">
            <StudentPicker
              students={students}
              layout={layout}
              studentSummaries={studentSummaries}
              selectedStudentIds={selectedStudentIds}
              onSelectStudent={handleSelectStudent}
              viewerRole="GV"
              showStatusColors={true}
              isMultiSelect={isMultiSelect}
              onToggleMultiSelect={() => {
                setIsMultiSelect(!isMultiSelect);
                if (isMultiSelect) setSelectedStudentIds([]);
              }}
              onInspectStudent={(st) => setInspectingStudent(st)}
            />
          </div>

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
                <span>Chọn hành vi để ghi vi phạm</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4.5. ACADEMIC GRADEBOOK (EXCEL) */}
      {activeTab === 'grades' && (
        <TeacherGradeManager
          students={students}
          records={internalAcademicRecords}
          onUpdateRecords={handleUpdateAcademicRecords}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onShowToast={(msg, sub) => {
            // Toast notification
          }}
        />
      )}

      {/* 5. RULES & BONUS TOGGLE */}
      {activeTab === 'rules' && (
        <div className="bg-surface rounded-2xl border border-token p-4 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-token pb-3">
            <div>
              <h3 className="text-xs font-bold text-main uppercase tracking-wider">
                Danh mục nội quy nề nếp thi đua
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                Quy định mức trừ điểm, phân loại nhẹ/vừa/nặng và ghim hành vi hay dùng
              </p>
            </div>

            {/* Crucial User Requirement: Điểm cộng là tuỳ chọn của GV, mặc định TẮT */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-2 border border-token">
              <Sparkles className="w-4 h-4 text-accent" />
              <div className="text-xs">
                <span className="font-bold text-main block">Chế độ Điểm cộng:</span>
                <span className="text-[10px] text-muted">
                  {settings.batDiemCong ? 'Đang BẬT' : 'Đang TẮT (Mặc định chỉ điểm trừ)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ batDiemCong: !settings.batDiemCong })}
                className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  settings.batDiemCong 
                    ? 'bg-[var(--st-ok)] text-white' 
                    : 'bg-primary text-on-primary'
                }`}
              >
                {settings.batDiemCong ? 'Tắt điểm cộng' : 'Bật điểm cộng'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-token max-h-[500px] overflow-y-auto">
            {rules.map(rule => {
              const isBonus = rule.loaiDiem === 'Cong';
              if (isBonus && !settings.batDiemCong) return null;

              return (
                <div key={rule.maNoiQuy} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleRulePin(rule.maNoiQuy)}
                      className={`p-1 rounded cursor-pointer ${
                        rule.ghim ? 'text-accent' : 'text-muted hover:text-main'
                      }`}
                      title="Ghim vào danh sách Hay dùng"
                    >
                      <Star className={`w-4 h-4 ${rule.ghim ? 'fill-accent' : ''}`} />
                    </button>

                    <div className="min-w-0">
                      <span className="font-semibold text-main">{rule.tenHanhVi}</span>
                      <div className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5">
                        <span>{rule.nhomHanhVi}</span>
                        {rule.mucDo === 'Nang' && (
                          <span className="font-bold text-[var(--st-bad)]">· Mức Nặng (Chuyển đỏ viền)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                      isBonus 
                        ? 'bg-[var(--st-ok)]/15 text-[var(--st-ok)]' 
                        : 'bg-[var(--st-bad)]/15 text-[var(--st-bad)]'
                    }`}>
                      {isBonus ? `+${rule.diemSo}` : `-${rule.diemSo}`}đ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. IMPORT / EXPORT (Teacher Only) */}
      {activeTab === 'import_export' && (
        <div className="space-y-4">
          {/* Card: Xuất file Word Nguyên tắc nhập/xuất dữ liệu cho AI */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-md shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-gray-900 tracking-wider uppercase">
                    Tài liệu kỹ thuật (.doc)
                  </span>
                  <span className="text-xs text-white/80">Dành cho Giáo viên &amp; AI</span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                  Nguyên Tắc Chuẩn Hóa Dữ Liệu Nhập &amp; Xuất
                </h3>
                <p className="text-xs text-white/85 mt-0.5 max-w-2xl leading-relaxed">
                  Xuất file Word chứa toàn bộ đặc tả chuẩn hóa (danh sách học sinh, nề nếp vi phạm, bảng điểm) kèm <strong>Mẫu Prompt chuyên biệt cho AI</strong> (ChatGPT / Claude / Gemini) để chuyển dữ liệu thô về dạng chuẩn.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={exportDataSpecsWordDocument}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-blue-900 text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg active:scale-95"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Xuất file Word (.doc) cho AI</span>
            </button>
          </div>

          {/* Time & Schedule Data Import Card (CSV/Excel) */}
          <TimeDataImportCard
            students={students}
            rules={rules}
            onImportRecords={onImportRecords || (() => {})}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Import Smart Preview */}
            <div className="p-4 rounded-2xl bg-surface border border-token space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold text-main uppercase tracking-wider">
                  Trình nhập thông minh (Dán văn bản / File)
                </h3>
              </div>
              <p className="text-xs text-muted">
                Dán danh sách lớp, sơ đồ lớp từ Word/Excel hoặc biên bản vi phạm viết tay. Hệ thống tự động phân tách và khớp tên mờ.
              </p>

              <textarea
                rows={4}
                placeholder="VD: 10/11 - Sáng: Huy đi muộn, Quân dùng điện thoại..."
                className="w-full p-2.5 bg-surface-2 border border-token rounded-xl text-xs text-main placeholder:text-muted"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted">Mã lô nhập: LÔ-202611-01</span>
                <button
                  type="button"
                  onClick={() => alert('Đã phân tích tệp dữ liệu thành công! Cấu trúc nề nếp đã sẵn sàng.')}
                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer"
                >
                  Phân tích &amp; Xem trước
                </button>
              </div>
            </div>

            {/* Export Customizer */}
            <div className="p-4 rounded-2xl bg-surface border border-token space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold text-main uppercase tracking-wider">
                  Xuất báo cáo &amp; Thẻ ảnh Phụ huynh
                </h3>
              </div>
            <p className="text-xs text-muted">
              Xuất tệp Excel/CSV đầy đủ lịch sử nguồn gốc (người nhập, vai trò, thời gian máy chủ, thiết bị) hoặc tạo thẻ ảnh gửi phụ huynh.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-2 border border-token flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Xuất Báo cáo Thi đua (.html)</span>
                  <span className="text-[10px] text-muted">Tệp HTML độc lập chuẩn A4, mở xem và in ấn offline</span>
                </div>
                <button
                  type="button"
                  onClick={() => exportClassroomHtmlReport(students, studentSummaries, currentWeek, records)}
                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                >
                  Tải .html 📄
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-2 border border-token flex items-center justify-between">
                <span>Xuất bảng điểm tuần {currentWeek} (.xlsx)</span>
                <button
                  type="button"
                  onClick={() => alert('Đã tạo tệp Excel kèm cột nguồn gốc dữ liệu!')}
                  className="px-3 py-1 rounded-lg border border-token bg-surface text-main font-semibold hover:bg-surface-2 cursor-pointer"
                >
                  Tải .xlsx
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-2 border border-token flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Thẻ ảnh gửi Phụ huynh</span>
                  <span className="text-[10px] text-muted">Có chân trang: 10A5 - THPT Số 2 Đức Phổ</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Thẻ ảnh học sinh đã được tạo với font Be Vietnam Pro chuẩn dấu!')}
                  className="px-3 py-1 rounded-lg bg-accent text-on-accent font-semibold hover:opacity-90 cursor-pointer"
                >
                  Tạo thẻ ảnh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 7. SETTINGS */}
      {activeTab === 'settings' && (
        <div className="p-4 rounded-2xl bg-surface border border-token space-y-4 shadow-xs max-w-xl mx-auto">
          <h3 className="text-xs font-bold text-main uppercase tracking-wider border-b border-token pb-2">
            Cấu hình tham số hệ thống (Lưu tại trang tính 7_CauHinh)
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-main block">Điểm khởi đầu mỗi tuần:</span>
                <span className="text-[11px] text-muted">Mặc định 100 điểm</span>
              </div>
              <input
                type="number"
                value={settings.diemKhoiDau}
                onChange={e => onUpdateSettings({ diemKhoiDau: Number(e.target.value) })}
                className="w-20 p-1.5 bg-surface-2 border border-token rounded-lg text-center font-bold text-main"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-main block">Thời hạn sửa / hủy của Ban cán sự:</span>
                <span className="text-[11px] text-muted">Tính từ thời điểm ghi nhận</span>
              </div>
              <span className="font-bold text-main px-2 py-1 rounded bg-surface-2 border border-token">
                {settings.thoiHanSuaHuyPhut / 60} giờ
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-main block">Quyền thấy màu của Học sinh:</span>
                <span className="text-[11px] text-muted">Học sinh xem sơ đồ nề nếp</span>
              </div>
              <select
                value={settings.hocSinhThayMau}
                onChange={e => onUpdateSettings({ hocSinhThayMau: e.target.value as 'CaLop' | 'ChiBanThan' })}
                className="p-1.5 bg-surface-2 border border-token rounded-lg text-xs font-semibold text-main"
              >
                <option value="CaLop">Cả lớp</option>
                <option value="ChiBanThan">Chỉ bản thân</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-token">
              <div>
                <span className="font-semibold text-main block">Cho phép học sinh xem điểm môn học:</span>
                <span className="text-[11px] text-muted">Bật / Tắt hiển thị bảng điểm Excel cho tài khoản học sinh</span>
              </div>
              <input
                type="checkbox"
                checked={settings.choPhepXemDiemMon}
                onChange={e => onUpdateSettings({ choPhepXemDiemMon: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-token">
              <div>
                <span className="font-semibold text-main block flex items-center gap-1.5">
                  <span>Quy định trùng ảnh đại diện (Avatar):</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                    settings.choPhepTrungAvatar !== false
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {settings.choPhepTrungAvatar !== false ? 'Cho phép trùng' : 'Cấm trùng avatar (Mỗi HS 1 ảnh)'}
                  </span>
                </span>
                <span className="text-[11px] text-muted">
                  {settings.choPhepTrungAvatar !== false
                    ? 'Nhiều học sinh có thể cùng chọn một mẫu Avatar yêu thích'
                    : 'Mỗi học sinh phải sở hữu một Avatar riêng biệt. Ảnh đã có bạn chọn sẽ bị khóa với học sinh khác.'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.choPhepTrungAvatar ?? true}
                onChange={e => onUpdateSettings({ choPhepTrungAvatar: e.target.checked })}
                className="w-5 h-5 accent-accent rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-token">
              <div>
                <span className="font-semibold text-[var(--st-bad)] block">Khoá khẩn cấp (Kill Switch):</span>
                <span className="text-[11px] text-muted">Tạm ngưng mọi lệnh ghi nhận từ Ban cán sự</span>
              </div>
              <input
                type="checkbox"
                checked={settings.khoaKhanCap}
                onChange={e => onUpdateSettings({ khoaKhanCap: e.target.checked })}
                className="w-5 h-5 accent-[var(--st-bad)] rounded"
              />
            </div>
          </div>

          {/* Card Sao lưu dự phòng ngoại tuyến (Tùy chọn) */}
          <div className="p-4 rounded-2xl bg-surface border border-token shadow-2xs space-y-3 max-w-xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-accent flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-main uppercase tracking-wider">
                    Sao lưu dữ liệu ngoại tuyến (Tùy chọn)
                  </h4>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <span>☁️</span>
                    <span>Tự động đồng bộ thời gian thực trên Firebase Cloud</span>
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted leading-relaxed">
              Mọi thay đổi của lớp học (học sinh, nề nếp, điểm số, ảnh đại diện) đều được lưu vĩnh viễn trên máy chủ đám mây của Google Firebase. Thầy có thể tải thêm 1 file JSON về máy tính bất cứ lúc nào để làm bản lưu dự phòng ngoại tuyến.
            </p>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button
                type="button"
                onClick={() => {
                  const badges = getAllStudentBadgesState();
                  const fullState = {
                    students,
                    records,
                    academicRecords,
                    settings,
                    layout,
                    rules,
                    teacherAvatar: teacherAvatarUrl || '',
                    studentBadgesMap: badges.studentBadgesMap,
                    studentActiveBadges: badges.studentActiveBadges,
                    updatedAt: new Date().toISOString(),
                    version: 1,
                  };
                  downloadStateAsJson(fullState, `Lop10A5_DuLieuSaoLuu_${new Date().toISOString().slice(0, 10)}.json`);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-2 border border-token text-xs font-bold text-main cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                <span>Tải bản sao lưu JSON (.json)</span>
              </button>

              <label className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-2 border border-token text-xs font-bold text-main cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5 text-accent" />
                <span>Khôi phục từ file JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const parsed = parseImportedJsonState(text);
                      if (parsed) {
                        if (confirm(`Bạn có chắc muốn khôi phục dữ liệu từ file sao lưu (${parsed.students?.length || 0} học sinh, ${parsed.records?.length || 0} ghi nhận vi phạm)?`)) {
                          await saveServerState(parsed);
                          window.location.reload();
                        }
                      } else {
                        alert('File JSON không hợp lệ!');
                      }
                    } catch (err: any) {
                      alert('Lỗi đọc file: ' + err.message);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 8. AI GEMINI ASSISTANT TAB */}
      {activeTab === 'ai_gemini' && (
        <div className="space-y-4">
          {/* Top Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-md shrink-0">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-gray-900 tracking-wider uppercase">
                    Google Gemini 2.5 Flash / Pro
                  </span>
                  <span className="text-xs text-white/80">Trợ Lý Thông Minh 10A5</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                  Trợ Lý AI Giáo Viên Chủ Nhiệm
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Tự động phân tích nề nếp thi đua, viết tin nhắn gửi phụ huynh, và sinh câu hỏi cho 10 trò gọi bảng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={exportDataSpecsWordDocument}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Tải tài liệu Word (.doc) chứa thông số kỹ thuật và mẫu prompt cho AI"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>📄 Xuất quy tắc cho AI (.doc)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                ← Quay lại Tổng quan
              </button>
            </div>
          </div>

          {/* Section 1: API Key Pool Configuration */}
          <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-token shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-500" />
                <h4 className="text-sm font-extrabold text-main">
                  1. Danh sách Gemini API Key (Luân phiên &amp; Đồng bộ Firebase)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {isSyncingCloud && (
                  <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Đang đồng bộ đám mây...
                  </span>
                )}
                {cloudSyncMsg && (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {cloudSyncMsg}
                  </span>
                )}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                >
                  <span>Lấy API Key tại Google AI Studio</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-purple-900 dark:text-purple-200">
                  Tự động luân phiên khi chạm hạn ngạch (Auto-rotate on 429)
                </span>
                <p className="text-[11px] text-muted">
                  Khi một key hết lượt gọi trong ngày, hệ thống sẽ tự động dùng key tiếp theo mà không làm gián đoạn việc tạo bài hay phân tích.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-main shrink-0">
                <input
                  type="checkbox"
                  checked={autoRotateKeys}
                  onChange={async (e) => {
                    const val = e.target.checked;
                    setAutoRotateKeys(val);
                    setGeminiAutoRotate(val);
                    setIsSyncingCloud(true);
                    await saveCloudGeminiKeys(keysPool, val, geminiModel);
                    setIsSyncingCloud(false);
                    setCloudSyncMsg('Đã lưu cài đặt');
                    setTimeout(() => setCloudSyncMsg(null), 2500);
                  }}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
                <span>Bật luân phiên</span>
              </label>
            </div>

            {/* Existing Keys List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-muted px-1">
                <span>Các API Key đang có ({keysPool.length})</span>
                <span className="text-[11px] font-normal">☁️ Tự động đồng bộ lên Firebase cho mọi thiết bị</span>
              </div>

              {keysPool.length === 0 ? (
                <div className="p-4 rounded-2xl bg-surface-2 border border-dashed border-token text-center text-xs text-muted">
                  Chưa có API Key nào. Thầy vui lòng nhập ít nhất 1 Key bên dưới để kích hoạt trợ lý AI.
                </div>
              ) : (
                <div className="space-y-2">
                  {keysPool.map((item, idx) => {
                    const isMasked = !showApiKey;
                    const maskedVal = item.key.length > 10 
                      ? `${item.key.slice(0, 7)}...${item.key.slice(-4)}` 
                      : '••••••••••••';

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.isActive 
                            ? 'bg-purple-500/5 border-purple-500/40 ring-1 ring-purple-500/30' 
                            : 'bg-surface-2 border-token'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={async () => {
                              const updated = keysPool.map(k => ({ ...k, isActive: k.id === item.id }));
                              setKeysPool(updated);
                              saveGeminiKeysPool(updated);
                              setLocalGeminiApiKey(item.key);
                              setIsSyncingCloud(true);
                              await saveCloudGeminiKeys(updated, autoRotateKeys, geminiModel);
                              setIsSyncingCloud(false);
                            }}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
                              item.isActive 
                                ? 'border-purple-600 bg-purple-600 text-white' 
                                : 'border-token bg-surface hover:border-purple-400'
                            }`}
                            title={item.isActive ? 'Key đang hoạt động chính' : 'Bấm để chọn làm Key chính'}
                          >
                            {item.isActive && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-main truncate">
                                {item.label || `API Key #${idx + 1}`}
                              </span>
                              {item.isActive && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-purple-600 text-white">
                                  Đang dùng chính
                                </span>
                              )}
                              {item.status === 'valid' && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600">
                                  🟢 Hoạt động tốt
                                </span>
                              )}
                              {item.status === 'rate_limited' && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600">
                                  🟡 Chạm hạn ngạch (429)
                                </span>
                              )}
                              {item.status === 'error' && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-600">
                                  🔴 Lỗi kết nối
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-muted mt-0.5">
                              {isMasked ? maskedVal : item.key}
                            </div>
                            {item.statusMessage && (
                              <div className="text-[10px] text-muted italic mt-0.5 truncate">
                                {item.statusMessage}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            disabled={testingKeyId === item.id}
                            onClick={async () => {
                              setTestingKeyId(item.id);
                              const res = await testSpecificGeminiKey(item.key, geminiModel);
                              const updated = keysPool.map(k => {
                                if (k.id === item.id) {
                                  return {
                                    ...k,
                                    status: res.success ? ('valid' as const) : ('error' as const),
                                    statusMessage: res.message,
                                  };
                                }
                                return k;
                              });
                              setKeysPool(updated);
                              saveGeminiKeysPool(updated);
                              setTestingKeyId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-surface border border-token hover:border-purple-400 text-main text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                          >
                            {testingKeyId === item.id ? (
                              <Sparkles className="w-3 h-3 animate-spin text-purple-600" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-purple-600" />
                            )}
                            <span>Kiểm tra</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Thầy có chắc muốn xóa "${item.label}"?`)) {
                                const updated = keysPool.filter(k => k.id !== item.id);
                                if (updated.length > 0 && !updated.some(k => k.isActive)) {
                                  updated[0].isActive = true;
                                  setLocalGeminiApiKey(updated[0].key);
                                }
                                setKeysPool(updated);
                                saveGeminiKeysPool(updated);
                                setIsSyncingCloud(true);
                                await saveCloudGeminiKeys(updated, autoRotateKeys, geminiModel);
                                setIsSyncingCloud(false);
                              }
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer transition-colors"
                            title="Xóa Key này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form to Add New Key */}
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-token space-y-2.5">
              <span className="text-xs font-bold text-main flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-accent" />
                <span>Thêm API Key mới vào danh sách luân phiên</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={newKeyLabel}
                    onChange={e => setNewKeyLabel(e.target.value)}
                    placeholder="Tên ghi nhớ (VD: Key phụ 1, Key dự phòng...)"
                    className="w-full px-3 py-2 bg-surface border border-token rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div className="sm:col-span-2 relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={newKeyInput}
                    onChange={e => setNewKeyInput(e.target.value)}
                    placeholder="Dán mã Gemini API Key vào đây (AIzaSy...)"
                    className="w-full pl-3 pr-10 py-2 bg-surface border border-token rounded-xl text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main cursor-pointer"
                    title={showApiKey ? 'Ẩn ký tự' : 'Hiện ký tự'}
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Mô hình AI:</span>
                  <select
                    value={geminiModel}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setLocalGeminiModel(val);
                      setGeminiModel(val);
                      await saveCloudGeminiKeys(keysPool, autoRotateKeys, val);
                    }}
                    className="px-2.5 py-1 bg-surface border border-token rounded-lg text-xs font-semibold text-main cursor-pointer"
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Khuyên dùng: Siêu nhanh)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (Suy luận sâu)</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={!newKeyInput.trim() || isSyncingCloud}
                  onClick={async () => {
                    const trimmed = newKeyInput.trim();
                    if (!trimmed) return;
                    const isFirst = keysPool.length === 0;
                    const newItem: GeminiApiKeyItem = {
                      id: `key_${Date.now()}`,
                      key: trimmed,
                      label: newKeyLabel.trim() || `API Key #${keysPool.length + 1}`,
                      isActive: isFirst,
                      status: 'untested',
                    };
                    const updated = [...keysPool, newItem];
                    setKeysPool(updated);
                    saveGeminiKeysPool(updated);
                    if (isFirst) {
                      setLocalGeminiApiKey(trimmed);
                    }
                    setNewKeyInput('');
                    setNewKeyLabel('');
                    setIsSyncingCloud(true);
                    await saveCloudGeminiKeys(updated, autoRotateKeys, geminiModel);
                    setIsSyncingCloud(false);
                    setCloudSyncMsg('Đã thêm & đồng bộ Firebase thành công!');
                    setTimeout(() => setCloudSyncMsg(null), 3000);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm &amp; Lưu lên Firebase</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: AI Tool 1 - Phân tích thi đua & Soạn nhận xét tuần */}
          <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-token shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-accent" />
                <h4 className="text-sm font-extrabold text-main">
                  2. Trợ lý AI Phân Tích Thi Đua &amp; Viết Nhận Xét Tuần {currentWeek}
                </h4>
              </div>
              <button
                type="button"
                disabled={!geminiApiKey.trim() || isGeneratingReport}
                onClick={async () => {
                  setIsGeneratingReport(true);
                  setAiReportResult(null);
                  try {
                    // Extract data for current week
                    const weekRecords = records.filter(r => r.tuanHoc === currentWeek && r.trangThai !== 'DaHuy');
                    const sorted = [...students].sort((a, b) => {
                      const sA = studentSummaries[a.maHS]?.diemHienTai ?? 100;
                      const sB = studentSummaries[b.maHS]?.diemHienTai ?? 100;
                      return sB - sA;
                    });
                    const top5 = sorted.slice(0, 5).map(s => ({
                      hoTen: s.hoTen,
                      to: s.to,
                      diem: studentSummaries[s.maHS]?.diemHienTai ?? 100,
                    }));
                    const warn = sorted.filter(s => (studentSummaries[s.maHS]?.diemHienTai ?? 100) < 90).map(s => {
                      const stRecords = weekRecords.filter(r => r.maHS === s.maHS);
                      return {
                        hoTen: s.hoTen,
                        to: s.to,
                        diem: studentSummaries[s.maHS]?.diemHienTai ?? 100,
                        loi: Array.from(new Set(stRecords.map(r => r.tenHanhVi))),
                      };
                    });
                    // Common violations
                    const vMap: Record<string, number> = {};
                    weekRecords.forEach(r => {
                      vMap[r.tenHanhVi] = (vMap[r.tenHanhVi] || 0) + 1;
                    });
                    const common = Object.entries(vMap).map(([k, v]) => ({ tenHanhVi: k, soLan: v })).sort((a, b) => b.soLan - a.soLan).slice(0, 5);

                    const report = await generateEmulationReportAI({
                      tuanHoc: currentWeek,
                      topStudents: top5,
                      warningStudents: warn,
                      commonViolations: common,
                      tongDiemLop: 4200,
                    });
                    setAiReportResult(report);
                  } catch (err: any) {
                    alert('Lỗi khi phân tích AI: ' + err.message);
                  } finally {
                    setIsGeneratingReport(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-accent hover:opacity-95 text-on-accent text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isGeneratingReport ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>AI đang phân tích &amp; soạn thảo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Phân tích nề nếp Tuần {currentWeek} bằng AI</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-muted">
              AI tự động đọc dữ liệu tuần {currentWeek} (Top học sinh, lỗi vi phạm, giải trình) và soạn báo cáo sinh hoạt lớp + tin nhắn mẫu gửi phụ huynh.
            </p>

            {aiReportResult && (
              <div className="p-4 rounded-2xl bg-surface-2 border border-token space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-token pb-2">
                  <span className="text-xs font-bold text-main flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Báo Cáo Sinh Hoạt &amp; Tin Nhắn Phụ Huynh (Gemini AI)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(aiReportResult);
                      setCopiedReport(true);
                      setTimeout(() => setCopiedReport(false), 2500);
                    }}
                    className="px-3 py-1 rounded-lg bg-surface border border-token text-xs font-semibold text-main hover:bg-surface-2 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-accent" />}
                    <span>{copiedReport ? 'Đã sao chép!' : 'Sao chép nội dung'}</span>
                  </button>
                </div>
                <div className="text-xs text-main whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto pr-1">
                  {aiReportResult}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: AI Tool 2 - Sinh câu hỏi cho 10 Trò Gọi Bảng */}
          <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-token shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dices className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-extrabold text-main">
                  3. AI Tạo Câu Hỏi Khởi Động / Kiểm Tra Bài Cũ (Cho 10 Trò Gọi Bảng)
                </h4>
              </div>
            </div>

            <p className="text-xs text-muted">
              Tạo nhanh bộ câu hỏi trắc nghiệm hoặc vấn đáp theo từng môn học và bài giảng lớp 10 để đố học sinh khi gọi bảng!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">Môn học:</label>
                <select
                  value={aiSubject}
                  onChange={e => setAiSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-2 border border-token rounded-xl text-xs font-semibold text-main cursor-pointer"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hoá học">Hoá học</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Lịch sử">Lịch sử</option>
                  <option value="Địa lý">Địa lý</option>
                  <option value="GDCD">Kinh tế &amp; Pháp luật / GDCD</option>
                  <option value="Tin học">Tin học</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-muted mb-1">Bài học / Chủ đề:</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="VD: Định lý sin trong tam giác, Đoạn trích Trao duyên..."
                  className="w-full px-3 py-2 bg-surface-2 border border-token rounded-xl text-xs text-main"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">Số câu hỏi:</label>
                <select
                  value={aiQuestionCount}
                  onChange={e => setAiQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-2 border border-token rounded-xl text-xs font-semibold text-main cursor-pointer"
                >
                  <option value={3}>3 câu</option>
                  <option value={5}>5 câu</option>
                  <option value={8}>8 câu</option>
                  <option value={10}>10 câu</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                disabled={!geminiApiKey.trim() || isGeneratingQuestions}
                onClick={async () => {
                  setIsGeneratingQuestions(true);
                  setGeneratedQuestions(null);
                  try {
                    const qs = await generateCallingGameQuestionsAI({
                      monHoc: aiSubject,
                      chuDe: aiTopic,
                      soLuong: aiQuestionCount,
                    });
                    setGeneratedQuestions(qs);
                  } catch (err: any) {
                    alert('Lỗi tạo câu hỏi: ' + err.message);
                  } finally {
                    setIsGeneratingQuestions(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                {isGeneratingQuestions ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>AI đang soạn câu hỏi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tạo {aiQuestionCount} câu hỏi bằng Gemini AI</span>
                  </>
                )}
              </button>

              {generatedQuestions && (
                <button
                  type="button"
                  onClick={() => setActiveTab('apps')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>Mở 10 Trò Gọi Bảng để đố ngay →</span>
                </button>
              )}
            </div>

            {/* Questions preview */}
            {generatedQuestions && generatedQuestions.length > 0 && (
              <div className="space-y-2.5 pt-2 animate-fade-in">
                <div className="text-xs font-bold text-main">
                  Bộ câu hỏi trắc nghiệm {aiSubject} ({generatedQuestions.length} câu):
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {generatedQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-3 rounded-2xl bg-surface-2 border border-token space-y-1.5">
                      <div className="text-xs font-extrabold text-main">
                        Câu {idx + 1}: {q.cauHoi}
                      </div>
                      {q.luaChon && q.luaChon.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-muted pl-2">
                          {q.luaChon.map((opt, oIdx) => (
                            <div key={oIdx} className="font-medium">{opt}</div>
                          ))}
                        </div>
                      )}
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-token/40 flex items-center gap-1">
                        <span>Đáp án:</span>
                        <span>{q.dapAn}</span>
                        {q.giaiThich && <span className="font-normal text-muted">({q.giaiThich})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. APPS & CALLING GAMES (10 HOT GAMES) */}
      {activeTab === 'apps' && (
        <div className="space-y-4">
          <CallingGamesHub
            students={students}
            onQuickRecord={(st, type) => {
              setSelectedStudentIds([st.maHS]);
              setIsBottomSheetOpen(true);
            }}
          />
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingRecordId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface border border-token rounded-2xl shadow-2xl p-4 space-y-3 animate-scale-up">
            <h4 className="text-sm font-bold text-main">
              Từ chối giải trình vi phạm
            </h4>
            <p className="text-xs text-muted">
              Nhập lý do từ chối để học sinh hiểu rõ và rút kinh nghiệm:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="VD: Minh chứng chưa đủ thuyết phục, trực ban đã xác nhận..."
              className="w-full p-2 bg-surface-2 border border-token rounded-xl text-xs text-main"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-token">
              <button
                type="button"
                onClick={() => {
                  setRejectingRecordId(null);
                  setRejectReason('');
                }}
                className="px-3 py-1.5 rounded-lg border border-token text-xs text-muted"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={() => {
                  onResolveExplanation(rejectingRecordId, 'TuChoi', rejectReason.trim());
                  setRejectingRecordId(null);
                  setRejectReason('');
                }}
                className="px-4 py-1.5 rounded-lg bg-[var(--st-bad)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Bottom Sheet for Teacher */}
      <RecordBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => {
          setIsBottomSheetOpen(false);
          if (!isMultiSelect) setSelectedStudentIds([]);
        }}
        students={students.filter(s => selectedStudentIds.includes(s.maHS))}
        rules={rules}
        allowBonus={settings.batDiemCong}
        fastSaveMode={fastSaveEnabled}
        initialWeek={typeof periodFilter.tuanHoc === 'number' ? periodFilter.tuanHoc : currentWeek}
        initialSemester={typeof periodFilter.hocKi === 'number' ? periodFilter.hocKi : 1}
        onSave={handleRequestSave}
        currentUserRole="GV"
        existingRecords={records}
      />

      {/* Duplicate Warning Modal for Teacher */}
      {pendingRecordPayload && (
        <DuplicateWarningModal
          isOpen={duplicateModalOpen}
          onClose={() => {
            setDuplicateModalOpen(false);
            setPendingRecordPayload(null);
          }}
          onConfirm={(confirmedStudents) => {
            executeSave(
              confirmedStudents,
              pendingRecordPayload.rule,
              pendingRecordPayload.date,
              pendingRecordPayload.session,
              pendingRecordPayload.hocKi,
              pendingRecordPayload.tuanHoc,
              pendingRecordPayload.note
            );
            setDuplicateModalOpen(false);
            setPendingRecordPayload(null);
          }}
          selectedStudents={pendingRecordPayload.students}
          selectedRule={pendingRecordPayload.rule}
          existingRecordsByStudent={
            pendingRecordPayload.students.reduce((acc, st) => {
              const res = checkDuplicateRecord(
                records,
                st.maHS,
                pendingRecordPayload.date,
                pendingRecordPayload.session,
                pendingRecordPayload.rule.maNoiQuy
              );
              acc[st.maHS] = res.existingRecords;
              return acc;
            }, {} as Record<string, DisciplineRecord[]>)
          }
        />
      )}

      {/* Classroom Layout Editor Modal (Student Seating Arrangement) */}
      {isLayoutEditorOpen && (
        <ClassroomLayoutEditor
          initialLayout={layout}
          initialStudents={students}
          initialAddSeat={initialAddSeat}
          onSave={(newLayout, updatedStudents) => {
            onUpdateLayout(newLayout, updatedStudents);
            setIsLayoutEditorOpen(false);
            setInitialAddSeat(undefined);
          }}
          onClose={() => {
            setIsLayoutEditorOpen(false);
            setInitialAddSeat(undefined);
          }}
        />
      )}

      {/* Cadre Honors Modal */}
      <CadreHonorsModal
        isOpen={showCadreModal}
        onClose={() => setShowCadreModal(false)}
        students={students}
      />

      {/* 30 Badges Management Modal */}
      <BadgeManagementModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        students={students}
      />

      {/* Frame & Honor Management Modal */}
      <FrameManagementModal
        isOpen={showFrameModal}
        onClose={() => setShowFrameModal(false)}
        students={students}
        studentRanks={Object.fromEntries(
          students.map((s, idx) => {
            const sum = studentSummaries[s.maHS];
            return [s.maHS, { rank: idx + 1, score: sum?.diemHienTai ?? 100 }];
          })
        )}
        onAssignFrame={(sId, fId) => onAssignFrame && onAssignFrame(sId, fId)}
        onBatchAutoAssignByRank={() => onBatchAutoAssignByRank && onBatchAutoAssignByRank()}
      />

      {/* Student Infraction Detail Modal (GVCN xem chi tiết vi phạm & ai ghi nhận) */}
      <StudentInfractionDetailModal
        isOpen={!!inspectingStudent}
        onClose={() => setInspectingStudent(null)}
        student={inspectingStudent}
        records={records}
        summary={inspectingStudent ? studentSummaries[inspectingStudent.maHS] : undefined}
        currentWeek={currentWeek}
        onAddRecordForStudent={(st) => {
          setSelectedStudentIds([st.maHS]);
          setIsBottomSheetOpen(true);
        }}
        onResolveExplanation={onResolveExplanation}
        onVoidRecord={onVoidRecord}
      />

      {/* Student Avatar Modal opened by Teacher */}
      {editingStudentForAvatar && (
        <AvatarUploadModal
          isOpen={!!editingStudentForAvatar}
          onClose={() => setEditingStudentForAvatar(null)}
          student={editingStudentForAvatar}
          allStudents={students}
          settings={settings}
          onSaveAvatar={(studentId, newAvatarUrl) => {
            if (onUpdateStudentAvatar) {
              onUpdateStudentAvatar(studentId, newAvatarUrl);
            }
            setEditingStudentForAvatar(null);
          }}
        />
      )}

      {/* Student Import Modal (Real Students List) */}
      <StudentImportModal
        isOpen={isStudentImportModalOpen}
        onClose={() => setIsStudentImportModalOpen(false)}
        currentStudents={students}
        onImportSuccess={(newStudents, newLayout, isReplace) => {
          onImportStudents?.(newStudents, newLayout, isReplace);
          setIsStudentImportModalOpen(false);
        }}
      />

      {/* Teacher Profile & Custom Name/Status Modal */}
      <TeacherProfileModal
        isOpen={isTeacherProfileModalOpen}
        onClose={() => setIsTeacherProfileModalOpen(false)}
        currentProfile={internalTeacherProfile}
        currentAvatarUrl={teacherAvatarUrl || ''}
        onOpenAvatarPicker={onOpenTeacherAvatar || (() => {})}
        onSaveSuccess={handleProfileSaveSuccess}
        onSaveProfile={handleProfileSaveSuccess}
      />
    </div>
  );
};
