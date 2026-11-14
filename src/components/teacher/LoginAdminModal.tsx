import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  RotateCcw,
  Eye,
  EyeOff,
  Search,
  Check,
  X,
  ShieldCheck,
  Lock,
  Edit3,
  Users
} from 'lucide-react';
import { Student, TeacherSettings } from '../../types';
import {
  getAllStudentPasswords,
  DEFAULT_STUDENT_PASS,
  setStudentPasswordByAdmin,
  resetStudentPassword,
  resetAllStudentPasswords,
} from '../../utils/authService';
import { removeVietnameseAccents } from '../../utils/vietnamese';

interface TeacherAuthAdminPanelProps {
  students: Student[];
  settings: TeacherSettings;
  onUpdateSettings: (newSettings: Partial<TeacherSettings>) => void;
  onClose?: () => void;
}

export const TeacherAuthAdminPanel: React.FC<TeacherAuthAdminPanelProps> = ({
  students,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [passwordsMap, setPasswordsMap] = useState<Record<string, string>>(() => getAllStudentPasswords());
  const [showAllStudentPass, setShowAllStudentPass] = useState(true);

  const [classCodeInput, setClassCodeInput] = useState<string>(settings.maLop || '10A5');
  const [teacherEmailInput, setTeacherEmailInput] = useState<string>(settings.emailGiaoVien || 'yanghuy91@gmail.com');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'changed' | 'default' | 'cadre' | 1 | 2 | 3 | 4>('all');

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingPassValue, setEditingPassValue] = useState<string>('');
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const showTempNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  useEffect(() => {
    const sync = () => {
      setPasswordsMap(getAllStudentPasswords());
    };
    window.addEventListener('lop10a5:password_change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('lop10a5:password_change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    setClassCodeInput(settings.maLop || '10A5');
    if (settings.emailGiaoVien) {
      setTeacherEmailInput(settings.emailGiaoVien);
    }
  }, [settings.maLop, settings.emailGiaoVien]);

  const changedCount = useMemo(() => {
    return students.filter(s => {
      const p = passwordsMap[s.maHS];
      return p && p !== DEFAULT_STUDENT_PASS;
    }).length;
  }, [students, passwordsMap]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const customPass = passwordsMap[s.maHS];
      const isChanged = Boolean(customPass && customPass !== DEFAULT_STUDENT_PASS);
      const isCadre = s.vaiTro.some(r => r !== 'HS');

      if (filterMode === 'changed' && !isChanged) return false;
      if (filterMode === 'default' && isChanged) return false;
      if (filterMode === 'cadre' && !isCadre) return false;
      if (typeof filterMode === 'number' && s.to !== filterMode) return false;

      if (searchQuery.trim()) {
        const q = removeVietnameseAccents(searchQuery.trim().toLowerCase());
        const name = removeVietnameseAccents(s.hoTen.toLowerCase());
        const stt = String(s.viTriGhe || '');
        const id = s.maHS.toLowerCase();
        return name.includes(q) || stt === q || id.includes(q);
      }

      return true;
    });
  }, [students, passwordsMap, filterMode, searchQuery]);

  const handleSaveTeacherAuth = () => {
    const cleanCode = classCodeInput.trim().toUpperCase() || '10A5';
    const cleanEmail = teacherEmailInput.trim().toLowerCase();
    onUpdateSettings({
      maLop: cleanCode,
      emailGiaoVien: cleanEmail || undefined,
    });

    showTempNotice('Đã lưu cấu hình Email GVCN & Mã lớp.');
  };

  const handleResetOneStudent = (student: Student) => {
    resetStudentPassword(student.maHS);
    setPasswordsMap(getAllStudentPasswords());
    if (editingStudentId === student.maHS) {
      setEditingStudentId(null);
    }
    showTempNotice(`Đã reset mật khẩu của ${student.hoTen} về ${DEFAULT_STUDENT_PASS}.`);
  };

  const handleSaveOneStudentPass = (student: Student) => {
    const res = setStudentPasswordByAdmin(student.maHS, editingPassValue);
    if (!res.success) {
      showTempNotice(res.message);
      return;
    }
    setPasswordsMap(getAllStudentPasswords());
    setEditingStudentId(null);
    setEditingPassValue('');
    showTempNotice(`Đã đổi mật khẩu của ${student.hoTen} thành "${editingPassValue.trim()}".`);
  };

  const handleConfirmResetAllStudents = () => {
    resetAllStudentPasswords();
    setPasswordsMap({});
    setConfirmResetAll(false);
    showTempNotice(`Đã reset mật khẩu toàn bộ ${students.length} học sinh về ${DEFAULT_STUDENT_PASS}.`);
  };

  return (
    <div className="space-y-3 text-xs">
      {notice && (
        <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 font-bold flex items-center justify-between gap-2">
          <span>✅ {notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-emerald-700 hover:underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Khối 1: Cấu hình Email Google GVCN & Mã lớp */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-surface border border-token shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2 border-b border-token pb-2">
          <div className="flex items-center gap-1.5 font-extrabold text-main uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
            <span>Quản trị Đăng nhập &amp; Mã lớp</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted hover:text-main hover:bg-surface-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-muted mb-1">
              Email Google GVCN
            </label>
            <input
              type="email"
              value={teacherEmailInput}
              onChange={e => setTeacherEmailInput(e.target.value)}
              placeholder="yanghuy91@gmail.com"
              className="w-full px-2.5 py-1.5 rounded-xl bg-surface-2 border border-token font-semibold text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-muted mb-1">
              Mã lớp truy cập
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={classCodeInput}
                onChange={e => setClassCodeInput(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 rounded-xl bg-surface-2 border border-token font-black text-main uppercase focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button
                type="button"
                onClick={handleSaveTeacherAuth}
                className="px-3 py-1.5 rounded-xl bg-accent text-on-accent font-extrabold whitespace-nowrap cursor-pointer shadow-2xs hover:opacity-95"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Khối 2: Quản lý & Reset mật khẩu Học sinh */}
      <div className="rounded-2xl bg-surface border border-token shadow-2xs overflow-hidden">
        <div className="p-3 sm:p-3.5 border-b border-token bg-surface-2/40 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-extrabold text-main uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Mật khẩu Học sinh ({students.length} HS)</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAllStudentPass(prev => !prev)}
                className="px-2.5 py-1 rounded-xl bg-surface border border-token text-[11px] font-bold text-main hover:border-accent cursor-pointer flex items-center gap-1"
              >
                {showAllStudentPass ? <EyeOff className="w-3.5 h-3.5 text-muted" /> : <Eye className="w-3.5 h-3.5 text-accent" />}
                <span>{showAllStudentPass ? 'Ẩn MK' : 'Hiện MK'}</span>
              </button>

              {!confirmResetAll ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetAll(true)}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 text-[11px] font-extrabold cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset cả lớp về {DEFAULT_STUDENT_PASS}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-rose-600 text-white px-2 py-0.5 rounded-xl">
                  <span className="text-[10.5px] font-bold">Xác nhận reset {students.length} HS?</span>
                  <button
                    type="button"
                    onClick={handleConfirmResetAllStudents}
                    className="px-2 py-0.5 rounded-lg bg-white text-rose-700 font-black text-[10.5px] cursor-pointer"
                  >
                    Đồng ý
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetAll(false)}
                    className="px-1.5 py-0.5 text-white/90 hover:text-white text-[10.5px] cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Thanh tìm kiếm & Bộ lọc nhanh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm tên học sinh, STT..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-surface border border-token text-xs text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-main"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'all' as const, label: `Tất cả (${students.length})` },
                { id: 'changed' as const, label: `Đã đổi MK (${changedCount})` },
                { id: 'default' as const, label: `Mặc định (${students.length - changedCount})` },
                { id: 'cadre' as const, label: 'Ban cán sự' },
                { id: 1 as const, label: 'Tổ 1' },
                { id: 2 as const, label: 'Tổ 2' },
                { id: 3 as const, label: 'Tổ 3' },
                { id: 4 as const, label: 'Tổ 4' },
              ].map(tab => (
                <button
                  key={String(tab.id)}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                    filterMode === tab.id
                      ? 'bg-accent text-on-accent shadow-2xs'
                      : 'bg-surface border border-token text-muted hover:text-main'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Danh sách học sinh xếp sát, gọn gàng */}
        <div className="divide-y divide-token max-h-[460px] overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-6 text-center text-muted">
              Không có học sinh nào trong bộ lọc này.
            </div>
          ) : (
            filteredStudents.map(student => {
              const currentPass = passwordsMap[student.maHS] || DEFAULT_STUDENT_PASS;
              const isCustom = currentPass !== DEFAULT_STUDENT_PASS;
              const isEditing = editingStudentId === student.maHS;
              const primaryRole = student.vaiTro.find(r => r !== 'HS');

              return (
                <div
                  key={student.maHS}
                  className="px-2.5 sm:px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-surface-2/60 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-6 text-center font-bold text-muted text-[11px] shrink-0">
                      {student.viTriGhe < 10 ? `0${student.viTriGhe}` : student.viTriGhe}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-main text-xs break-words">
                          {student.hoTen}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-surface-2 text-muted border border-token">
                          Tổ {student.to}
                        </span>
                        {primaryRole && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 border border-amber-500/30">
                            {primaryRole}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Khu vực hiển thị & thao tác mật khẩu */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0 pl-8 sm:pl-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingPassValue}
                          onChange={e => setEditingPassValue(e.target.value)}
                          placeholder="MK mới (>=4 ký tự)"
                          className="w-28 px-2 py-1 rounded-lg bg-surface border border-accent text-xs font-bold text-main focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveOneStudentPass(student)}
                          className="px-2 py-1 rounded-lg bg-accent text-on-accent text-[11px] font-bold cursor-pointer flex items-center gap-0.5"
                        >
                          <Check className="w-3 h-3" />
                          <span>Lưu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStudentId(null)}
                          className="px-1.5 py-1 rounded-lg border border-token text-[11px] text-muted hover:text-main cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <>
                        <span
                          className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold border ${
                            isCustom
                              ? 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30'
                              : 'bg-surface-2 text-muted border-token'
                          }`}
                          title={isCustom ? 'Học sinh đã đổi mật khẩu riêng' : 'Mật khẩu mặc định'}
                        >
                          {showAllStudentPass ? currentPass : '••••••'}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudentId(student.maHS);
                            setEditingPassValue(currentPass);
                          }}
                          className="px-2 py-1 rounded-lg bg-surface-2 hover:bg-surface border border-token text-[11px] font-semibold text-main hover:border-accent cursor-pointer flex items-center gap-1"
                          title="Đặt mật khẩu mới cho học sinh này"
                        >
                          <Edit3 className="w-3 h-3 text-accent" />
                          <span>Đặt MK</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetOneStudent(student)}
                          disabled={!isCustom}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                            isCustom
                              ? 'bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/30 cursor-pointer'
                              : 'bg-surface-2 text-muted/50 border border-token cursor-not-allowed'
                          }`}
                          title="Reset mật khẩu về mặc định 123456"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

interface LoginAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  settings: TeacherSettings;
  onUpdateSettings: (newSettings: Partial<TeacherSettings>) => void;
}

export const LoginAdminModal: React.FC<LoginAdminModalProps> = ({
  isOpen,
  onClose,
  students,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-surface border border-token rounded-3xl shadow-2xl p-3.5 sm:p-5 max-h-[92vh] overflow-y-auto animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <TeacherAuthAdminPanel
          students={students}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
