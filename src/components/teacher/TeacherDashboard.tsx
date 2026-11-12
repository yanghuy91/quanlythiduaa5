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
  FileText,
  Calendar,
  Mail
} from 'lucide-react';
import { Logo10A5 } from '../common/Logo10A5';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { resolveTeacherAvatar, DEFAULT_TEACHER_AVATAR } from '../../data/teacherAvatars';
import { resolveStudentAvatar } from '../../data/avatarPresets';
import { StudentImportModal } from './StudentImportModal';
import { UniversalSmartImportSection } from './UniversalSmartImportSection';
import { AiDataBridgeSection } from './AiDataBridgeSection';
import { TeacherProfileModal } from './TeacherProfileModal';
import { TeacherProfile, getTeacherProfile, saveTeacherProfile } from '../../data/teacherProfile';
import { 
  Student, 
  SeatLayoutNode, 
  DisciplineRecord, 
  RuleItem, 
  StudentWeekSummary, 
  TeacherSettings,
  StudentAcademicRecord,
  CadreDelegatedPermission,
  ScoreRatingTier,
  RatingColorKey,
  MailMessage
} from '../../types';
import { TeacherGradeManager } from '../grades/TeacherGradeManager';
import { ClassroomMailbox } from '../common/ClassroomMailbox';
import { getMailMessages, countUnreadMailForUser } from '../../data/mailboxStore';
import { getAcademicRecords, saveAcademicRecords } from '../../data/academicCatalog';
import { StudentPicker } from '../student-picker/StudentPicker';
import { RecordBottomSheet } from '../record/RecordBottomSheet';
import { DuplicateWarningModal } from '../record/DuplicateWarningModal';
import { 
  checkDuplicateRecord, 
  calculateDenseRankings, 
  isRecordMatchingStudent,
  getScoreRatingTiers,
  getRatingTierInfo,
  getRatingColorClasses,
  formatRatingTiersSummary,
  RATING_PRESETS,
  RATING_COLOR_PALETTE,
  classifySeverityByPoints,
  STANDARD_RULE_CATEGORIES,
  normalizeRuleCategory
} from '../../utils/emulation';
import { ClassroomLayoutEditor } from './ClassroomLayoutEditor';
import { CadreHonorsModal } from '../common/CadreHonorsModal';
import { PeriodHierarchyFilter as PeriodFilterComponent } from '../common/PeriodHierarchyFilter';
import { filterRecordsByHierarchy, calculateStudentPeriodSummary, getSemesterFromWeek, CURRENT_SCHOOL_YEAR } from '../../utils/hierarchy';
import { getVietnamMondayDateStr } from '../../utils/realtimeWeek';
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
import * as XLSX from 'xlsx';
import { exportDataSpecsWordDocument, downloadRulesExcelTemplate, parseRulesFromAoA } from '../../utils/exportDataSpecsDoc';
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
  onUpdateRules?: (newRules: RuleItem[]) => void;
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
  onUpdateRecord?: (recordId: string, updates: Partial<DisciplineRecord>) => void;
  onLogout?: () => void;
  teacherProfile?: TeacherProfile;
  onUpdateTeacherProfile?: (profile: TeacherProfile) => void;
  onImportStudents?: (newStudents: Student[], newLayout: SeatLayoutNode[], isReplace: boolean) => void;
  onOpenTeacherProfile?: () => void;
  mailMessages?: MailMessage[];
  onUpdateMailMessages?: (messages: MailMessage[]) => void;
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
  onUpdateRules,
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
  onUpdateRecord,
  onLogout,
  teacherProfile,
  onUpdateTeacherProfile,
  onImportStudents,
  onOpenTeacherProfile,
  mailMessages,
  onUpdateMailMessages,
}) => {
  const [internalTeacherProfile, setInternalTeacherProfile] = useState<TeacherProfile>(() => {
    return teacherProfile || getTeacherProfile();
  });
  const [isStudentImportModalOpen, setIsStudentImportModalOpen] = useState(false);
  const [isTeacherProfileModalOpen, setIsTeacherProfileModalOpen] = useState(false);
  const rulesFileInputRef = React.useRef<HTMLInputElement>(null);
  const [rulesUploadNotice, setRulesUploadNotice] = useState<string | null>(null);
  const [showAddRuleForm, setShowAddRuleForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleGroup, setNewRuleGroup] = useState('Học tập');
  const [newRuleType, setNewRuleType] = useState<'Tru' | 'Cong'>('Tru');
  const [newRuleScore, setNewRuleScore] = useState<number>(2);

  const handleRulesExcelUpload = async (file: File) => {
    try {
      const arrayBuf = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(arrayBuf), { type: 'array' });
      let extracted: RuleItem[] = [];
      for (const sheetName of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 }) as any[][];
        const parsed = parseRulesFromAoA(rows);
        if (parsed.length > 0) {
          extracted = parsed;
          break;
        }
      }
      if (extracted.length === 0) {
        setRulesUploadNotice('⚠️ Không tìm thấy dòng nội quy hợp lệ trong file. Vui lòng tải File Mẫu Nội Quy Lớp (.xlsx) để xem cấu trúc chuẩn.');
        return;
      }
      onUpdateRules?.(extracted);
      setRulesUploadNotice(`✅ Đã nạp thành công ${extracted.length} quy định Nội quy lớp từ file "${file.name}" làm cơ sở trừ/cộng điểm!`);
      setTimeout(() => setRulesUploadNotice(null), 6000);
    } catch (e: any) {
      setRulesUploadNotice('⚠️ Lỗi đọc file Nội quy: ' + (e?.message || 'Định dạng không hợp lệ'));
    }
  };

  const handleAddSingleRule = () => {
    if (!newRuleName.trim()) return;
    const cleanScore = Math.max(1, Math.abs(Number(newRuleScore) || 2));
    const computedSeverity = classifySeverityByPoints(cleanScore, newRuleType === 'Cong');
    const normalizedGroup = normalizeRuleCategory(newRuleGroup, newRuleName.trim(), newRuleType);
    const newItem: RuleItem = {
      maNoiQuy: `${newRuleType === 'Cong' ? 'CONG' : 'NQ'}_${Date.now().toString().slice(-4)}`,
      nhomHanhVi: normalizedGroup,
      tenHanhVi: newRuleName.trim(),
      loaiDiem: newRuleType,
      mucDo: computedSeverity,
      diemSo: cleanScore,
      ghim: true,
      thuTu: rules.length + 1,
    };
    onUpdateRules?.([newItem, ...rules]);
    setNewRuleName('');
    setShowAddRuleForm(false);
    setRulesUploadNotice(`✅ Đã thêm quy định "${newItem.tenHanhVi}" (${newItem.loaiDiem === 'Cong' ? '+' : '-'}${newItem.diemSo}đ) vào Nội quy lớp!`);
    setTimeout(() => setRulesUploadNotice(null), 5000);
  };

  React.useEffect(() => {
    if (teacherProfile) {
      setInternalTeacherProfile(teacherProfile);
    }
  }, [teacherProfile]);

  const handleProfileSaveSuccess = (updated: TeacherProfile) => {
    setInternalTeacherProfile(updated);
    onUpdateTeacherProfile?.(updated);
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'record' | 'explanations' | 'roster' | 'grades' | 'mailbox' | 'rules' | 'import_export' | 'ai_gemini' | 'settings' | 'apps'>('overview');

  const [localMailMessages, setLocalMailMessages] = useState<MailMessage[]>(() => getMailMessages());
  React.useEffect(() => {
    if (Array.isArray(mailMessages)) {
      setLocalMailMessages(mailMessages);
    }
  }, [mailMessages]);
  React.useEffect(() => {
    const syncMail = () => {
      if (!mailMessages) setLocalMailMessages(getMailMessages());
    };
    window.addEventListener('mailbox_updated', syncMail);
    return () => window.removeEventListener('mailbox_updated', syncMail);
  }, [mailMessages]);
  const unreadMailCount = useMemo(
    () => countUnreadMailForUser(mailMessages ?? localMailMessages, 'GV'),
    [mailMessages, localMailMessages]
  );

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
    hocKi: getSemesterFromWeek(currentWeek),
    thang: 'all',
    tuanHoc: currentWeek,
    ngayHoc: 'all',
    buoi: 'all',
  });

  // Sync periodFilter when currentWeek changes (e.g. after Firebase cloud hydration or week selector)
  React.useEffect(() => {
    setPeriodFilter(prev => ({
      ...prev,
      hocKi: getSemesterFromWeek(currentWeek),
      tuanHoc: currentWeek,
    }));
  }, [currentWeek]);

  // Toggle No-Data Week (Tuần không có dữ liệu)
  const handleToggleNoDataWeek = (week: number) => {
    const currentNoData = settings.noDataWeeks || [];
    const nextNoData = currentNoData.includes(week)
      ? currentNoData.filter(w => w !== week)
      : [...currentNoData, week].sort((a, b) => a - b);
    onUpdateSettings({ noDataWeeks: nextNoData });
  };

  // Toggle Cadre Delegated Permission (Phân quyền GV cho Ban cán sự)
  const handleToggleCadrePermission = (studentId: string, perm: CadreDelegatedPermission) => {
    const currentMap = settings.cadreDelegatedPermissions || {};
    const currentPerms = currentMap[studentId] || [];
    const nextPerms = currentPerms.includes(perm)
      ? currentPerms.filter(p => p !== perm)
      : [...currentPerms, perm];
    onUpdateSettings({
      cadreDelegatedPermissions: {
        ...currentMap,
        [studentId]: nextPerms,
      },
    });
  };

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
    const todayStr = new Date().toISOString().split('T')[0];
    return records.filter(r => r.ngayHoc === todayStr && r.trangThai !== 'DaHuy');
  }, [records]);

  // Hierarchy Period Summaries for all students
  const teacherPeriodSummaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateStudentPeriodSummary>> = {};
    students.forEach(st => {
      map[st.maHS] = calculateStudentPeriodSummary(st, records, periodFilter, settings, currentWeek, rules);
    });
    return map;
  }, [students, records, periodFilter, settings, currentWeek, rules]);

  // Summaries mapped to StudentWeekSummary format for the currently selected week/period
  const selectedPeriodWeekSummaries = useMemo(() => {
    const targetW = typeof periodFilter.tuanHoc === 'number' ? periodFilter.tuanHoc : currentWeek;
    const map: Record<string, StudentWeekSummary> = {};
    students.forEach(st => {
      const pSum = teacherPeriodSummaries[st.maHS];
      if (pSum) {
        map[st.maHS] = {
          maHS: st.maHS,
          hoTen: st.hoTen,
          to: st.to,
          tuanHoc: targetW,
          diemKhoiDau: settings.diemKhoiDau,
          tongDiemTru: pSum.tongDiemTru,
          tongDiemCong: pSum.tongDiemCong,
          diemHienTai: pSum.diemTrungBinh,
          xepLoai: pSum.xepLoai,
          mucMau: pSum.mucMau,
          soLoiTrongTuan: pSum.soLoi,
          coLoiNang: pSum.mucMau === 'bad',
          chuaCoDiem: pSum.chuaCoDiem,
          lyDoChuaCoDiem: pSum.lyDoChuaCoDiem,
        };
      } else if (studentSummaries[st.maHS]) {
        map[st.maHS] = studentSummaries[st.maHS];
      }
    });
    return map;
  }, [students, teacherPeriodSummaries, studentSummaries, periodFilter.tuanHoc, currentWeek, settings.diemKhoiDau]);

  // Students requiring attention (warn / bad) in currently selected week/period
  const attentionStudents = useMemo(() => {
    return students.filter(s => {
      const summary = selectedPeriodWeekSummaries[s.maHS];
      return summary && !summary.chuaCoDiem && (summary.mucMau === 'bad' || summary.mucMau === 'warn');
    });
  }, [students, selectedPeriodWeekSummaries]);

  const scoreRatingTiers = useMemo(() => getScoreRatingTiers(settings), [settings]);

  // Sorting & Filtering State for Emulation Overview (Bảng tổng quan thi đua)
  type TeacherRankingSort = 'score_desc' | 'score_asc' | 'stt' | 'name_asc' | 'name_desc' | 'to';
  const [rankingSortBy, setRankingSortBy] = useState<TeacherRankingSort>('score_desc');
  const [rankingToFilter, setRankingToFilter] = useState<'all' | number>('all');
  const [rankingSearchQuery, setRankingSearchQuery] = useState('');
  const [rankingRatingFilter, setRankingRatingFilter] = useState<string>('all');
  const [filterOnlyViolations, setFilterOnlyViolations] = useState(false);

  // Official Emulation Rankings (Thuật toán xếp hạng chuẩn: cùng điểm thì cùng xếp hạng)
  const teacherOfficialRankings = useMemo(() => {
    const list = students.map(student => {
      const summary = teacherPeriodSummaries[student.maHS] || {
        diemTrungBinh: settings.diemKhoiDau,
        tongDiemTru: 0,
        tongDiemCong: 0,
        xepLoai: scoreRatingTiers[0]?.id || 'Tot',
      };
      return {
        student,
        score: summary.diemTrungBinh,
        xepLoai: summary.xepLoai,
        deductions: summary.tongDiemTru,
        bonuses: summary.tongDiemCong,
        chuaCoDiem: summary.chuaCoDiem,
        lyDoChuaCoDiem: summary.lyDoChuaCoDiem,
      };
    });

    return calculateDenseRankings(
      list,
      item => item.score,
      item => item.deductions,
      item => item.bonuses
    );
  }, [students, teacherPeriodSummaries, settings.diemKhoiDau, scoreRatingTiers]);

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
      list = list.filter(item => {
        const tier = getRatingTierInfo(item.xepLoai, item.score, settings);
        return tier.id === rankingRatingFilter;
      });
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
  }, [teacherOfficialRankings, rankingToFilter, rankingRatingFilter, rankingSearchQuery, rankingSortBy, filterOnlyViolations, settings]);

  // Statistics for Teacher View
  const teacherRankingStats = useMemo(() => {
    const total = displayedTeacherRankings.length;
    const tierStats = scoreRatingTiers.map(tier => {
      const count = displayedTeacherRankings.filter(item => {
        if (item.chuaCoDiem) return false;
        return getRatingTierInfo(item.xepLoai, item.score, settings).id === tier.id;
      }).length;
      return { tier, count };
    });
    if (total === 0) return { avgScore: 0, tierStats };
    const sumScore = displayedTeacherRankings.reduce((sum, item) => sum + item.score, 0);
    const avgScore = Math.round((sumScore / total) * 10) / 10;
    return { avgScore, tierStats };
  }, [displayedTeacherRankings, scoreRatingTiers, settings]);

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
        nguoiGhi: `${internalTeacherProfile.hoTen || 'Giáo viên'} (GVCN)`,
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
      {/* Integrated Hero Banner Header (Compact, edge-aligned 4-corner layout for clear focal space) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-token shadow-md bg-surface">
        <div className="relative min-h-[142px] sm:min-h-[158px] w-full overflow-hidden flex flex-col justify-between p-2 sm:p-3 gap-2">
          <img
            src={bannerGv}
            alt="Giáo viên Chủ nhiệm - Lớp 10A5"
            className="absolute inset-0 w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          {/* Edge-focused vignette so the center of the banner stays airy while top/bottom edges are crisp */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-900/15 to-slate-950/80" />

          {/* Top Edge Row: School Logo + Name (Top-Left) & Logout (Top-Right) */}
          <div className="relative z-10 flex items-start justify-between gap-1.5">
            <div 
              className="flex items-center gap-1.5 min-w-0 cursor-pointer group select-none"
              onClick={() => setActiveTab('overview')}
              title="Bấm vào logo để về màn hình Tổng quan"
            >
              <Logo10A5 size="xs" animate={false} />
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[10px] xs:text-[10.5px] sm:text-xs font-black tracking-tight text-white drop-shadow-md uppercase whitespace-nowrap group-hover:text-amber-300 transition-colors">
                  TRƯỜNG THPT SỐ 2 ĐỨC PHỔ
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-bold text-amber-200 drop-shadow whitespace-nowrap">
                  Lớp 10A5 · 2026-2027
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-2 py-0.5 sm:py-1 rounded-lg bg-rose-600/95 hover:bg-rose-500 border border-rose-300 text-white text-[10px] sm:text-[10.5px] font-extrabold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 shrink-0 leading-tight"
                title="Đăng xuất khỏi Bảng điều khiển Giáo viên"
              >
                <LogOut className="w-3 h-3 text-white shrink-0" />
                <span>Thoát</span>
              </button>
            )}
          </div>

          {/* Bottom Edge Row: Compact Teacher Identity + Slogan (Bottom-Left) & Week Selector + Tải app (Bottom-Right) */}
          <div className="relative z-10 flex items-end justify-between gap-1.5 pt-2">
            {/* Bottom-Left: Teacher Identity Pill + Slogan hugged to left edge */}
            <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
              <div
                onClick={() => setIsTeacherProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 sm:gap-2 max-w-full cursor-pointer group bg-slate-950/75 hover:bg-slate-950/90 border border-amber-300/80 hover:border-amber-300 rounded-xl p-1 pr-2 sm:pr-2.5 backdrop-blur-md transition-all shadow-md"
                title="Bấm để đổi ảnh đại diện và thông tin hồ sơ Giáo viên"
              >
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-amber-300 bg-white shrink-0">
                  <img
                    src={resolveTeacherAvatar(teacherAvatarUrl)}
                    alt={internalTeacherProfile.hoTen || 'Giáo viên Chủ nhiệm'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_TEACHER_AVATAR;
                    }}
                  />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-tl bg-amber-400 text-slate-950 flex items-center justify-center">
                    <Camera className="w-2 h-2" />
                  </div>
                </div>

                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] sm:text-xs font-black text-white group-hover:text-amber-300 transition-colors truncate max-w-[135px] xs:max-w-[165px] sm:max-w-[230px]">
                      {internalTeacherProfile.hoTen || 'Giáo viên chủ nhiệm'}
                    </span>
                    <Edit3 className="w-2.5 h-2.5 text-amber-300 shrink-0 opacity-90 group-hover:opacity-100" />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 border border-white leading-tight whitespace-nowrap">
                      GVCN 10A5
                    </span>
                    {internalTeacherProfile.statusText && (
                      <span className="text-[9.5px] font-bold text-amber-100 truncate max-w-[110px] sm:max-w-[190px] hidden xs:inline">
                        · {internalTeacherProfile.statusText}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Compact Slogan flush bottom-left */}
              <div className="text-[9.5px] sm:text-[10.5px] text-white/95 font-semibold drop-shadow truncate max-w-full pl-0.5 leading-tight">
                <span
                  style={{
                    color: settings?.bannerSloganColor || '#ffffff',
                    fontStyle: (settings?.bannerSloganStyle ?? 'italic') === 'italic' ? 'italic' : 'normal',
                    fontWeight: (settings?.bannerSloganStyle ?? 'italic') === 'bold' ? 800 : 600,
                  }}
                >
                  "{settings?.bannerSloganText || 'Tận tâm - Thấu hiểu - Định hướng tương lai'} {settings?.bannerSloganIcon || '🎓'}"
                </span>
              </div>
            </div>

            {/* Bottom-Right: Week Selector on top + Tải app button directly underneath */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-amber-400 hover:bg-amber-300 border border-white text-slate-950 font-black text-[10px] sm:text-[10.5px] shadow-sm transition-all shrink-0 leading-tight">
                <Calendar className="w-3 h-3 text-slate-950 shrink-0" />
                {onChangeCurrentWeek ? (
                  <select
                    value={currentWeek}
                    onChange={e => onChangeCurrentWeek(Number(e.target.value))}
                    className="bg-transparent text-slate-950 font-black cursor-pointer focus:outline-none pr-0.5 text-[10px] sm:text-[10.5px]"
                    title="Chạm để chuyển tuần học"
                  >
                    {Array.from({ length: 38 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w} className="bg-white text-slate-900 font-bold">
                        Tuần {w} {w <= 19 ? '(HK1)' : '(HK2)'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="whitespace-nowrap">Tuần {currentWeek} {currentWeek <= 19 ? '(HK1)' : '(HK2)'}</span>
                )}
              </div>
              <PWAInstallButton variant="banner" />
            </div>
          </div>
        </div>
      </div>

      {/* THANH CHỨC NĂNG GIÁO VIÊN: Bố trí thành 3 hàng gọn gàng giống Ban Cán Sự Lớp (Hiển thị đủ 100% trên điện thoại) */}
      <div className="flex flex-col gap-1.5 p-1.5 sm:p-2 bg-surface-2 rounded-2xl border border-token w-full shadow-2xs">
        {/* HÀNG 1 (Quản lý & Theo dõi chính): Tổng quan | Sơ đồ lớp | Bảng điểm | Giải trình */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-surface text-accent font-black shadow-xs ring-2 ring-accent'
                : 'bg-surface/80 text-main hover:bg-surface'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">Tổng quan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`py-2 px-1 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-rose-600 text-white font-black shadow-xs'
                : 'bg-surface/80 text-rose-600 hover:bg-surface border border-rose-200/70'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Sơ đồ &amp; Chấm</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mailbox')}
            className={`py-2 px-1 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'mailbox'
                ? 'bg-indigo-600 text-white font-black shadow-xs'
                : 'bg-surface/80 text-indigo-700 hover:bg-surface border border-indigo-200/70'
            }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Hộp thư</span>
            {unreadMailCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black shrink-0">
                {unreadMailCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('explanations')}
            className={`py-2 px-1 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'explanations'
                ? 'bg-surface text-accent font-black shadow-xs ring-2 ring-accent'
                : 'bg-surface/80 text-main hover:bg-surface'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">Giải trình</span>
            {pendingExplanations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--st-bad)] text-white text-[9px] font-black shrink-0">
                {pendingExplanations.length}
              </span>
            )}
          </button>
        </div>

        {/* HÀNG 2 (Công cụ Giảng dạy & Dữ liệu): 10 Trò chơi | Nhập / Xuất | Trợ lý AI | Nội quy */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full pt-1 border-t border-token/50">
          <button
            type="button"
            onClick={() => setActiveTab('apps')}
            className={`py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'apps'
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black shadow-xs'
                : 'text-orange-700 bg-orange-500/10 hover:bg-orange-500/20'
            }`}
          >
            <span className="text-xs shrink-0">🎲</span>
            <span className="truncate">10 Trò chơi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import_export')}
            className={`py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'import_export'
                ? 'bg-surface text-accent font-black shadow-xs ring-1 ring-token'
                : 'text-muted hover:text-main hover:bg-surface/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Xem &amp; Xuất</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_gemini')}
            className={`py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ai_gemini'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black shadow-xs'
                : 'text-purple-700 bg-purple-500/10 hover:bg-purple-500/20'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate">Trợ lý AI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-surface text-accent font-black shadow-xs ring-1 ring-token'
                : 'text-muted hover:text-main hover:bg-surface/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">Nội quy</span>
          </button>
        </div>

        {/* HÀNG 3 (Vinh danh & Cấu hình): Khung vinh danh | 30 Huy hiệu | Vinh danh BCS | Cài đặt */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full pt-1 border-t border-token/50">
          <button
            type="button"
            onClick={() => setShowFrameModal(true)}
            className="py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 text-muted hover:text-main hover:bg-surface/60 transition-all cursor-pointer whitespace-nowrap"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Khung Top</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBadgeModal(true)}
            className="py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 text-muted hover:text-main hover:bg-surface/60 transition-all cursor-pointer whitespace-nowrap"
          >
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">30 Huy hiệu</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCadreModal(true)}
            className="py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Cán sự lớp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-surface text-accent font-black shadow-xs ring-1 ring-token'
                : 'text-muted hover:text-main hover:bg-surface/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">Cài đặt</span>
          </button>
        </div>
      </div>

      {/* Sub-tab "Quay lại" (Back) button when in any secondary tab */}
      {activeTab !== 'overview' && (
        <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-2 border border-token text-main text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:border-accent"
          >
            <span>← Quay lại Tổng quan</span>
          </button>
          <span className="text-xs font-bold text-muted">
            {activeTab === 'apps' ? '10 Trò chơi gọi học sinh lên bảng' : activeTab === 'roster' ? 'Sơ đồ lớp (Ghi nhận vi phạm)' : activeTab === 'mailbox' ? 'Hộp thư lớp 10A5' : activeTab === 'grades' ? 'Bảng điểm môn học' : activeTab === 'rules' ? 'Nội quy lớp' : activeTab === 'import_export' ? 'Xem & Xuất điểm thi đua / Nội quy' : activeTab === 'ai_gemini' ? 'Trợ lý AI Gemini (Cấu hình & Phân tích)' : activeTab === 'explanations' ? 'Duyệt giải trình' : 'Cài đặt hệ thống'}
          </span>
        </div>
      )}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Time Hierarchy Period Filter */}
          <PeriodFilterComponent
            filter={periodFilter}
            onChangeFilter={setPeriodFilter}
            currentWeek={currentWeek}
            onChangeCurrentWeek={onChangeCurrentWeek}
            noDataWeeks={settings.noDataWeeks || []}
            onToggleNoDataWeek={handleToggleNoDataWeek}
            autoAdvanceWeek={settings.tuDongChuyenTuan !== false}
            onToggleAutoAdvanceWeek={(enabled) => {
              onUpdateSettings({
                tuDongChuyenTuan: enabled,
                tuanGocTuDong: currentWeek,
                ngayThietLapTuanGoc: getVietnamMondayDateStr(),
              });
            }}
            compact={true}
          />

          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              onClick={() => setOverviewViewMode(overviewViewMode === 'list' ? 'grid' : 'list')}
              className="p-2.5 sm:p-3 rounded-2xl bg-surface border border-token hover:border-accent/40 cursor-pointer transition-all shadow-2xs group"
              title="Bấm để chuyển đổi giữa Danh sách và Sơ đồ lớp"
            >
              <div className="text-[11px] text-muted font-medium flex items-center justify-between">
                <span>Học sinh lớp</span>
                <Move className="w-3 h-3 text-muted group-hover:text-accent transition-colors" />
              </div>
              <div className="text-base sm:text-xl font-black text-main mt-0.5">{students.length} em</div>
              <div className="text-[10px] text-muted mt-1">4 dãy bàn (= 4 tổ) · 6 bàn/dãy</div>
            </div>

            <div 
              onClick={() => setActiveTab('roster')}
              className="p-2 sm:p-3 rounded-2xl bg-surface border border-token hover:border-accent/40 cursor-pointer transition-all shadow-2xs group"
              title="Bấm để mở Sơ đồ lớp để Ghi nhận vi phạm"
            >
              <div className="text-[11px] text-muted font-medium flex items-center justify-between">
                <span>Vi phạm trong kỳ</span>
                <ClipboardList className="w-3 h-3 text-muted group-hover:text-accent transition-colors" />
              </div>
              <div className="text-base sm:text-xl font-black text-main mt-0.5">{records.filter(r => r.trangThai !== 'DaHuy').length} lượt</div>
              <div className="text-[10px] text-muted mt-1">Phân cấp tuần/ngày/buổi</div>
            </div>

            <div 
              onClick={() => setActiveTab('explanations')}
              className="p-2 sm:p-3 rounded-2xl bg-surface border border-token hover:border-accent/40 cursor-pointer transition-all shadow-2xs group"
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
                  <p className="text-[11px] text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>Khởi đầu {settings.diemKhoiDau} điểm · Xếp loại: {formatRatingTiersSummary(settings)}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 hover:bg-accent/20 text-accent font-bold text-[10px] border border-accent/30 cursor-pointer transition-colors"
                      title="Tùy chỉnh linh hoạt các mức xếp loại theo điểm"
                    >
                      <Settings className="w-2.5 h-2.5" />
                      <span>Tùy chỉnh xếp loại</span>
                    </button>
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
                  onClick={() => exportClassroomHtmlReport(students, studentSummaries, currentWeek, records, settings)}
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
                  studentSummaries={selectedPeriodWeekSummaries}
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
                <span className="mx-1 text-token">|</span>
                {scoreRatingTiers.map(tier => {
                  const isSelected = rankingRatingFilter === tier.id;
                  const colorCls = getRatingColorClasses(tier.color);
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setRankingRatingFilter(isSelected ? 'all' : tier.id)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? `${colorCls.badgeBg} ${colorCls.badgeText} ${colorCls.badgeBorder} ring-2 ring-offset-1 ring-current/30 shadow-xs`
                          : 'bg-surface-2 text-muted hover:text-main hover:bg-surface border-token'
                      }`}
                    >
                      {tier.icon ? `${tier.icon} ` : ''}{tier.label}
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
                  {displayedTeacherRankings.length > 0 && displayedTeacherRankings.every(i => i.chuaCoDiem) ? (
                    <>
                      <span>·</span>
                      <span className="font-bold text-slate-600">
                        {displayedTeacherRankings[0]?.lyDoChuaCoDiem === 'no_data'
                          ? '⊘ Tuần không có dữ liệu (Không tính điểm)'
                          : '⏳ Tuần chưa học (Chưa tính điểm)'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>·</span>
                      <span>
                        Điểm trung bình: <strong className="text-accent font-bold">{teacherRankingStats.avgScore} đ</strong>
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap font-medium">
                  {!(displayedTeacherRankings.length > 0 && displayedTeacherRankings.every(i => i.chuaCoDiem)) && (
                    <>
                      {teacherRankingStats.tierStats.map(({ tier, count }, idx) => {
                        const colorCls = getRatingColorClasses(tier.color);
                        return (
                          <React.Fragment key={tier.id}>
                            {idx > 0 && <span>·</span>}
                            <button
                              type="button"
                              onClick={() => setRankingRatingFilter(prev => prev === tier.id ? 'all' : tier.id)}
                              className={`${colorCls.badgeText} font-bold hover:underline cursor-pointer`}
                            >
                              {tier.icon ? `${tier.icon} ` : ''}{tier.label}: {count}
                            </button>
                          </React.Fragment>
                        );
                      })}
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

                  const studentViolations = records.filter(r => isRecordMatchingStudent(r, item.student.maHS, item.student.hoTen) && r.trangThai === 'HieuLuc');

                  return (
                    <div
                      key={item.student.maHS}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-surface-2 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        {/* Order indicator */}
                        <span className={`w-7 sm:w-8 text-center text-xs font-bold shrink-0 ${
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
                          className="cursor-pointer group relative active:scale-95 transition-transform shrink-0"
                          title={`Bấm để đổi avatar cho ${item.student.hoTen}`}
                        >
                          <AvatarFrame frame={frameConfig} size="sm">
                            {item.student.avatarUrl ? (
                              <img
                                src={resolveStudentAvatar(item.student.avatarUrl)}
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

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setInspectingStudent(item.student)}
                              className="text-xs sm:text-sm font-bold text-main hover:text-accent transition-colors text-left flex items-center gap-1 cursor-pointer"
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
                                   item.student.vaiTro.includes('PBT') ? 'Phó Bí thư' :
                                   item.student.vaiTro.includes('LP_HT') ? 'LP Học tập' :
                                   item.student.vaiTro.includes('LP_VT') ? 'LP Văn thể' :
                                   item.student.vaiTro.includes('LP_LD') ? 'LP Lao động' :
                                   item.student.vaiTro.includes('TT') ? `Tổ trưởng T${item.student.to}` :
                                   item.student.vaiTro.includes('CD') ? 'Cờ đỏ' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 pl-9 sm:pl-0 flex-wrap">
                        {item.deductions > 0 && (
                          <button
                            type="button"
                            onClick={() => setInspectingStudent(item.student)}
                            className="text-[10.5px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl border border-rose-500/25 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                            title="Bấm để xem chi tiết các lỗi vi phạm & cán sự ghi nhận"
                          >
                            <ShieldAlert className="w-3 h-3 text-rose-500" />
                            <span>-{item.deductions}đ</span>
                            <span className="text-[10px] opacity-75 font-normal underline hidden xs:inline">Chi tiết</span>
                          </button>
                        )}
                        {item.bonuses > 0 && (
                          <span className="text-[10px] font-bold text-[var(--st-ok)]">
                            +{item.bonuses}đ
                          </span>
                        )}

                        {item.chuaCoDiem ? (
                          <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                            item.lyDoChuaCoDiem === 'no_data'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 border-dashed'
                              : 'bg-slate-100 text-slate-600 border-slate-300 border-dashed'
                          }`}>
                            {item.lyDoChuaCoDiem === 'no_data' ? '⊘ Tuần không có dữ liệu' : '⏳ Tuần chưa học'}
                          </span>
                        ) : (
                          <>
                            <span className="text-xs font-black tabular-nums text-main">
                              {item.score} đ
                            </span>

                            {(() => {
                              const tierInfo = getRatingTierInfo(item.xepLoai, item.score, settings);
                              const colorCls = getRatingColorClasses(tierInfo.color);
                              return (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorCls.badgeBg} ${colorCls.badgeText} ${colorCls.badgeBorder}`}>
                                  {tierInfo.icon ? `${tierInfo.icon} ` : ''}{tierInfo.label}
                                </span>
                              );
                            })()}
                          </>
                        )}

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
                          title="Ghi nhận vi phạm cho học sinh này"
                          className="px-2.5 py-1 rounded-lg bg-accent/15 hover:bg-accent text-accent hover:text-on-accent text-[10.5px] sm:text-[11px] font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
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
                Bấm trực tiếp vào học sinh trên sơ đồ để Ghi nhận vi phạm nề nếp thi đua
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
                onClick={() => {
                  setInitialAddSeat(undefined);
                  setIsLayoutEditorOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
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
              studentSummaries={selectedPeriodWeekSummaries}
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
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl p-3.5 border-2 border-indigo-500 flex items-center justify-between animate-slide-up">
              <div className="text-xs font-extrabold text-slate-800">
                Đã chọn <strong className="text-indigo-600 underline text-sm">{selectedStudentIds.length}</strong> học sinh
              </div>
              <button
                type="button"
                onClick={() => setIsBottomSheetOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Chọn hành vi để Ghi nhận vi phạm</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4.4. CLASSROOM MAILBOX (HỘP THƯ LỚP 10A5) */}
      {activeTab === 'mailbox' && (
        <ClassroomMailbox
          currentUserId="GV"
          currentUserName={internalTeacherProfile.hoTen || 'Giáo viên chủ nhiệm'}
          currentUserRole="GV"
          allStudents={students}
          teacherName={internalTeacherProfile.hoTen || 'Giáo viên chủ nhiệm'}
          messages={mailMessages ?? localMailMessages}
          onUpdateMessages={(next) => {
            setLocalMailMessages(next);
            onUpdateMailMessages?.(next);
          }}
          records={records}
          onUpdateRecords={onImportRecords}
          onResetCustomAvatars={() => {
            const cleanedStudents = students.map(s =>
              s.avatarUrl && s.avatarUrl.startsWith('data:image/')
                ? { ...s, avatarUrl: undefined }
                : s
            );
            onUpdateLayout(layout, cleanedStudents);
          }}
        />
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-token pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-main uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                <span>Danh mục Nội quy lớp — Cơ sở trừ điểm &amp; cộng điểm ({rules.length} quy định)</span>
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                Cho phép tải file mẫu Excel Nội quy lớp, chỉnh sửa mức trừ điểm theo thực tế của lớp và nạp lại để làm cơ sở trừ điểm.
              </p>
            </div>

            {/* Crucial User Requirement: Điểm cộng là tuỳ chọn của GV, mặc định TẮT */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-2 border border-token shrink-0">
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

          {/* Thanh công cụ: Up file Nội quy lớp theo mẫu & Tải file mẫu */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-indigo-950">
              <span className="font-black block">📂 Up File Nội Quy Lớp Theo Mẫu (.xlsx) Để Có Cơ Sở Trừ Điểm:</span>
              <span className="text-[11px] text-slate-600">
                Bước 1: Tải file mẫu Nội quy lớp về máy • Bước 2: Chỉnh sửa nội dung lỗi &amp; số điểm trừ • Bước 3: Up file lên để áp dụng ngay.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                ref={rulesFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleRulesExcelUpload(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => downloadRulesExcelTemplate(rules)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>1. Tải File Mẫu Nội Quy (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => rulesFileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>2. Up File Nội Quy Lớp (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddRuleForm(prev => !prev)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm quy định</span>
              </button>
            </div>
          </div>

          {rulesUploadNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between">
              <span>{rulesUploadNotice}</span>
              <button
                type="button"
                onClick={() => setRulesUploadNotice(null)}
                className="text-[11px] underline ml-2 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}

          {showAddRuleForm && (
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-token space-y-3">
              <div className="text-xs font-black text-main">➕ Thêm quy định Nội quy mới (Cơ sở trừ / cộng điểm)</div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
                <select
                  value={newRuleGroup}
                  onChange={e => setNewRuleGroup(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-surface border border-token font-bold text-main"
                >
                  {STANDARD_RULE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Điểm cộng">Điểm cộng</option>
                </select>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  placeholder="Nội dung hành vi (VD: Đi học muộn)"
                  className={`sm:col-span-2 px-2.5 py-2 rounded-xl bg-surface font-semibold text-main ${
                    newRuleType === 'Cong'
                      ? 'border-2 border-emerald-500'
                      : classifySeverityByPoints(newRuleScore, false) === 'Nang'
                        ? 'border-2 border-rose-600'
                        : classifySeverityByPoints(newRuleScore, false) === 'Vua'
                          ? 'border-2 border-amber-500'
                          : 'border-2 border-slate-900 dark:border-slate-300'
                  }`}
                />
                <select
                  value={newRuleType}
                  onChange={e => setNewRuleType(e.target.value as 'Tru' | 'Cong')}
                  className="px-2.5 py-2 rounded-xl bg-surface border border-token font-bold text-main"
                >
                  <option value="Tru">Điểm Trừ (-)</option>
                  <option value="Cong">Điểm Cộng (+)</option>
                </select>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newRuleScore}
                    onChange={e => setNewRuleScore(Number(e.target.value))}
                    className="w-16 px-2 py-2 rounded-xl bg-surface border border-token font-black text-center text-main"
                  />
                  <button
                    type="button"
                    onClick={handleAddSingleRule}
                    className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {rules.map(rule => {
              const isBonus = rule.loaiDiem === 'Cong';
              if (isBonus && !settings.batDiemCong) return null;
              const sev = classifySeverityByPoints(rule.diemSo, isBonus, rule.mucDo);
              const borderCls = isBonus
                ? 'border-2 border-emerald-500/80'
                : sev === 'Nang'
                  ? 'border-2 border-rose-600'
                  : sev === 'Vua'
                    ? 'border-2 border-amber-500'
                    : 'border-2 border-slate-900 dark:border-slate-300';

              return (
                <div
                  key={rule.maNoiQuy}
                  className={`p-2.5 rounded-xl bg-surface ${borderCls} flex items-center justify-between text-xs gap-2 transition-colors`}
                >
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
                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-surface-2 border border-token">{rule.maNoiQuy}</span>
                        <span>{normalizeRuleCategory(rule.nhomHanhVi, rule.tenHanhVi, rule.loaiDiem)}</span>
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
                    {onUpdateRules && (
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = rules.filter(r => r.maNoiQuy !== rule.maNoiQuy);
                          onUpdateRules(filtered);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa quy định này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. IMPORT / EXPORT (Teacher Only) */}
      {activeTab === 'import_export' && (
        <UniversalSmartImportSection
          students={students}
          layout={layout}
          rules={rules}
          records={records}
          settings={settings}
          currentWeek={currentWeek}
          teacherName={internalTeacherProfile.hoTen}
          academicRecords={internalAcademicRecords}
          onUpdateStudentsAndLayout={(newStudents, newLayout, isReplace) => {
            if (onImportStudents) {
              onImportStudents(newStudents, newLayout, isReplace);
            } else {
              onUpdateLayout(newLayout, newStudents);
            }
          }}
          onAddRecords={(newRecs) => {
            if (onImportRecords) {
              onImportRecords(newRecs);
            }
          }}
          onUpdateAcademicRecords={handleUpdateAcademicRecords}
          onUpdateRules={onUpdateRules}
          onRestoreFullBackup={(payload) => {
            if (payload.students && payload.layout) {
              if (onImportStudents) {
                onImportStudents(payload.students, payload.layout, true);
              } else {
                onUpdateLayout(payload.layout, payload.students);
              }
            }
            if (payload.records && onImportRecords) {
              onImportRecords(payload.records);
            }
            if (payload.rules && onUpdateRules) {
              onUpdateRules(payload.rules);
            }
            if (payload.settings) {
              onUpdateSettings(payload.settings);
            }
            if (payload.academicRecords) {
              handleUpdateAcademicRecords(payload.academicRecords);
            }
          }}
          onOpenStudentImportModal={() => setIsStudentImportModalOpen(true)}
          onOpenLayoutEditor={() => {
            setInitialAddSeat(undefined);
            setIsLayoutEditorOpen(true);
          }}
          onSwitchToGradesTab={() => setActiveTab('grades')}
          onShowToast={(msg, sub) => {
            console.log('[Import/Export]', msg, sub || '');
          }}
        />
      )}

      {activeTab === 'settings' && (
        <div className="p-4 rounded-2xl bg-surface border border-token space-y-4 shadow-xs max-w-xl mx-auto">
          <h3 className="text-xs font-bold text-main uppercase tracking-wider border-b border-token pb-2">
            Cấu hình tham số hệ thống (Lưu tại trang tính 7_CauHinh)
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
              <div>
                <span className="font-bold text-emerald-950 block flex items-center gap-1.5">
                  <span>⏱️ Tự động chuyển tuần vào mỗi Thứ 2 đầu tuần:</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                    settings.tuDongChuyenTuan !== false
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {settings.tuDongChuyenTuan !== false ? 'Đang bật (Thời gian thực)' : 'Đang tắt'}
                  </span>
                </span>
                <span className="text-[11px] text-emerald-800">
                  Kết nối đồng hồ máy chủ thời gian thực (UTC+7): Hễ sang Thứ 2 tuần kế tiếp sẽ tự động tăng từ Tuần {currentWeek} lên Tuần {Math.min(38, currentWeek + 1)}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.tuDongChuyenTuan !== false}
                onChange={e => onUpdateSettings({
                  tuDongChuyenTuan: e.target.checked,
                  tuanGocTuDong: currentWeek,
                  ngayThietLapTuanGoc: getVietnamMondayDateStr(),
                })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer shrink-0"
              />
            </div>

            {/* MỐC THỜI GIAN BẮT ĐẦU TÍNH ĐIỂM & XÉT TRAO HUY HIỆU TỰ ĐỘNG */}
            <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-indigo-950 block">
                    📅 Mốc thời gian bắt đầu tính điểm &amp; xét trao huy hiệu:
                  </span>
                  <span className="text-[11px] text-indigo-800">
                    Các tuần/ngày trước mốc này sẽ không bị trừ điểm và chỉ xét trao huy hiệu tự động từ mốc thời gian đã chọn.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBadgeModal(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shrink-0 cursor-pointer shadow-2xs"
                >
                  🏅 Điều kiện Huy hiệu
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-indigo-950 block mb-1">
                    Tuần bắt đầu tính điểm &amp; xét huy hiệu:
                  </label>
                  <select
                    value={settings.tuanBatDauTinhDiem || 1}
                    onChange={e => {
                      const w = Number(e.target.value);
                      onUpdateSettings({
                        tuanBatDauTinhDiem: w,
                        tuanBatDauXetHuyHieu: w,
                      });
                    }}
                    className="w-full p-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-900"
                  >
                    {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>
                        Bắt đầu từ Tuần {w} {w === 1 ? '(Đầu năm học)' : `(Tuần 1 → ${w - 1} chưa tính)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-indigo-950 block mb-1">
                    Hoặc chọn Ngày bắt đầu cụ thể (tùy chọn):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={settings.ngayBatDauTinhDiem || ''}
                      onChange={e =>
                        onUpdateSettings({
                          ngayBatDauTinhDiem: e.target.value,
                          ngayBatDauXetHuyHieu: e.target.value,
                        })
                      }
                      className="flex-1 p-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                    {settings.ngayBatDauTinhDiem && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            ngayBatDauTinhDiem: '',
                            ngayBatDauXetHuyHieu: '',
                          })
                        }
                        className="px-2 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-bold cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-indigo-200/80">
                <span className="text-[11px] font-bold text-indigo-950">
                  🤖 Chế độ Tự động trao huy hiệu khi học sinh đạt điều kiện:
                </span>
                <input
                  type="checkbox"
                  checked={settings.tuDongTraoHuyHieu !== false}
                  onChange={e => onUpdateSettings({ tuDongTraoHuyHieu: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

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

            {/* CẤU HÌNH XẾP LOẠI THI ĐUA THEO ĐIỂM - LINH HOẠT CAO */}
            <div className="p-3.5 rounded-2xl bg-violet-50/80 dark:bg-violet-950/25 border border-violet-200 dark:border-violet-800/60 space-y-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <span className="font-extrabold text-violet-950 dark:text-violet-200 block text-xs sm:text-sm">
                    🎯 Cấu hình Xếp loại Thi đua theo Điểm (Tùy biến linh hoạt):
                  </span>
                  <span className="text-[11px] text-violet-800 dark:text-violet-300">
                    Tự do chia nhỏ phân loại, thêm/xoá mức xếp loại, đặt tên phân loại, chọn ngưỡng điểm và màu sắc hiển thị.
                  </span>
                </div>
              </div>

              {/* Mẫu cấu hình nhanh (Presets) */}
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-bold text-violet-900 dark:text-violet-300 block">
                  ⚡ Áp dụng nhanh mẫu phân loại:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Object.entries(RATING_PRESETS).map(([presetId, preset]) => (
                    <button
                      key={presetId}
                      type="button"
                      onClick={() => {
                        const cloned = preset.tiers.map((t: ScoreRatingTier) => ({ ...t }));
                        onUpdateSettings({ phanLoaiDiem: cloned });
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-violet-600 hover:text-white text-violet-900 dark:text-violet-200 border border-violet-300 dark:border-violet-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                      title={preset.description}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh sách các mức phân loại hiện tại */}
              <div className="space-y-2 pt-1">
                {scoreRatingTiers.map((tier, idx) => {
                  const upperBound = idx === 0 ? settings.diemKhoiDau : scoreRatingTiers[idx - 1].minScore - 1;
                  const rangeLabel =
                    idx === 0
                      ? `≥ ${tier.minScore}đ`
                      : idx === scoreRatingTiers.length - 1 && tier.minScore === 0
                        ? `< ${scoreRatingTiers[idx - 1].minScore}đ (0đ → ${ Math.max(0, upperBound)}đ)`
                        : `${tier.minScore}đ → ${Math.max(tier.minScore, upperBound)}đ`;

                  const colorCls = getRatingColorClasses(tier.color);

                  const handleUpdateTier = (patch: Partial<ScoreRatingTier>) => {
                    const nextTiers = scoreRatingTiers.map(t =>
                      t.id === tier.id ? { ...t, ...patch } : t
                    );
                    nextTiers.sort((a, b) => b.minScore - a.minScore);
                    onUpdateSettings({ phanLoaiDiem: nextTiers });
                  };

                  const handleSplitTier = () => {
                    const topScore = idx === 0 ? Math.max(settings.diemKhoiDau, tier.minScore + 4) : scoreRatingTiers[idx - 1].minScore;
                    const midScore = Math.round((topScore + tier.minScore) / 2);
                    if (midScore <= tier.minScore) return;
                    const upperTier: ScoreRatingTier = {
                      id: `Tier_${Date.now().toString().slice(-4)}_A`,
                      label: `${tier.label} +`,
                      minScore: midScore,
                      color: tier.color,
                      icon: tier.icon || '🌟',
                    };
                    const nextTiers = [...scoreRatingTiers, upperTier].sort((a, b) => b.minScore - a.minScore);
                    onUpdateSettings({ phanLoaiDiem: nextTiers });
                  };

                  const handleDeleteTier = () => {
                    if (scoreRatingTiers.length <= 1) return;
                    const nextTiers = scoreRatingTiers.filter(t => t.id !== tier.id);
                    onUpdateSettings({ phanLoaiDiem: nextTiers });
                  };

                  return (
                    <div
                      key={tier.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-slate-700 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                          {/* Chọn biểu tượng */}
                          <select
                            value={tier.icon || ''}
                            onChange={e => handleUpdateTier({ icon: e.target.value })}
                            className="px-1.5 py-1 rounded-lg bg-surface-2 border border-token text-xs cursor-pointer"
                            title="Biểu tượng phân loại"
                          >
                            <option value="🌟">🌟</option>
                            <option value="🏆">🏆</option>
                            <option value="💎">💎</option>
                            <option value="🚀">🚀</option>
                            <option value="👍">👍</option>
                            <option value="🌱">🌱</option>
                            <option value="⚠️">⚠️</option>
                            <option value="❗">❗</option>
                            <option value="🔥">🔥</option>
                            <option value="">(Trống)</option>
                          </select>

                          {/* Tên phân loại */}
                          <input
                            type="text"
                            value={tier.label}
                            onChange={e => handleUpdateTier({ label: e.target.value })}
                            placeholder="Tên phân loại (VD: Xuất sắc, Tốt...)"
                            className="flex-1 px-2.5 py-1 rounded-lg bg-surface-2 border border-token text-xs font-extrabold text-main focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                          />
                        </div>

                        {/* Ngưỡng điểm tối thiểu */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-bold text-muted">Từ ≥</span>
                          <input
                            type="number"
                            min={0}
                            max={200}
                            value={tier.minScore}
                            onChange={e => handleUpdateTier({ minScore: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-16 px-2 py-1 rounded-lg bg-surface-2 border border-token text-xs font-black text-center text-main"
                          />
                          <span className="text-[11px] font-bold text-muted">đ</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
                        {/* Chọn màu sắc + Xem trước nhãn */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <select
                            value={tier.color}
                            onChange={e => handleUpdateTier({ color: e.target.value as RatingColorKey })}
                            className="px-2 py-0.5 rounded-lg bg-surface-2 border border-token text-[11px] font-bold text-main cursor-pointer"
                          >
                            {Object.entries(RATING_COLOR_PALETTE).map(([colorKey, colorItem]) => (
                              <option key={colorKey} value={colorKey}>
                                Màu: {colorItem.name}
                              </option>
                            ))}
                          </select>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorCls.badge}`}>
                            {tier.icon ? `${tier.icon} ` : ''}{tier.label} ({rangeLabel})
                          </span>
                        </div>

                        {/* Nút Chia nhỏ & Xóa */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleSplitTier}
                            className="px-2 py-0.5 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-800 text-[10.5px] font-bold cursor-pointer transition-colors"
                            title="Chia nhỏ khoảng điểm của mức này thành 2 phân loại chi tiết hơn"
                          >
                            ✂️ Chia nhỏ
                          </button>
                          {scoreRatingTiers.length > 1 && (
                            <button
                              type="button"
                              onClick={handleDeleteTier}
                              className="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10.5px] font-bold cursor-pointer transition-colors"
                              title="Xoá mức phân loại này"
                            >
                              Xoá
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nút Thêm phân loại mới */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const lowestMin = scoreRatingTiers.length > 0 ? scoreRatingTiers[scoreRatingTiers.length - 1].minScore : 50;
                    const newMin = lowestMin > 10 ? Math.max(0, lowestMin - 10) : 85;
                    const newTier: ScoreRatingTier = {
                      id: `Tier_${Date.now().toString().slice(-4)}`,
                      label: 'Phân loại mới',
                      minScore: newMin,
                      color: 'sky',
                      icon: '⭐',
                    };
                    const nextTiers = [...scoreRatingTiers, newTier].sort((a, b) => b.minScore - a.minScore);
                    onUpdateSettings({ phanLoaiDiem: nextTiers });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm phân loại mới</span>
                </button>

                <span className="text-[10.5px] text-violet-800 dark:text-violet-300 font-semibold">
                  Đang dùng <strong>{scoreRatingTiers.length}</strong> mức phân loại
                </span>
              </div>
            </div>

            {/* THỜI GIAN CHO PHÉP SỬA / HỦY DỮ LIỆU CỦA GIÁO VIÊN & HỌC SINH */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5">
              <div>
                <span className="font-extrabold text-amber-950 block">
                  ⏱️ Thời gian cho phép sửa / hủy dữ liệu của Giáo viên &amp; Học sinh:
                </span>
                <span className="text-[11px] text-amber-800">
                  Cấu hình giới hạn thời gian chỉnh sửa hoặc hủy ghi nhận vi phạm và gửi giải trình (có tùy chọn Không giới hạn).
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 block">1. Thời gian sửa / hủy dữ liệu của Giáo viên:</span>
                    <span className="text-[11px] text-slate-600">Áp dụng khi GVCN sửa hoặc hủy ghi nhận vi phạm</span>
                  </div>
                  <select
                    value={settings.thoiHanSuaDuLieuGVPhut ?? 0}
                    onChange={e => onUpdateSettings({ thoiHanSuaDuLieuGVPhut: Number(e.target.value) })}
                    className="p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer shrink-0"
                  >
                    <option value={0}>♾️ Không giới hạn (Mặc định)</option>
                    <option value={60}>1 giờ</option>
                    <option value={180}>3 giờ</option>
                    <option value={360}>6 giờ</option>
                    <option value={720}>12 giờ</option>
                    <option value={1440}>24 giờ (1 ngày)</option>
                    <option value={4320}>3 ngày (72 giờ)</option>
                    <option value={10080}>7 ngày (1 tuần)</option>
                    <option value={43200}>30 ngày (1 tháng)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/70">
                  <div>
                    <span className="font-bold text-slate-900 block">2. Thời gian sửa / hủy dữ liệu của Học sinh &amp; Ban cán sự:</span>
                    <span className="text-[11px] text-slate-600">Tính từ thời điểm ghi nhận vi phạm trong Sổ ghi</span>
                  </div>
                  <select
                    value={settings.thoiHanSuaHuyPhut ?? 1440}
                    onChange={e => onUpdateSettings({ thoiHanSuaHuyPhut: Number(e.target.value) })}
                    className="p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer shrink-0"
                  >
                    <option value={0}>♾️ Không giới hạn</option>
                    <option value={30}>30 phút</option>
                    <option value={60}>1 giờ</option>
                    <option value={180}>3 giờ</option>
                    <option value={360}>6 giờ</option>
                    <option value={720}>12 giờ</option>
                    <option value={1440}>24 giờ (1 ngày)</option>
                    <option value={2880}>48 giờ (2 ngày)</option>
                    <option value={4320}>3 ngày (72 giờ)</option>
                    <option value={10080}>7 ngày (1 tuần)</option>
                    <option value={43200}>30 ngày (1 tháng)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/70">
                  <div>
                    <span className="font-bold text-slate-900 block">3. Thời hạn Học sinh gửi / sửa đơn giải trình:</span>
                    <span className="text-[11px] text-slate-600">Tính từ ngày phát sinh vi phạm nề nếp</span>
                  </div>
                  <select
                    value={settings.hanGuiGiaiTrinhNgay ?? 7}
                    onChange={e => onUpdateSettings({ hanGuiGiaiTrinhNgay: Number(e.target.value) })}
                    className="p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer shrink-0"
                  >
                    <option value={0}>♾️ Không giới hạn</option>
                    <option value={1}>1 ngày (24 giờ)</option>
                    <option value={3}>3 ngày</option>
                    <option value={7}>7 ngày (1 tuần)</option>
                    <option value={14}>14 ngày (2 tuần)</option>
                    <option value={30}>30 ngày (1 tháng)</option>
                  </select>
                </div>
              </div>
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

            <div className="flex items-center justify-between pt-2 border-t border-token">
              <div>
                <span className="font-semibold text-main block">Thông tin &amp; Ảnh đại diện Giáo viên:</span>
                <span className="text-[11px] text-muted">Đổi tên hiển thị ({internalTeacherProfile.hoTen}), chọn mẫu ảnh đại diện 3D</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenTeacherProfile ? onOpenTeacherProfile() : setIsTeacherProfileModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Đổi tên &amp; Ảnh</span>
              </button>
            </div>
          </div>

          {/* Cài đặt Slogan / Khẩu hiệu trên Banner lớp học */}
          <div className="p-4 rounded-2xl bg-surface border border-token shadow-2xs space-y-3.5 max-w-xl mx-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-base shrink-0">
                📢
              </div>
              <div>
                <h4 className="text-xs font-bold text-main uppercase tracking-wider">
                  Khẩu hiệu / Slogan trên Banner Lớp
                </h4>
                <p className="text-[11px] text-muted">
                  Tùy chỉnh thông điệp truyền cảm hứng hiển thị trên đầu trang học sinh và ban cán sự
                </p>
              </div>
            </div>

            {/* Ô nhập nội dung */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-main">
                Nội dung khẩu hiệu:
              </label>
              <input
                type="text"
                value={settings.bannerSloganText ?? 'Chăm ngoan - Sáng tạo - Đoàn kết vững bước tương lai'}
                onChange={e => onUpdateSettings({ bannerSloganText: e.target.value })}
                placeholder="Nhập khẩu hiệu của lớp..."
                className="w-full px-3 py-2 bg-surface-2 border border-token rounded-xl text-xs font-semibold text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {/* Chọn biểu tượng sinh động */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-main">
                Biểu tượng sinh động:
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['🌟', '🚀', '🔥', '📚', '🎯', '✨', '🏆', '💪', '🎓', '🌱', '⚡', '💎'].map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => onUpdateSettings({ bannerSloganIcon: icon })}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
                      (settings.bannerSloganIcon ?? '🌟') === icon
                        ? 'bg-accent text-on-accent scale-110 shadow-xs ring-2 ring-accent/30'
                        : 'bg-surface-2 hover:bg-surface border border-token'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Màu sắc & Kiểu chữ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-main">Màu chữ khẩu hiệu:</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: 'Trắng', color: '#ffffff' },
                    { label: 'Vàng kim', color: '#fef08a' },
                    { label: 'Xanh ngọc', color: '#67e8f9' },
                    { label: 'Xanh lá', color: '#a7f3d0' },
                    { label: 'Hồng phấn', color: '#f472b6' },
                    { label: 'Cam tươi', color: '#fed7aa' },
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => onUpdateSettings({ bannerSloganColor: c.color })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        (settings.bannerSloganColor ?? '#ffffff') === c.color
                          ? 'border-accent ring-2 ring-accent/40 bg-surface'
                          : 'border-token bg-surface-2 hover:bg-surface'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: c.color }} />
                      <span className="text-main">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-main">Định dạng kiểu chữ:</label>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'In nghiêng', value: 'italic' },
                    { label: 'Chữ chuẩn', value: 'normal' },
                    { label: 'Chữ đậm', value: 'bold' },
                  ].map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => onUpdateSettings({ bannerSloganStyle: s.value as any })}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        (settings.bannerSloganStyle ?? 'italic') === s.value
                          ? 'bg-accent text-on-accent shadow-xs'
                          : 'bg-surface-2 hover:bg-surface border border-token text-main'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Xem trước trực tiếp */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-900 via-slate-800 to-indigo-950 border-2 border-amber-300/60 text-center shadow-md">
              <span className="text-[10px] text-amber-200 block mb-0.5 uppercase tracking-wider font-extrabold">Xem trước trên nền Banner:</span>
              <span
                style={{
                  color: settings.bannerSloganColor ?? '#ffffff',
                  fontStyle: (settings.bannerSloganStyle ?? 'italic') === 'italic' ? 'italic' : 'normal',
                  fontWeight: (settings.bannerSloganStyle ?? 'italic') === 'bold' ? 800 : 600,
                }}
                className="text-xs sm:text-sm drop-shadow-md"
              >
                "{settings.bannerSloganText ?? 'Chăm ngoan - Sáng tạo - Đoàn kết vững bước tương lai'} {settings.bannerSloganIcon ?? '🌟'}"
              </span>
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
                    academicRecords: academicRecords || [],
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
                          await saveServerState(parsed, true);
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
                    Google Gemini 3.0 / 3.8 Flash & Pro
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted">Mô hình AI:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <select
                      value={['gemini-3.0-flash', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.0-pro', 'gemini-2.5-flash', 'gemini-2.5-pro'].includes(geminiModel) ? geminiModel : 'custom'}
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setLocalGeminiModel(val);
                          setGeminiModel(val);
                          await saveCloudGeminiKeys(keysPool, autoRotateKeys, val);
                        } else {
                          setLocalGeminiModel('gemini-3.0-flash');
                          setGeminiModel('gemini-3.0-flash');
                        }
                      }}
                      className="px-2.5 py-1 bg-surface border border-token rounded-lg text-xs font-semibold text-main cursor-pointer"
                    >
                      <option value="gemini-3.0-flash">gemini-3.0-flash (Khuyên dùng: Chuẩn 3.0 Siêu nhanh)</option>
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Mới nhất 3.8)</option>
                      <option value="gemini-3.5-flash">gemini-3.5-flash (Bản 3.5)</option>
                      <option value="gemini-3.0-pro">gemini-3.0-pro (Suy luận chuyên sâu 3.0)</option>
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Dự phòng)</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro (Dự phòng)</option>
                      <option value="custom">Nhập tên model khác...</option>
                    </select>

                    {!['gemini-3.0-flash', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.0-pro', 'gemini-2.5-flash', 'gemini-2.5-pro'].includes(geminiModel) && (
                      <input
                        type="text"
                        value={geminiModel}
                        onChange={async (e) => {
                          const val = e.target.value.trim();
                          setLocalGeminiModel(val);
                          setGeminiModel(val);
                          await saveCloudGeminiKeys(keysPool, autoRotateKeys, val);
                        }}
                        placeholder="Ví dụ: gemini-3.0-flash"
                        className="px-2 py-1 bg-surface border border-purple-400 rounded-lg text-xs text-main font-mono w-40"
                      />
                    )}
                  </div>
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

          {/* Section: AI Data Bridge & Seating Optimizer (2-way link) */}
          <AiDataBridgeSection
            students={students}
            layout={layout}
            records={records}
            currentWeek={currentWeek}
            onUpdateLayout={onUpdateLayout}
            onOpenLayoutTab={() => setActiveTab('roster')}
          />

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
        isTeacher={true}
        delegatedPermissions={settings.cadreDelegatedPermissions || {}}
        onTogglePermission={handleToggleCadrePermission}
      />

      {/* 33 Badges Management Modal */}
      <BadgeManagementModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        students={students}
        records={records}
        academicRecords={internalAcademicRecords}
        settings={settings}
        currentWeek={currentWeek}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Frame & Honor Management Modal */}
      <FrameManagementModal
        isOpen={showFrameModal}
        onClose={() => setShowFrameModal(false)}
        students={students}
        studentRanks={Object.fromEntries(
          teacherOfficialRankings.map(item => [
            item.student.maHS,
            { rank: item.officialRank, score: item.score }
          ])
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
        summary={inspectingStudent ? selectedPeriodWeekSummaries[inspectingStudent.maHS] : undefined}
        selectedWeek={typeof periodFilter.tuanHoc === 'number' ? periodFilter.tuanHoc : currentWeek}
        currentWeek={currentWeek}
        initialFilterPeriod={periodFilter}
        settings={settings}
        viewerRole="GV"
        onAddRecordForStudent={(st) => {
          setSelectedStudentIds([st.maHS]);
          setIsBottomSheetOpen(true);
        }}
        onResolveExplanation={onResolveExplanation}
        onVoidRecord={onVoidRecord}
        onUpdateRecord={onUpdateRecord}
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
