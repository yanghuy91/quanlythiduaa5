/**
 * Quản lý Thi đua Lớp học - 10A5 THPT Số 2 Đức Phổ
 * Giai đoạn 1: Giao diện + Demo
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Student, 
  RoleCode, 
  DisciplineRecord, 
  RuleItem, 
  TeacherSettings,
  StudentWeekSummary,
  SeatLayoutNode,
  StudentAcademicRecord
} from './types';
import { 
  MOCK_STUDENTS, 
  MOCK_RULES, 
  MOCK_SEAT_LAYOUT, 
  INITIAL_RECORDS, 
  INITIAL_SETTINGS,
  getDefaultStudentAvatar,
  filterOutLegacyDemoRecords
} from './data/mockData';
import { calculateStudentWeekSummary, calculateDenseRankings } from './utils/emulation';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { Toast, ToastData } from './components/common/Toast';
import { LoginModal } from './components/auth/LoginModal';
import { StudentView } from './components/student/StudentView';
import { CadreView } from './components/cadre/CadreView';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { CallingGamesHub } from './components/teacher/calling-games/CallingGamesHub';
import { 
  saveAuthSession, 
  getSavedAuthSession, 
  clearAuthSession,
  getAllStudentPasswords,
  setAllStudentPasswords
} from './utils/authService';
import { getAcademicRecords, saveAcademicRecords } from './data/academicCatalog';
import { getTeacherAvatar, setTeacherAvatar, resolveTeacherAvatar, DEFAULT_TEACHER_AVATAR } from './data/teacherAvatars';
import { resolveStudentAvatar } from './data/avatarPresets';
import { TeacherAvatarModal } from './components/teacher/TeacherAvatarModal';
import { TeacherProfileModal } from './components/teacher/TeacherProfileModal';
import { getTeacherProfile, saveTeacherProfile, TeacherProfile } from './data/teacherProfile';
import { AvatarUploadModal } from './components/common/AvatarUploadModal';
import { 
  fetchServerState, 
  scheduleServerSync, 
  saveServerState, 
  markRemoteStateApplied,
  ClassroomFullState 
} from './services/storageSync';
import { 
  getAllStudentBadgesState, 
  setAllStudentBadgesState 
} from './data/badgeCatalog';
import { 
  subscribeToCloudClassState, 
  logoutFirebase, 
  onFirebaseAuthStateChanged, 
  isAuthorizedTeacherEmail 
} from './services/firebase';
import {
  initRealtimeClockSync,
  getVietnamMondayDateStr,
  getNextVietnamMondayDisplayStr,
  calculateMondaysElapsed
} from './utils/realtimeWeek';
import {
  syncStudentsWithSeatingLayout,
  reconcileAcademicRecordsWithSeating,
  reconcileDisciplineRecordsWithSeating
} from './utils/seatingMaster';

function normalizeStudentsList(list: Student[]): Student[] {
  return list.map(s => ({
    ...s,
    avatarUrl: resolveStudentAvatar(s.avatarUrl),
  }));
}

export default function App() {
  // Enforce Light mode permanently (Default light, removed dark mode)
  useEffect(() => {
    localStorage.setItem('app_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }, []);

  // App dataset (Luôn đồng bộ lấy Sơ đồ lớp 4 Tổ x 6 Bàn = tối đa 48 ghế làm chuẩn gốc)
  const initialSeatingState = useMemo(() => {
    let rawStudents = MOCK_STUDENTS;
    let rawLayout = MOCK_SEAT_LAYOUT;
    try {
      const savedStu = localStorage.getItem('app_students_10a5_v4');
      if (savedStu) {
        const parsed = JSON.parse(savedStu);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawStudents = normalizeStudentsList(parsed);
        }
      }
    } catch {}
    try {
      const savedLay = localStorage.getItem('app_layout_10a5_v4');
      if (savedLay) {
        const parsed = JSON.parse(savedLay);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawLayout = parsed;
        }
      }
    } catch {}
    const synced = syncStudentsWithSeatingLayout(rawStudents, rawLayout);
    localStorage.setItem('app_students_10a5_v4', JSON.stringify(synced.students));
    localStorage.setItem('app_layout_10a5_v4', JSON.stringify(synced.layout));
    return synced;
  }, []);

  const [students, setStudents] = useState<Student[]>(initialSeatingState.students);
  const [layout, setLayout] = useState<SeatLayoutNode[]>(initialSeatingState.layout);
  const [rules, setRules] = useState<RuleItem[]>(() => {
    const saved = localStorage.getItem('app_rules_10a5');
    if (!saved) return MOCK_RULES;
    try {
      const parsed: RuleItem[] = JSON.parse(saved);
      // Tự động bổ sung các nội quy mới nếu chưa có trong bộ lưu trữ
      const existingIds = new Set(parsed.map(r => r.maNoiQuy));
      const missing = MOCK_RULES.filter(r => !existingIds.has(r.maNoiQuy));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem('app_rules_10a5', JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return MOCK_RULES;
    }
  });
  const [settings, setSettings] = useState<TeacherSettings>(() => {
    const saved = localStorage.getItem('app_settings_10a5');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });
  const [records, setRecords] = useState<DisciplineRecord[]>(() => {
    const saved = localStorage.getItem('app_records_10a5');
    if (!saved) return INITIAL_RECORDS;
    try {
      const parsed = JSON.parse(saved);
      return filterOutLegacyDemoRecords(parsed);
    } catch {
      return INITIAL_RECORDS;
    }
  });
  const [academicRecords, setAcademicRecords] = useState<StudentAcademicRecord[]>(() => {
    return getAcademicRecords();
  });

  // Current session & week (Persisted and changeable)
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    const saved = localStorage.getItem('app_current_week');
    return saved ? Number(saved) : 3;
  });
  
  // Teacher & Student Avatar state
  const [teacherAvatar, setTeacherAvatarState] = useState<string>(() => {
    return resolveTeacherAvatar(getTeacherAvatar());
  });
  const [isTeacherAvatarModalOpen, setIsTeacherAvatarModalOpen] = useState(false);
  const [isStudentAvatarModalOpen, setIsStudentAvatarModalOpen] = useState(false);

  // Teacher Profile state (Name, Status text, etc.)
  const [teacherProfile, setTeacherProfileState] = useState<TeacherProfile>(() => {
    return getTeacherProfile();
  });
  const [isTeacherProfileModalOpen, setIsTeacherProfileModalOpen] = useState(false);

  // Auth state: check saved session (persisted via localStorage or sessionStorage)
  const [currentUser, setCurrentUser] = useState<Student | { hoTen: string; vaiTro: RoleCode[]; avatarUrl?: string; statusText?: string } | null>(() => {
    const session = getSavedAuthSession();
    if (session && session.user) {
      if (session.user.vaiTro && session.user.vaiTro.includes('GV')) {
        const prof = getTeacherProfile();
        return {
          ...session.user,
          hoTen: prof.hoTen,
          statusText: prof.statusText,
          avatarUrl: resolveTeacherAvatar((session.user as any).avatarUrl || getTeacherAvatar()),
        };
      }
      if ('maHS' in session.user) {
        return {
          ...session.user,
          avatarUrl: resolveStudentAvatar(session.user.avatarUrl),
        };
      }
      return session.user;
    }
    return null;
  });
  const [currentRole, setCurrentRole] = useState<RoleCode>(() => {
    const session = getSavedAuthSession();
    if (session && session.role) return session.role;
    return 'HS';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => {
    const session = getSavedAuthSession();
    return !session || !session.user;
  });
  const [showCallingGamesModal, setShowCallingGamesModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<ToastData | null>(null);

  // Helper to construct a complete snapshot for immediate cloud persistence
  const buildFullStateSnapshot = useCallback((overrides?: Partial<ClassroomFullState>): ClassroomFullState => {
    const badges = getAllStudentBadgesState();
    const passwords = getAllStudentPasswords();
    return {
      students,
      records,
      academicRecords,
      settings,
      layout,
      rules,
      teacherAvatar,
      teacherProfile,
      currentWeek,
      studentBadgesMap: badges.studentBadgesMap,
      studentActiveBadges: badges.studentActiveBadges,
      studentPasswords: passwords,
      updatedAt: new Date().toISOString(),
      version: Date.now(),
      ...overrides,
    };
  }, [students, records, academicRecords, settings, layout, rules, teacherAvatar, teacherProfile, currentWeek]);

  const handleUpdateAcademicRecords = useCallback((newRecords: StudentAcademicRecord[]) => {
    setAcademicRecords(newRecords);
    saveAcademicRecords(newRecords);
    saveServerState(buildFullStateSnapshot({ academicRecords: newRecords }), true);
  }, [buildFullStateSnapshot]);

  const handleSetCurrentWeek = useCallback((week: number) => {
    const mondayStr = getVietnamMondayDateStr();
    const updatedSettings: TeacherSettings = {
      ...settings,
      tuanGocTuDong: week,
      ngayThietLapTuanGoc: mondayStr,
    };
    setSettings(updatedSettings);
    localStorage.setItem('app_settings_10a5', JSON.stringify(updatedSettings));
    setCurrentWeek(week);
    localStorage.setItem('app_current_week', String(week));
    saveServerState(buildFullStateSnapshot({ currentWeek: week, settings: updatedSettings }), true);
    setToast({
      id: Date.now().toString(),
      message: `Đã chọn tuần hiện tại: Tuần ${week} ✨`,
      subMessage: updatedSettings.tuDongChuyenTuan !== false && week < 38
        ? `Đồng bộ thời gian thực: Tự động sang Tuần ${week + 1} vào Thứ 2 tới (${getNextVietnamMondayDisplayStr()})`
        : `Điểm thi đua của lớp 10A5 được cập nhật theo Tuần ${week}`,
    });
  }, [settings, buildFullStateSnapshot]);

  // Real-time Monday Auto-Advance Week Engine (Tự động chuyển sang tuần tiếp theo vào Thứ 2 hàng tuần)
  useEffect(() => {
    const checkAndAdvanceWeek = () => {
      if (settings.tuDongChuyenTuan === false) return;

      const currentMondayStr = getVietnamMondayDateStr();
      const anchorWeek = settings.tuanGocTuDong;
      const anchorMonday = settings.ngayThietLapTuanGoc;

      // Nếu chưa có mốc ngày Thứ 2, khởi tạo mốc theo tuần hiện tại để từ Thứ 2 tuần sau tự động tăng
      if (!anchorMonday || typeof anchorWeek !== 'number') {
        const initializedSettings: TeacherSettings = {
          ...settings,
          tuDongChuyenTuan: true,
          tuanGocTuDong: currentWeek,
          ngayThietLapTuanGoc: currentMondayStr,
        };
        setSettings(initializedSettings);
        localStorage.setItem('app_settings_10a5', JSON.stringify(initializedSettings));
        return;
      }

      const weeksElapsed = calculateMondaysElapsed(anchorMonday, currentMondayStr);
      if (weeksElapsed > 0) {
        const nextWeek = Math.min(38, Math.max(1, anchorWeek + weeksElapsed));
        const updatedSettings: TeacherSettings = {
          ...settings,
          tuanGocTuDong: nextWeek,
          ngayThietLapTuanGoc: currentMondayStr,
        };
        setSettings(updatedSettings);
        localStorage.setItem('app_settings_10a5', JSON.stringify(updatedSettings));

        if (nextWeek !== currentWeek) {
          setCurrentWeek(nextWeek);
          localStorage.setItem('app_current_week', String(nextWeek));
          saveServerState(buildFullStateSnapshot({ currentWeek: nextWeek, settings: updatedSettings }), true);
          setToast({
            id: `auto-week-${nextWeek}`,
            message: `Đã sang Thứ 2 tuần mới: Tự động chuyển sang Tuần ${nextWeek} 📅`,
            subMessage: `Hệ thống thời gian thực đã tự động cập nhật từ Tuần ${currentWeek} sang Tuần ${nextWeek}.`,
          });
        }
      }
    };

    const unsubClock = initRealtimeClockSync(() => {
      checkAndAdvanceWeek();
    });

    checkAndAdvanceWeek();
    const intervalId = window.setInterval(checkAndAdvanceWeek, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndAdvanceWeek();
      }
    };
    window.addEventListener('focus', checkAndAdvanceWeek);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubClock();
      clearInterval(intervalId);
      window.removeEventListener('focus', checkAndAdvanceWeek);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [settings, currentWeek, buildFullStateSnapshot]);

  // Teacher updates their avatar
  const handleUpdateTeacherAvatar = useCallback((newAvatarUrl: string) => {
    const resolved = resolveTeacherAvatar(newAvatarUrl);
    setTeacherAvatarState(resolved);
    setTeacherAvatar(resolved);
    setCurrentUser(prev => {
      if (prev && prev.vaiTro.includes('GV')) {
        const updated = { ...prev, avatarUrl: resolved };
        saveAuthSession(updated, 'GV', true);
        return updated;
      }
      return prev;
    });
    saveServerState(buildFullStateSnapshot({ teacherAvatar: resolved }), true);
    setToast({
      id: Date.now().toString(),
      message: 'Đã cập nhật ảnh đại diện Thầy ✨',
      subMessage: 'Ảnh đại diện Giáo viên chủ nhiệm đã được lưu lên đám mây.',
    });
  }, [buildFullStateSnapshot]);

  // Teacher updates profile (custom name & status text)
  const handleSaveTeacherProfile = useCallback((profile: TeacherProfile) => {
    setTeacherProfileState(profile);
    saveTeacherProfile(profile);
    setCurrentUser(prev => {
      if (prev && prev.vaiTro.includes('GV')) {
        const updated = {
          ...prev,
          hoTen: profile.hoTen,
          statusText: profile.statusText
        };
        saveAuthSession(updated, 'GV', true);
        return updated;
      }
      return prev;
    });
    saveServerState(buildFullStateSnapshot({ teacherProfile: profile }), true);
    setToast({
      id: Date.now().toString(),
      message: 'Đã lưu thông tin Giáo viên chủ nhiệm ✨',
      subMessage: `Họ tên: ${profile.hoTen} • ${profile.statusText}`,
    });
  }, [buildFullStateSnapshot]);

  // Teacher imports real student list from Excel or Text (Lấy Sơ đồ lớp làm chuẩn & quy chiếu)
  const handleImportStudents = useCallback((newStudents: Student[], newLayout: SeatLayoutNode[]) => {
    const synced = syncStudentsWithSeatingLayout(normalizeStudentsList(newStudents), newLayout);
    const normalized = synced.students;
    const syncedLayout = synced.layout;
    const reconciledAcademic = reconcileAcademicRecordsWithSeating(normalized, academicRecords, 1);
    const reconciledRecords = reconcileDisciplineRecordsWithSeating(normalized, records);

    setStudents(normalized);
    setLayout(syncedLayout);
    setAcademicRecords(reconciledAcademic);
    setRecords(reconciledRecords);
    localStorage.setItem('app_students_10a5_v4', JSON.stringify(normalized));
    localStorage.setItem('app_layout_10a5_v4', JSON.stringify(syncedLayout));
    localStorage.setItem('app_records_10a5', JSON.stringify(reconciledRecords));
    saveAcademicRecords(reconciledAcademic);

    saveServerState(
      buildFullStateSnapshot({
        students: normalized,
        layout: syncedLayout,
        academicRecords: reconciledAcademic,
        records: reconciledRecords,
      }),
      true
    );

    setToast({
      id: Date.now().toString(),
      message: `Đã đồng bộ Sơ đồ lớp chuẩn: ${normalized.length} học sinh 🎓`,
      subMessage: 'Tất cả danh sách điểm và nề nếp đã được quy chiếu theo Sơ đồ lớp và lưu lên mây.',
    });
  }, [academicRecords, records, buildFullStateSnapshot]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('app_records_10a5', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('app_rules_10a5', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('app_settings_10a5', JSON.stringify(settings));
  }, [settings]);

  // Realtime Cloud Firebase Realtime Database sync listener across all devices
  const isApplyingRemoteUpdate = useRef(false);

  // Apply remote cloud state helper (used by both initial fetch & realtime listener)
  // Luôn lấy Sơ đồ lớp (`layout` + `students`) làm chuẩn và quy chiếu các danh sách khác
  const applyCloudState = useCallback((cloudState: ClassroomFullState) => {
    isApplyingRemoteUpdate.current = true;
    markRemoteStateApplied(cloudState);

    let masterStudents: Student[] | null = null;
    let masterLayout: SeatLayoutNode[] | null = null;
    let wasTrimmedToSeating = false;

    if (Array.isArray(cloudState.students) && cloudState.students.length > 0) {
      const incomingLayout = Array.isArray(cloudState.layout) && cloudState.layout.length > 0 ? cloudState.layout : [];
      const synced = syncStudentsWithSeatingLayout(normalizeStudentsList(cloudState.students), incomingLayout);
      masterStudents = synced.students;
      masterLayout = synced.layout;
      if (cloudState.students.length !== synced.students.length) {
        wasTrimmedToSeating = true;
      }
      setStudents(synced.students);
      setLayout(synced.layout);
      localStorage.setItem('app_students_10a5_v4', JSON.stringify(synced.students));
      localStorage.setItem('app_layout_10a5_v4', JSON.stringify(synced.layout));

      // Keep logged-in Student/Cadre session synchronized with latest cloud student data
      setCurrentUser(prev => {
        if (prev && 'maHS' in prev) {
          const freshStudent = synced.students.find(s => s.maHS === (prev as Student).maHS);
          if (freshStudent) {
            const session = getSavedAuthSession();
            saveAuthSession(freshStudent, session?.role || 'HS', session?.remember ?? true);
            return freshStudent;
          }
        }
        return prev;
      });
    } else if (Array.isArray(cloudState.layout) && cloudState.layout.length > 0) {
      setLayout(cloudState.layout);
      localStorage.setItem('app_layout_10a5_v4', JSON.stringify(cloudState.layout));
    }

    let finalRecords = cloudState.records;
    if (Array.isArray(cloudState.records)) {
      const cleanedRecords = filterOutLegacyDemoRecords(cloudState.records);
      const reconciled = masterStudents
        ? reconcileDisciplineRecordsWithSeating(masterStudents, cleanedRecords)
        : cleanedRecords;
      finalRecords = reconciled;
      setRecords(reconciled);
      localStorage.setItem('app_records_10a5', JSON.stringify(reconciled));
    }
    let finalAcademicRecords = cloudState.academicRecords;
    if (Array.isArray(cloudState.academicRecords)) {
      const reconciledGrades = masterStudents
        ? reconcileAcademicRecordsWithSeating(masterStudents, cloudState.academicRecords, 1)
        : cloudState.academicRecords;
      finalAcademicRecords = reconciledGrades;
      setAcademicRecords(reconciledGrades);
      saveAcademicRecords(reconciledGrades);
    }

    // Nếu dữ liệu trên mây trước đó bị dư học sinh ngoài Sơ đồ lớp (VD: 50 HS trong khi Sơ đồ lớp có 48 HS),
    // tự động lưu lại bản chuẩn 48 HS lên mây để đồng bộ vĩnh viễn.
    if (wasTrimmedToSeating && masterStudents && masterLayout) {
      saveServerState(
        {
          ...cloudState,
          students: masterStudents,
          layout: masterLayout,
          records: finalRecords || [],
          academicRecords: finalAcademicRecords || [],
        },
        true
      );
    }
    if (cloudState.settings) {
      setSettings(prev => {
        const merged = { ...prev, ...cloudState.settings };
        localStorage.setItem('app_settings_10a5', JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.rules)) {
      setRules(cloudState.rules);
      localStorage.setItem('app_rules_10a5', JSON.stringify(cloudState.rules));
    }
    if (cloudState.teacherAvatar) {
      const resolved = resolveTeacherAvatar(cloudState.teacherAvatar);
      setTeacherAvatarState(resolved);
      setTeacherAvatar(resolved);
      setCurrentUser(prev => prev && prev.vaiTro.includes('GV') ? { ...prev, avatarUrl: resolved } : prev);
    }
    if (cloudState.teacherProfile && typeof cloudState.teacherProfile === 'object') {
      setTeacherProfileState(cloudState.teacherProfile);
      saveTeacherProfile(cloudState.teacherProfile);
      setCurrentUser(prev => prev && prev.vaiTro.includes('GV') ? {
        ...prev,
        hoTen: cloudState.teacherProfile.hoTen || prev.hoTen,
        statusText: cloudState.teacherProfile.statusText || (prev as any).statusText,
      } : prev);
    }
    if (typeof cloudState.currentWeek === 'number' && cloudState.currentWeek >= 1) {
      setCurrentWeek(cloudState.currentWeek);
      localStorage.setItem('app_current_week', String(cloudState.currentWeek));
    }
    if (cloudState.studentBadgesMap || cloudState.studentActiveBadges) {
      setAllStudentBadgesState(cloudState.studentBadgesMap, cloudState.studentActiveBadges);
    }
    if (cloudState.studentPasswords && typeof cloudState.studentPasswords === 'object') {
      setAllStudentPasswords(cloudState.studentPasswords);
    }

    setTimeout(() => {
      isApplyingRemoteUpdate.current = false;
    }, 600);
  }, []);

  // Persistent Server State: Initial fetch & hydration from Firebase Realtime Database
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const serverState = await fetchServerState();
        if (!isMounted) return;
        if (serverState) {
          applyCloudState(serverState);
        }
      } catch (err) {
        console.warn('Initial cloud state sync error:', err);
      }
    })();
    return () => { isMounted = false; };
  }, [applyCloudState]);

  useEffect(() => {
    const unsubscribe = subscribeToCloudClassState((cloudState) => {
      if (!cloudState) return;
      applyCloudState(cloudState);
    });
    return () => unsubscribe();
  }, [applyCloudState]);

  // Realtime Firebase Auth listener: Automatically log in teacher on Google redirect or session restore
  useEffect(() => {
    const unsub = onFirebaseAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        if (isAuthorizedTeacherEmail(firebaseUser.email)) {
          const prof = getTeacherProfile();
          const effectiveName = prof.hoTen || firebaseUser.displayName || 'Thầy Dương Văn Huy';
          const resolvedAvatar = resolveTeacherAvatar(teacherAvatar || firebaseUser.photoURL);
          const teacherUser = {
            hoTen: effectiveName,
            statusText: prof.statusText,
            email: firebaseUser.email,
            vaiTro: ['GV'] as RoleCode[],
            avatarUrl: resolvedAvatar,
          };
          saveAuthSession(teacherUser, 'GV', true);
          setCurrentUser(teacherUser);
          setCurrentRole('GV');
          setIsLoginModalOpen(false);
        } else {
          await logoutFirebase().catch(() => {});
          setToast({
            id: Date.now().toString(),
            message: `Truy cập bị từ chối: ${firebaseUser.email} ⛔`,
            subMessage: 'Chỉ tài khoản Google của Giáo viên chủ nhiệm (yanghuy91@gmail.com) mới có quyền quản trị.',
          });
        }
      }
    });
    return () => unsub();
  }, [teacherAvatar]);

  // Debounced auto-save to server on any modification
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isApplyingRemoteUpdate.current) {
      return; // Bỏ qua tự lưu nếu dữ liệu vừa được cập nhật từ máy chủ realtime
    }
    scheduleServerSync(buildFullStateSnapshot());
  }, [students, records, academicRecords, settings, layout, rules, teacherAvatar, teacherProfile, currentWeek, buildFullStateSnapshot]);

  // Sync badges & passwords immediately on student/teacher change events
  useEffect(() => {
    const handleImmediateEventSync = () => {
      saveServerState(buildFullStateSnapshot(), true);
    };
    window.addEventListener('lop10a5:badge_change', handleImmediateEventSync);
    window.addEventListener('lop10a5:password_change', handleImmediateEventSync);
    return () => {
      window.removeEventListener('lop10a5:badge_change', handleImmediateEventSync);
      window.removeEventListener('lop10a5:password_change', handleImmediateEventSync);
    };
  }, [buildFullStateSnapshot]);

  // Compute student summaries
  const studentSummaries = useMemo(() => {
    const map: Record<string, StudentWeekSummary> = {};
    students.forEach(st => {
      map[st.maHS] = calculateStudentWeekSummary(
        st.maHS,
        st.hoTen,
        st.to,
        currentWeek,
        records,
        settings,
        currentWeek
      );
    });
    return map;
  }, [students, currentWeek, records, settings]);

  // Add record handler
  const handleAddRecord = useCallback((newRecordData: Omit<DisciplineRecord, 'maGhiNhan' | 'thoiGianMayChu' | 'thoiGianMay'>) => {
    const id = `REC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowISO = new Date().toISOString();

    const record: DisciplineRecord = {
      ...newRecordData,
      maGhiNhan: id,
      thoiGianMayChu: nowISO,
      thoiGianMay: nowISO,
    };

    const updated = [record, ...records];
    setRecords(updated);
    localStorage.setItem('app_records_10a5', JSON.stringify(updated));
    saveServerState(buildFullStateSnapshot({ records: updated, updatedAt: nowISO }), true);

    // Show 8-second Toast with Undo
    setToast({
      id,
      recordId: id,
      message: `Đã ghi: ${record.hoTen} – ${record.tenHanhVi}`,
      subMessage: `Trừ ${record.diemSo} điểm · Buổi ${record.buoi === 'Sang' ? 'Sáng' : 'Chiều'}`,
    });
  }, [records, buildFullStateSnapshot]);

  // Undo / Void record handler
  const handleUndoRecord = useCallback((recordId: string) => {
    const updated = records.map(r => {
      if (r.maGhiNhan === recordId) {
        return {
          ...r,
          trangThai: 'DaHuy' as const,
          lyDoHuy: 'Người ghi bấm Hoàn tác trong 8 giây',
          thoiGianHuy: new Date().toISOString(),
        };
      }
      return r;
    });
    setRecords(updated);
    localStorage.setItem('app_records_10a5', JSON.stringify(updated));
    saveServerState(buildFullStateSnapshot({ records: updated }), true);

    setToast({
      id: `undo-${Date.now()}`,
      message: 'Đã hoàn tác bản ghi vi phạm thành công.',
    });
  }, [records, buildFullStateSnapshot]);

  // Manual void by cadre or teacher
  const handleVoidRecord = useCallback((recordId: string, reason: string) => {
    const updated = records.map(r => {
      if (r.maGhiNhan === recordId) {
        return {
          ...r,
          trangThai: 'DaHuy' as const,
          lyDoHuy: reason,
          thoiGianHuy: new Date().toISOString(),
        };
      }
      return r;
    });
    setRecords(updated);
    localStorage.setItem('app_records_10a5', JSON.stringify(updated));
    saveServerState(buildFullStateSnapshot({ records: updated }), true);

    setToast({
      id: `void-${Date.now()}`,
      message: 'Bản ghi đã được chuyển sang trạng thái Đã hủy.',
    });
  }, [records, buildFullStateSnapshot]);

  // Explanation submit by student
  const handleSubmitExplanation = useCallback((recordId: string, explanation: string) => {
    const updated = records.map(r => {
      if (r.maGhiNhan === recordId) {
        return {
          ...r,
          trangThai: 'ChoDuyet' as const,
          noiDungGiaiTrinh: explanation,
          thoiGianGiaiTrinh: new Date().toISOString(),
        };
      }
      return r;
    });
    setRecords(updated);
    localStorage.setItem('app_records_10a5', JSON.stringify(updated));
    saveServerState(buildFullStateSnapshot({ records: updated }), true);

    setToast({
      id: `exp-${Date.now()}`,
      message: 'Đã gửi giải trình lên đám mây. Vui lòng chờ Giáo viên xem xét.',
    });
  }, [records, buildFullStateSnapshot]);

  // Teacher or delegated Cadre resolve explanation
  const handleResolveExplanation = useCallback((recordId: string, result: 'ChapNhan' | 'TuChoi', reason: string) => {
    const approverLabel = currentRole === 'GV'
      ? `${teacherProfile.hoTen} (GVCN)`
      : currentUser && 'hoTen' in currentUser
        ? `${currentUser.hoTen} (BCS được ủy quyền)`
        : `${teacherProfile.hoTen} (GVCN)`;
    const updated = records.map(r => {
      if (r.maGhiNhan === recordId) {
        return {
          ...r,
          trangThai: (result === 'ChapNhan' ? 'DaChapNhan' : 'BiTuChoi') as DisciplineRecord['trangThai'],
          nguoiDuyet: approverLabel,
          ketQuaDuyet: result,
          lyDoDuyet: reason,
        };
      }
      return r;
    });
    setRecords(updated);
    localStorage.setItem('app_records_10a5', JSON.stringify(updated));
    saveServerState(buildFullStateSnapshot({ records: updated }), true);

    setToast({
      id: `res-${Date.now()}`,
      message: result === 'ChapNhan' ? 'Đã chấp nhận giải trình (Hủy trừ điểm).' : 'Đã từ chối giải trình.',
    });
  }, [records, currentRole, currentUser, teacherProfile.hoTen, buildFullStateSnapshot]);

  // Toggle rule pin
  const handleToggleRulePin = useCallback((ruleId: string) => {
    const updated = rules.map(r => {
      if (r.maNoiQuy === ruleId) {
        return { ...r, ghim: !r.ghim };
      }
      return r;
    });
    setRules(updated);
    localStorage.setItem('app_rules_10a5', JSON.stringify(updated));
    saveServerState(buildFullStateSnapshot({ rules: updated }), true);
  }, [rules, buildFullStateSnapshot]);

  // Fast demo role switcher
  const handleSwitchDemoRole = (role: RoleCode, studentId?: string) => {
    setCurrentRole(role);
    if (role === 'GV') {
      setCurrentUser({
        hoTen: teacherProfile.hoTen || 'Thầy Dương Văn Huy (GVCN)',
        vaiTro: ['GV'],
        avatarUrl: teacherAvatar,
      });
    } else {
      const student = students.find(s => s.maHS === (studentId || 'HS01'));
      if (student) {
        setCurrentUser(student);
      }
    }
  };

  // Logout
  const handleLogout = () => {
    clearAuthSession();
    logoutFirebase().catch(() => {});
    if (typeof (window as any).google?.accounts?.id !== 'undefined') {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
      } catch (e) {}
    }
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  // Student login from modal
  const handleLoginStudent = (student: Student, role: RoleCode, remember = true) => {
    const freshStudent = students.find(s => s.maHS === student.maHS) || student;
    saveAuthSession(freshStudent, role, remember);
    setCurrentUser(freshStudent);
    setCurrentRole(role);
    setIsLoginModalOpen(false);
  };

  // Teacher login from modal (supports Google Profile)
  const handleLoginTeacher = (remember = true, teacherInfo?: { hoTen?: string; email?: string; avatarUrl?: string }) => {
    const prof = getTeacherProfile();
    const effectiveName = prof.hoTen || teacherInfo?.hoTen || 'Thầy Dương Văn Huy';
    const effectiveAvatar = resolveTeacherAvatar(teacherAvatar || teacherInfo?.avatarUrl);

    const teacherUser = {
      hoTen: effectiveName,
      statusText: prof.statusText,
      email: teacherInfo?.email || prof.email,
      vaiTro: ['GV'] as RoleCode[],
      avatarUrl: effectiveAvatar,
    };
    saveAuthSession(teacherUser, 'GV', remember);
    setCurrentUser(teacherUser);
    setCurrentRole('GV');
    setIsLoginModalOpen(false);
  };

  // Teacher updates classroom seating and layout (Lấy Sơ đồ lớp làm chuẩn & quy chiếu toàn bộ danh sách khác)
  const handleUpdateLayout = useCallback((newLayout: SeatLayoutNode[], updatedStudents: Student[]) => {
    const synced = syncStudentsWithSeatingLayout(normalizeStudentsList(updatedStudents), newLayout);
    const normalized = synced.students;
    const syncedLayout = synced.layout;
    const reconciledAcademic = reconcileAcademicRecordsWithSeating(normalized, academicRecords, 1);
    const reconciledRecords = reconcileDisciplineRecordsWithSeating(normalized, records);

    setLayout(syncedLayout);
    setStudents(normalized);
    setAcademicRecords(reconciledAcademic);
    setRecords(reconciledRecords);
    localStorage.setItem('app_layout_10a5_v4', JSON.stringify(syncedLayout));
    localStorage.setItem('app_students_10a5_v4', JSON.stringify(normalized));
    localStorage.setItem('app_records_10a5', JSON.stringify(reconciledRecords));
    saveAcademicRecords(reconciledAcademic);

    saveServerState(
      buildFullStateSnapshot({
        students: normalized,
        layout: syncedLayout,
        academicRecords: reconciledAcademic,
        records: reconciledRecords,
      }),
      true
    );

    setToast({
      id: Date.now().toString(),
      message: 'Đã lưu Sơ đồ lớp chuẩn & quy chiếu dữ liệu ✨',
      subMessage: `Đã đồng bộ ${normalized.length} học sinh trên Sơ đồ lớp với Bảng điểm & Nhật ký nề nếp lên đám mây!`,
    });
  }, [academicRecords, records, buildFullStateSnapshot]);

  // Student or Teacher updates a student's avatar
  const handleUpdateStudentAvatar = useCallback((studentId: string, avatarUrl?: string) => {
    const validUrl = resolveStudentAvatar(avatarUrl);
    const updatedStudents = students.map(s => (s.maHS === studentId ? { ...s, avatarUrl: validUrl } : s));

    setStudents(updatedStudents);
    localStorage.setItem('app_students_10a5_v4', JSON.stringify(updatedStudents));

    // Persist immediately to Firebase Realtime Database (force = true)
    saveServerState(buildFullStateSnapshot({ students: updatedStudents }), true);

    // Also update currentUser and persisted auth session if logged in as this student
    setCurrentUser(prev => {
      if (prev && 'maHS' in prev && (prev as Student).maHS === studentId) {
        const updatedUser = { ...prev, avatarUrl: validUrl } as Student;
        const session = getSavedAuthSession();
        saveAuthSession(updatedUser, session?.role || currentRole, session?.remember ?? true);
        return updatedUser;
      }
      return prev;
    });

    setToast({
      id: Date.now().toString(),
      message: 'Đã cập nhật & lưu ảnh đại diện lên mây ✨',
      subMessage: 'Ảnh đại diện mới đã được đồng bộ vào hồ sơ và sơ đồ lớp trên mọi thiết bị!',
    });
  }, [students, currentRole, buildFullStateSnapshot]);

  // Teacher import time-stamped records from file (Quy chiếu theo Sơ đồ lớp & deduplicated by maGhiNhan)
  const handleImportRecords = useCallback((newRecords: DisciplineRecord[]) => {
    const syncedSeating = syncStudentsWithSeatingLayout(students, layout);
    const cleanedIncoming = reconcileDisciplineRecordsWithSeating(
      syncedSeating.students,
      filterOutLegacyDemoRecords(newRecords)
    );
    const seenIds = new Set<string>();
    const updated: DisciplineRecord[] = [];
    for (const r of [...cleanedIncoming, ...records]) {
      if (!r || !r.maGhiNhan) continue;
      if (seenIds.has(r.maGhiNhan)) continue;
      seenIds.add(r.maGhiNhan);
      updated.push(r);
    }
    setRecords(updated);
    localStorage.setItem('app_records_10a5', JSON.stringify(updated));
    saveServerState(buildFullStateSnapshot({ records: updated }), true);
    setToast({
      id: Date.now().toString(),
      message: `Đã nạp & quy chiếu ${cleanedIncoming.length} bản ghi theo Sơ đồ lớp ✨`,
      subMessage: 'Dữ liệu thi đua từ file đã được quy chiếu theo Sơ đồ lớp và lưu lên đám mây thành công!',
    });
  }, [students, layout, records, buildFullStateSnapshot]);

  // Teacher assigns custom frame to student
  const handleAssignFrame = useCallback((studentId: string, frameId: string | undefined) => {
    const updated = students.map(s => (s.maHS === studentId ? { ...s, customFrameId: frameId } : s));
    setStudents(updated);
    localStorage.setItem('app_students_10a5_v4', JSON.stringify(updated));
    saveServerState(buildFullStateSnapshot({ students: updated }), true);
  }, [students, buildFullStateSnapshot]);

  // Teacher auto awards frames according to ranking (cùng điểm thì cùng hạng, cùng nhận khung xứng đáng)
  const handleBatchAutoAssignByRank = useCallback(() => {
    const studentList = students.map(st => ({
      student: st,
      score: studentSummaries[st.maHS]?.diemHienTai ?? 100,
      deductions: studentSummaries[st.maHS]?.tongDiemTru ?? 0,
      bonuses: studentSummaries[st.maHS]?.tongDiemCong ?? 0,
    }));

    const ranked = calculateDenseRankings(
      studentList,
      item => item.score,
      item => item.deductions,
      item => item.bonuses
    );

    const updated = ranked.map(item => {
      const rank = item.officialRank;
      let frameId: string | undefined = undefined;
      if (rank === 1) frameId = 'diamond_champion';
      else if (rank <= 3) frameId = 'platinum_elite';
      else if (rank <= 10) frameId = 'gold_royal';
      return { ...item.student, customFrameId: frameId };
    });

    setStudents(updated);
    localStorage.setItem('app_students_10a5_v4', JSON.stringify(updated));
    saveServerState(buildFullStateSnapshot({ students: updated }), true);
    setToast({
      id: Date.now().toString(),
      message: 'Đã tự động phong tặng khung vinh danh ✨',
      subMessage: 'Top 1 (Kim Cương), Top 2-3 (Bạch Kim), Top 4-10 (Hoàng Kim) theo chuẩn đồng hạng đã được lưu lên mây!',
    });
  }, [students, studentSummaries, buildFullStateSnapshot]);

  // Active logged-in student synced with live students array
  const activeLoggedInStudent = useMemo(() => {
    if (currentUser && 'maHS' in currentUser) {
      return students.find(s => s.maHS === (currentUser as Student).maHS) || (currentUser as Student);
    }
    return null;
  }, [currentUser, students]);

  return (
    <div className="min-h-screen flex flex-col bg-app text-main antialiased selection:bg-accent/20">
      {/* Header (Chỉ hiển thị khi là Khách chưa đăng nhập; Với GV và HS, Banner đóng vai trò Header tích hợp) */}
      {!currentUser && (
        <Header
          currentUser={currentUser}
          currentRole={currentRole}
          onLogout={handleLogout}
          currentWeek={currentWeek}
          onOpenCallingGames={currentRole === 'GV' ? () => setShowCallingGamesModal(true) : undefined}
          onOpenTeacherAvatar={() => setIsTeacherAvatarModalOpen(true)}
          onOpenTeacherProfile={() => setIsTeacherProfileModalOpen(true)}
          onOpenStudentAvatar={() => setIsStudentAvatarModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl xl:max-w-7xl mx-auto px-3 sm:px-6 py-4">
        {currentUser && currentRole === 'GV' && (
          <TeacherDashboard
            students={students}
            layout={layout}
            rules={rules}
            records={records}
            studentSummaries={studentSummaries}
            currentWeek={currentWeek}
            onChangeCurrentWeek={handleSetCurrentWeek}
            settings={settings}
            onUpdateSettings={newSets => {
              const updatedSettings = { ...settings, ...newSets };
              setSettings(updatedSettings);
              localStorage.setItem('app_settings_10a5', JSON.stringify(updatedSettings));
              saveServerState(buildFullStateSnapshot({ settings: updatedSettings }), true);
            }}
            onAddRecord={handleAddRecord}
            onVoidRecord={handleVoidRecord}
            onResolveExplanation={handleResolveExplanation}
            onToggleRulePin={handleToggleRulePin}
            onUpdateLayout={handleUpdateLayout}
            onImportRecords={handleImportRecords}
            onUpdateStudentAvatar={handleUpdateStudentAvatar}
            onAssignFrame={handleAssignFrame}
            onBatchAutoAssignByRank={handleBatchAutoAssignByRank}
            academicRecords={academicRecords}
            onUpdateAcademicRecords={handleUpdateAcademicRecords}
            teacherProfile={teacherProfile}
            onUpdateTeacherProfile={handleSaveTeacherProfile}
            onImportStudents={handleImportStudents}
            onOpenTeacherProfile={() => setIsTeacherProfileModalOpen(true)}
            onOpenTeacherAvatar={() => setIsTeacherAvatarModalOpen(true)}
            teacherAvatarUrl={teacherAvatar}
            onLogout={handleLogout}
          />
        )}

        {activeLoggedInStudent && currentRole !== 'GV' && currentRole !== 'HS' && (
          <CadreView
            currentCadre={activeLoggedInStudent}
            cadreRole={currentRole}
            allStudents={students}
            layout={layout}
            rules={rules}
            records={records}
            studentSummaries={studentSummaries}
            currentWeek={currentWeek}
            settings={settings}
            onUpdateSettings={newSets => {
              const updatedSettings = { ...settings, ...newSets };
              setSettings(updatedSettings);
              localStorage.setItem('app_settings_10a5', JSON.stringify(updatedSettings));
              saveServerState(buildFullStateSnapshot({ settings: updatedSettings }), true);
            }}
            academicRecords={academicRecords}
            onAddRecord={handleAddRecord}
            onVoidRecord={handleVoidRecord}
            onResolveExplanation={handleResolveExplanation}
            onSubmitExplanation={handleSubmitExplanation}
            onUpdateStudentAvatar={handleUpdateStudentAvatar}
            onOpenCallingGames={() => setShowCallingGamesModal(true)}
            onLogout={handleLogout}
          />
        )}

        {activeLoggedInStudent && currentRole === 'HS' && (
          <StudentView
            currentStudent={activeLoggedInStudent}
            allStudents={students}
            layout={layout}
            rules={rules}
            records={records}
            studentSummaries={studentSummaries}
            currentWeek={currentWeek}
            settings={settings}
            onUpdateSettings={newSets => {
              const updatedSettings = { ...settings, ...newSets };
              setSettings(updatedSettings);
              localStorage.setItem('app_settings_10a5', JSON.stringify(updatedSettings));
              saveServerState(buildFullStateSnapshot({ settings: updatedSettings }), true);
            }}
            academicRecords={academicRecords}
            onAddRecord={handleAddRecord}
            onVoidRecord={handleVoidRecord}
            onResolveExplanation={handleResolveExplanation}
            onSubmitExplanation={handleSubmitExplanation}
            onUpdateStudentAvatar={handleUpdateStudentAvatar}
            onOpenCallingGames={() => setShowCallingGamesModal(true)}
            onLogout={handleLogout}
          />
        )}

        {/* Not Logged In Screen */}
        {!currentUser && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-4xl shadow-inner mb-4">
              🎓
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-main">
              Hệ Thống Thi Đua Lớp 10A5
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-md mt-1 mb-6">
              THPT Số 2 Đức Phổ · Vui lòng đăng nhập tài khoản Giáo viên, Ban cán sự hoặc Học sinh để sử dụng.
            </p>
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-accent text-on-accent font-extrabold text-sm shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🔐</span>
              <span>Đăng nhập vào lớp học</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer with exact title "10A5 - THPT Số 2 Đức Phổ" (without teacher name) */}
      <Footer />

      {/* 8-second Toast with Undo */}
      <Toast
        toast={toast}
        onUndo={handleUndoRecord}
        onClose={() => setToast(null)}
      />

      {/* 10 Calling Games Modal (Direct Launch for Teacher or Delegated Cadre) */}
      {showCallingGamesModal && (currentRole === 'GV' || (activeLoggedInStudent && (settings.cadreDelegatedPermissions?.[activeLoggedInStudent.maHS] || []).includes('GOI_TEN_TRO_CHOI'))) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-surface rounded-3xl shadow-2xl border border-token w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Top Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎲</span>
                <span className="font-extrabold text-sm sm:text-base">10 Trò Chơi Gọi Học Sinh Lên Bảng (10A5)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCallingGamesModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                ← Quay lại ứng dụng
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              <CallingGamesHub
                students={students}
                onQuickRecord={(st) => {
                  setShowCallingGamesModal(false);
                  handleSwitchDemoRole('GV');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Teacher Avatar Modal */}
      <TeacherAvatarModal
        isOpen={isTeacherAvatarModalOpen}
        onClose={() => setIsTeacherAvatarModalOpen(false)}
        currentAvatarUrl={teacherAvatar}
        teacherName={teacherProfile.hoTen}
        onSelectAvatar={handleUpdateTeacherAvatar}
      />

      {/* Teacher Profile Modal (Name & Status Edit) */}
      <TeacherProfileModal
        isOpen={isTeacherProfileModalOpen}
        onClose={() => setIsTeacherProfileModalOpen(false)}
        currentProfile={teacherProfile}
        currentAvatarUrl={teacherAvatar}
        onSaveProfile={handleSaveTeacherProfile}
        onSaveSuccess={handleSaveTeacherProfile}
        onOpenAvatarPicker={() => {
          setIsTeacherProfileModalOpen(false);
          setIsTeacherAvatarModalOpen(true);
        }}
      />

      {/* Student / Cadre Avatar Modal (accessible from Header or anywhere for current demo student) */}
      {isStudentAvatarModalOpen && currentUser && 'maHS' in currentUser && (
        <AvatarUploadModal
          isOpen={isStudentAvatarModalOpen}
          onClose={() => setIsStudentAvatarModalOpen(false)}
          student={currentUser as Student}
          allStudents={students}
          settings={settings}
          onSaveAvatar={(studentId, newAvatarUrl) => {
            handleUpdateStudentAvatar(studentId, newAvatarUrl);
            setIsStudentAvatarModalOpen(false);
          }}
        />
      )}

      {/* Login Gate Modal if logged out */}
      {isLoginModalOpen && (
        <LoginModal
          students={students}
          layout={layout}
          onLoginStudent={handleLoginStudent}
          onLoginTeacher={handleLoginTeacher}
          classCode={settings.maLop}
        />
      )}
    </div>
  );
}
