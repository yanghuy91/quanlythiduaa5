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
  getDefaultStudentAvatar
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
  clearAuthSession 
} from './utils/authService';
import { getAcademicRecords, saveAcademicRecords } from './data/academicCatalog';
import { getTeacherAvatar, setTeacherAvatar, resolveTeacherAvatar, DEFAULT_TEACHER_AVATAR } from './data/teacherAvatars';
import { TeacherAvatarModal } from './components/teacher/TeacherAvatarModal';
import { TeacherProfileModal } from './components/teacher/TeacherProfileModal';
import { getTeacherProfile, saveTeacherProfile, TeacherProfile } from './data/teacherProfile';
import { AvatarUploadModal } from './components/common/AvatarUploadModal';
import { 
  fetchServerState, 
  scheduleServerSync, 
  saveServerState, 
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

export default function App() {
  // Enforce Light mode permanently (Default light, removed dark mode)
  useEffect(() => {
    localStorage.setItem('app_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }, []);

  // App dataset
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('app_students_10a5_v4');
    if (!saved) return MOCK_STUDENTS;
    try {
      const parsed: Student[] = JSON.parse(saved);
      // Clean up any corrupted avatarUrl string like "HS01"
      return parsed.map(s => {
        const hasValidUrl = s.avatarUrl && !s.avatarUrl.startsWith('HS') && s.avatarUrl.length > 5;
        return {
          ...s,
          avatarUrl: hasValidUrl ? s.avatarUrl : undefined
        };
      });
    } catch {
      return MOCK_STUDENTS;
    }
  });
  const [layout, setLayout] = useState<SeatLayoutNode[]>(() => {
    const saved = localStorage.getItem('app_layout_10a5_v4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return MOCK_SEAT_LAYOUT;
      }
    }
    return MOCK_SEAT_LAYOUT;
  });
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
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });
  const [academicRecords, setAcademicRecords] = useState<StudentAcademicRecord[]>(() => {
    return getAcademicRecords();
  });

  const handleUpdateAcademicRecords = useCallback((newRecords: StudentAcademicRecord[]) => {
    setAcademicRecords(newRecords);
    saveAcademicRecords(newRecords);
  }, []);

  // Current session & week (Persisted and changeable)
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    const saved = localStorage.getItem('app_current_week');
    return saved ? Number(saved) : 3;
  });

  const handleSetCurrentWeek = useCallback((week: number) => {
    setCurrentWeek(week);
    localStorage.setItem('app_current_week', String(week));
    setToast({
      id: Date.now().toString(),
      message: `Đã đổi tuần học hiện tại: Tuần ${week} ✨`,
      subMessage: `Điểm thi đua của lớp 10A5 được cập nhật theo Tuần ${week}`,
    });
  }, []);
  
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
    setToast({
      id: Date.now().toString(),
      message: 'Đã cập nhật ảnh đại diện Thầy ✨',
      subMessage: 'Ảnh đại diện Giáo viên chủ nhiệm đã được lưu thành công.',
    });
  }, []);

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
    setToast({
      id: Date.now().toString(),
      message: 'Đã lưu thông tin Giáo viên chủ nhiệm ✨',
      subMessage: `Họ tên: ${profile.hoTen} • ${profile.statusText}`,
    });
  }, []);

  // Teacher imports real student list from Excel or Text
  const handleImportStudents = useCallback((newStudents: Student[], newLayout: SeatLayoutNode[]) => {
    setStudents(newStudents);
    setLayout(newLayout);
    localStorage.setItem('app_students_10a5_v4', JSON.stringify(newStudents));
    localStorage.setItem('app_layout_10a5_v4', JSON.stringify(newLayout));

    // Save immediately to Cloud and Local server
    const badges = getAllStudentBadgesState();
    const fullState: ClassroomFullState = {
      students: newStudents,
      records,
      academicRecords,
      settings,
      layout: newLayout,
      rules,
      teacherAvatar,
      studentBadgesMap: badges.studentBadgesMap,
      studentActiveBadges: badges.studentActiveBadges,
      updatedAt: new Date().toISOString(),
      version: Date.now(),
    };
    saveServerState(fullState);

    setToast({
      id: Date.now().toString(),
      message: `Đã cập nhật danh sách lớp: ${newStudents.length} học sinh 🎓`,
      subMessage: 'Dữ liệu đã được lưu và đồng bộ lên đám mây thành công.',
    });
  }, [records, academicRecords, settings, rules, teacherAvatar]);

  // Toast notification state
  const [toast, setToast] = useState<ToastData | null>(null);

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

  // Persistent Server State: Initial fetch & hydration from server disk (/api/state)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const serverState = await fetchServerState();
        if (!isMounted) return;
        if (serverState) {
          if (Array.isArray(serverState.students) && serverState.students.length > 0) {
            setStudents(serverState.students);
            localStorage.setItem('app_students_10a5_v4', JSON.stringify(serverState.students));
          }
          if (Array.isArray(serverState.records)) {
            setRecords(serverState.records);
            localStorage.setItem('app_records_10a5', JSON.stringify(serverState.records));
          }
          if (Array.isArray(serverState.academicRecords)) {
            setAcademicRecords(serverState.academicRecords);
            saveAcademicRecords(serverState.academicRecords);
          }
          if (serverState.settings) {
            setSettings(serverState.settings);
            localStorage.setItem('app_settings_10a5', JSON.stringify(serverState.settings));
          }
          if (Array.isArray(serverState.layout) && serverState.layout.length > 0) {
            setLayout(serverState.layout);
            localStorage.setItem('app_layout_10a5_v4', JSON.stringify(serverState.layout));
          }
          if (Array.isArray(serverState.rules)) {
            setRules(serverState.rules);
            localStorage.setItem('app_rules_10a5', JSON.stringify(serverState.rules));
          }
          if (serverState.teacherAvatar) {
            const resolved = resolveTeacherAvatar(serverState.teacherAvatar);
            setTeacherAvatarState(resolved);
            setTeacherAvatar(resolved);
            setCurrentUser(prev => prev && prev.vaiTro.includes('GV') ? { ...prev, avatarUrl: resolved } : prev);
          }
          if (serverState.studentBadgesMap || serverState.studentActiveBadges) {
            setAllStudentBadgesState(serverState.studentBadgesMap, serverState.studentActiveBadges);
          }
        } else {
          // If server file doesn't exist yet, save current state to server
          const badges = getAllStudentBadgesState();
          const initialFullState: ClassroomFullState = {
            students,
            records,
            academicRecords,
            settings,
            layout,
            rules,
            teacherAvatar,
            studentBadgesMap: badges.studentBadgesMap,
            studentActiveBadges: badges.studentActiveBadges,
            updatedAt: new Date().toISOString(),
            version: 1,
          };
          saveServerState(initialFullState);
        }
      } catch (err) {
        console.warn('Initial server state sync error:', err);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Realtime Cloud Firestore sync listener across all devices
  useEffect(() => {
    const unsubscribe = subscribeToCloudClassState((cloudState) => {
      if (!cloudState) return;
      if (Array.isArray(cloudState.students) && cloudState.students.length > 0) {
        setStudents(cloudState.students);
        localStorage.setItem('app_students_10a5_v4', JSON.stringify(cloudState.students));
      }
      if (Array.isArray(cloudState.records)) {
        setRecords(cloudState.records);
        localStorage.setItem('app_records_10a5', JSON.stringify(cloudState.records));
      }
      if (Array.isArray(cloudState.academicRecords)) {
        setAcademicRecords(cloudState.academicRecords);
        localStorage.setItem('app_academic_records_10a5', JSON.stringify(cloudState.academicRecords));
      }
      if (cloudState.settings) {
        setSettings(prev => ({ ...prev, ...cloudState.settings }));
        localStorage.setItem('app_teacher_settings', JSON.stringify(cloudState.settings));
      }
      if (Array.isArray(cloudState.layout)) {
        setLayout(cloudState.layout);
        localStorage.setItem('app_layout_10a5_v4', JSON.stringify(cloudState.layout));
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
      if (cloudState.studentBadgesMap || cloudState.studentActiveBadges) {
        setAllStudentBadgesState(cloudState.studentBadgesMap, cloudState.studentActiveBadges);
      }
    });
    return () => unsubscribe();
  }, []);

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
          // Removed welcome toast as requested for clean experience
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
    const badges = getAllStudentBadgesState();
    const fullState: ClassroomFullState = {
      students,
      records,
      academicRecords,
      settings,
      layout,
      rules,
      teacherAvatar,
      studentBadgesMap: badges.studentBadgesMap,
      studentActiveBadges: badges.studentActiveBadges,
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    scheduleServerSync(fullState);
  }, [students, records, academicRecords, settings, layout, rules, teacherAvatar]);

  // Sync badges on badge change events
  useEffect(() => {
    const handleBadgeChange = () => {
      const badges = getAllStudentBadgesState();
      const fullState: ClassroomFullState = {
        students,
        records,
        academicRecords,
        settings,
        layout,
        rules,
        teacherAvatar,
        studentBadgesMap: badges.studentBadgesMap,
        studentActiveBadges: badges.studentActiveBadges,
        updatedAt: new Date().toISOString(),
        version: 1,
      };
      scheduleServerSync(fullState);
    };
    window.addEventListener('lop10a5:badge_change', handleBadgeChange);
    return () => window.removeEventListener('lop10a5:badge_change', handleBadgeChange);
  }, [students, records, academicRecords, settings, layout, rules, teacherAvatar]);

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
        settings
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

    setRecords(prev => [record, ...prev]);

    // Show 8-second Toast with Undo
    setToast({
      id,
      recordId: id,
      message: `Đã ghi: ${record.hoTen} – ${record.tenHanhVi}`,
      subMessage: `Trừ ${record.diemSo} điểm · Buổi ${record.buoi === 'Sang' ? 'Sáng' : 'Chiều'}`,
    });
  }, []);

  // Undo / Void record handler
  const handleUndoRecord = useCallback((recordId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.maGhiNhan === recordId) {
        return {
          ...r,
          trangThai: 'DaHuy',
          lyDoHuy: 'Người ghi bấm Hoàn tác trong 8 giây',
          thoiGianHuy: new Date().toISOString(),
        };
      }
      return r;
    }));

    setToast({
      id: `undo-${Date.now()}`,
      message: 'Đã hoàn tác bản ghi vi phạm thành công.',
    });
  }, []);

  // Manual void by cadre or teacher
  const handleVoidRecord = useCallback((recordId: string, reason: string) => {
    setRecords(prev => prev.map(r => {
      if (r.maGhiNhan === recordId) {
        return {
          ...r,
          trangThai: 'DaHuy',
          lyDoHuy: reason,
          thoiGianHuy: new Date().toISOString(),
        };
      }
      return r;
    }));

    setToast({
      id: `void-${Date.now()}`,
      message: 'Bản ghi đã được chuyển sang trạng thái Đã hủy.',
    });
  }, []);

  // Explanation submit
  const handleSubmitExplanation = useCallback((recordId: string, explanation: string) => {
    setRecords(prev => prev.map(r => {
      if (r.maGhiNhan === recordId) {
        return {
          ...r,
          trangThai: 'ChoDuyet',
          noiDungGiaiTrinh: explanation,
          thoiGianGiaiTrinh: new Date().toISOString(),
        };
      }
      return r;
    }));

    setToast({
      id: `exp-${Date.now()}`,
      message: 'Đã gửi giải trình. Vui lòng chờ Giáo viên xem xét.',
    });
  }, []);

  // Teacher resolve explanation
  const handleResolveExplanation = useCallback((recordId: string, result: 'ChapNhan' | 'TuChoi', reason: string) => {
    setRecords(prev => prev.map(r => {
      if (r.maGhiNhan === recordId) {
        return {
          ...r,
          trangThai: result === 'ChapNhan' ? 'DaChapNhan' : 'BiTuChoi',
          nguoiDuyet: 'Trần Văn Bình (GVCN)',
          ketQuaDuyet: result,
          lyDoDuyet: reason,
        };
      }
      return r;
    }));

    setToast({
      id: `res-${Date.now()}`,
      message: result === 'ChapNhan' ? 'Đã chấp nhận giải trình (Hủy trừ điểm).' : 'Đã từ chối giải trình.',
    });
  }, []);

  // Toggle rule pin
  const handleToggleRulePin = useCallback((ruleId: string) => {
    setRules(prev => prev.map(r => {
      if (r.maNoiQuy === ruleId) {
        return { ...r, ghim: !r.ghim };
      }
      return r;
    }));
  }, []);

  // Fast demo role switcher
  const handleSwitchDemoRole = (role: RoleCode, studentId?: string) => {
    setCurrentRole(role);
    if (role === 'GV') {
      setCurrentUser({
        hoTen: 'Trần Văn Bình (GVCN)',
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
    saveAuthSession(student, role, remember);
    setCurrentUser(student);
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

  // Teacher updates classroom seating and layout
  const handleUpdateLayout = useCallback((newLayout: SeatLayoutNode[], updatedStudents: Student[]) => {
    setLayout(newLayout);
    setStudents(updatedStudents);
    localStorage.setItem('app_layout_10a5_v4', JSON.stringify(newLayout));
    localStorage.setItem('app_students_10a5_v4', JSON.stringify(updatedStudents));

    // Save immediately to Cloud and Local server
    const badges = getAllStudentBadgesState();
    const fullState: ClassroomFullState = {
      students: updatedStudents,
      records,
      academicRecords,
      settings,
      layout: newLayout,
      rules,
      teacherAvatar,
      studentBadgesMap: badges.studentBadgesMap,
      studentActiveBadges: badges.studentActiveBadges,
      updatedAt: new Date().toISOString(),
      version: Date.now(),
    };
    saveServerState(fullState);

    setToast({
      id: Date.now().toString(),
      message: 'Đã lưu sơ đồ lớp học ✨',
      subMessage: `Đã lưu danh sách ${updatedStudents.length} học sinh và đồng bộ lên đám mây thành công!`,
    });
  }, [records, academicRecords, settings, rules, teacherAvatar]);

  // Student avatar update
  const handleUpdateStudentAvatar = useCallback((studentId: string, avatarUrl?: string) => {
    // Sanitize: do not accept studentId or short garbage string
    const validUrl = avatarUrl && !avatarUrl.startsWith('HS') ? avatarUrl : undefined;

    setStudents(prev => {
      const updated = prev.map(s => (s.maHS === studentId ? { ...s, avatarUrl: validUrl } : s));
      localStorage.setItem('app_students_10a5_v4', JSON.stringify(updated));

      const badges = getAllStudentBadgesState();
      const fullState: ClassroomFullState = {
        students: updated,
        records,
        academicRecords,
        settings,
        layout,
        rules,
        teacherAvatar,
        studentBadgesMap: badges.studentBadgesMap,
        studentActiveBadges: badges.studentActiveBadges,
        updatedAt: new Date().toISOString(),
        version: Date.now(),
      };
      saveServerState(fullState);

      return updated;
    });

    setCurrentUser(prev => {
      if (prev && 'maHS' in prev && (prev as Student).maHS === studentId) {
        return { ...prev, avatarUrl: validUrl } as Student;
      }
      return prev;
    });

    setToast({
      id: Date.now().toString(),
      message: 'Đã cập nhật ảnh đại diện ✨',
      subMessage: 'Ảnh đại diện mới đã được áp dụng vào hồ sơ và sơ đồ lớp!',
    });
  }, [records, academicRecords, settings, layout, rules, teacherAvatar]);

  // Teacher import time-stamped records from file
  const handleImportRecords = useCallback((newRecords: DisciplineRecord[]) => {
    setRecords(prev => [...newRecords, ...prev]);
    setToast({
      id: Date.now().toString(),
      message: `Đã nạp ${newRecords.length} bản ghi thời gian ✨`,
      subMessage: 'Dữ liệu thi đua từ file đã được tích hợp thành công vào hệ thống!',
    });
  }, []);

  // Teacher assigns custom frame to student
  const handleAssignFrame = useCallback((studentId: string, frameId: string | undefined) => {
    setStudents(prev => {
      const updated = prev.map(s => (s.maHS === studentId ? { ...s, customFrameId: frameId } : s));
      localStorage.setItem('app_students_10a5_v4', JSON.stringify(updated));
      return updated;
    });
  }, []);

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
    setToast({
      id: Date.now().toString(),
      message: 'Đã tự động phong tặng khung vinh danh ✨',
      subMessage: 'Top 1 (Kim Cương), Top 2-3 (Bạch Kim), Top 4-10 (Hoàng Kim) theo chuẩn đồng hạng đã được trao!',
    });
  }, [students, studentSummaries]);

  return (
    <div className="min-h-screen flex flex-col bg-app text-main antialiased selection:bg-accent/20">
      {/* Header (Chỉ hiển thị khi là Khách chưa đăng nhập; Với GV và HS, Banner đóng vai trò Header tích hợp) */}
      {!currentUser && (
        <Header
          currentUser={currentUser}
          currentRole={currentRole}
          onLogout={handleLogout}
          currentWeek={currentWeek}
          onChangeCurrentWeek={handleSetCurrentWeek}
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
            onUpdateSettings={newSets => setSettings(prev => ({ ...prev, ...newSets }))}
            onAddRecord={handleAddRecord}
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

        {currentUser && currentRole !== 'GV' && currentRole !== 'HS' && (
          <CadreView
            currentCadre={currentUser as Student}
            cadreRole={currentRole}
            allStudents={students}
            layout={layout}
            rules={rules}
            records={records}
            studentSummaries={studentSummaries}
            currentWeek={currentWeek}
            onChangeCurrentWeek={handleSetCurrentWeek}
            settings={settings}
            academicRecords={academicRecords}
            onAddRecord={handleAddRecord}
            onVoidRecord={handleVoidRecord}
            onSubmitExplanation={handleSubmitExplanation}
            onUpdateStudentAvatar={handleUpdateStudentAvatar}
            onLogout={handleLogout}
          />
        )}

        {currentUser && currentRole === 'HS' && (
          <StudentView
            currentStudent={currentUser as Student}
            allStudents={students}
            layout={layout}
            records={records}
            studentSummaries={studentSummaries}
            currentWeek={currentWeek}
            onChangeCurrentWeek={handleSetCurrentWeek}
            settings={settings}
            academicRecords={academicRecords}
            onSubmitExplanation={handleSubmitExplanation}
            onUpdateStudentAvatar={handleUpdateStudentAvatar}
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

      {/* 10 Calling Games Modal (Direct Launch from anywhere for Teacher only) */}
      {showCallingGamesModal && currentRole === 'GV' && (
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
