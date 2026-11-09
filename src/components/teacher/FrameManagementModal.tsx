import React, { useState } from 'react';
import { Student } from '../../types';
import { AVATAR_FRAMES, CADRE_EMBLEMS, getFrameForStudent } from '../../data/frameData';
import { AvatarFrame } from '../common/AvatarFrame';
import { getStudentAvatarInitial } from '../../utils/vietnamese';

interface FrameManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  studentRanks?: Record<string, { rank: number; score: number }>;
  onAssignFrame: (studentId: string, frameId: string | undefined) => void;
  onBatchAutoAssignByRank: () => void;
}

export const FrameManagementModal: React.FC<FrameManagementModalProps> = ({
  isOpen,
  onClose,
  students,
  studentRanks = {},
  onAssignFrame,
  onBatchAutoAssignByRank,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTo, setSelectedTo] = useState<'all' | 1 | 2 | 3 | 4>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cadre' | 'framed'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.maHS.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.viTriGhe.toString() === searchTerm;
    const matchesTo = selectedTo === 'all' || s.to === selectedTo;

    const isCadre = s.vaiTro.some((r) => ['LT', 'BT', 'LP_HT', 'LP_LD', 'TT'].includes(r));
    const isFramed = Boolean(s.customFrameId || studentRanks[s.maHS]);

    if (selectedCategory === 'cadre') return matchesSearch && matchesTo && isCadre;
    if (selectedCategory === 'framed') return matchesSearch && matchesTo && isFramed;
    return matchesSearch && matchesTo;
  });

  const handleApplyAuto = () => {
    onBatchAutoAssignByRank();
    showToast('✨ Đã tự động cập nhật khung vinh danh theo bảng xếp hạng thi đua!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-white/20 rounded-xl backdrop-blur-sm">👑</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Hệ Thống Huy Hiệu & Khung Avatar Vinh Danh 10A5
              </h2>
              <p className="text-xs text-amber-100">
                Tự động theo thứ hạng thi đua hoặc GVCN trực tiếp phong tặng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Toast Alert */}
        {notification && (
          <div className="px-6 py-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold border-b border-emerald-200 flex items-center justify-between animate-fadeIn">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-emerald-600 hover:underline">
              Đóng
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Showcase of Available Frames */}
          <section className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>✨</span> Danh Sách 6 Khung Đặc Sắc
              </h3>
              <button
                type="button"
                onClick={handleApplyAuto}
                className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>⚡</span> Tự động phong tặng theo Top BXH
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AVATAR_FRAMES.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-amber-300 transition-all flex items-start gap-3 shadow-xs"
                >
                  <AvatarFrame frame={f} size="md">
                    <span className="text-lg">{f.icon}</span>
                  </AvatarFrame>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{f.name}</h4>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                      {f.description}
                    </p>
                    <span
                      className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${f.tagClass}`}
                    >
                      {f.tagLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cadre Emblems Preview */}
          <section className="p-3.5 bg-slate-100/70 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span> Biểu Tượng Ban Cán Sự Lớp & Tổ Trưởng
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.values(CADRE_EMBLEMS).map((c) => (
                <div
                  key={c.code}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-xs shadow-xs"
                >
                  <span className="text-base">{c.icon}</span>
                  <span className="font-semibold text-slate-800">{c.shortLabel}</span>
                  <span className={`text-[9px] font-bold px-1 rounded ${c.badgeClass}`}>
                    {c.code}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Student Assignment List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>👥</span> Danh Sách 42 Học Sinh & Quản Lý Khung
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Hiển thị: <b>{filteredStudents.length}</b> / {students.length} học sinh
              </span>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder="Tìm theo họ tên, mã HS, tổ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 pl-8 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Tổ filter */}
              <select
                value={selectedTo}
                onChange={(e) =>
                  setSelectedTo(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 1 | 2 | 3 | 4))
                }
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700"
              >
                <option value="all">Tất cả các Tổ</option>
                <option value="1">Tổ 1</option>
                <option value="2">Tổ 2</option>
                <option value="3">Tổ 3</option>
                <option value="4">Tổ 4</option>
              </select>

              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700"
              >
                <option value="all">Tất cả học sinh</option>
                <option value="cadre">Ban Cán sự & Tổ trưởng</option>
                <option value="framed">Đang có Khung/Top</option>
              </select>
            </div>

            {/* Student Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Không tìm thấy học sinh nào phù hợp bộ lọc.
                  </div>
                ) : (
                  filteredStudents.map((s) => {
                    const rankInfo = studentRanks[s.maHS];
                    const activeFrame = getFrameForStudent(
                      rankInfo?.rank,
                      rankInfo?.score,
                      s.customFrameId
                    );

                    // Cadre badge check
                    let cadreRoleKey: string | undefined;
                    if (s.vaiTro.includes('LT')) cadreRoleKey = 'LT';
                    else if (s.vaiTro.includes('BT')) cadreRoleKey = 'BT';
                    else if (s.vaiTro.includes('LP_HT')) cadreRoleKey = 'LP_HT';
                    else if (s.vaiTro.includes('LP_LD')) cadreRoleKey = 'LP_LD';
                    else if (s.vaiTro.includes('TT')) cadreRoleKey = `TT_${s.to}`;

                    return (
                      <div
                        key={s.maHS}
                        className="p-2.5 sm:p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                      >
                        {/* Student avatar & info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <AvatarFrame frame={activeFrame} cadreRole={cadreRoleKey} size="sm">
                            {s.avatarUrl ? (
                              <img
                                src={s.avatarUrl}
                                alt={s.hoTen}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <div
                                className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs ${
                                  s.gioiTinh === 'Nu'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-sky-100 text-sky-700'
                                }`}
                              >
                                {getStudentAvatarInitial(s.hoTen)}
                              </div>
                            )}
                          </AvatarFrame>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {s.hoTen}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  s.gioiTinh === 'Nu'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-sky-100 text-sky-700'
                                }`}
                              >
                                {s.gioiTinh === 'Nu' ? 'Nữ' : 'Nam'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Tổ {s.to}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                              <span>Mã: {s.maHS}</span>
                              {rankInfo && (
                                <span className="font-semibold text-amber-700">
                                  Hạng #{rankInfo.rank} ({rankInfo.score}đ)
                                </span>
                              )}
                              {s.customFrameId && (
                                <span className="text-[10px] text-purple-600 bg-purple-50 px-1 rounded font-medium border border-purple-200">
                                  GV chỉ định
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Assign Frame dropdown */}
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={s.customFrameId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              onAssignFrame(s.maHS, val ? val : undefined);
                              showToast(`Đã cập nhật khung cho ${s.hoTen}!`);
                            }}
                            className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-[150px] sm:max-w-[200px]"
                          >
                            <option value="">(Mặc định theo BXH)</option>
                            {AVATAR_FRAMES.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.icon} {f.name}
                              </option>
                            ))}
                          </select>

                          {s.customFrameId && (
                            <button
                              type="button"
                              onClick={() => {
                                onAssignFrame(s.maHS, undefined);
                                showToast(`Đã xóa khung chỉ định của ${s.hoTen}`);
                              }}
                              title="Xóa khung tùy chỉnh, quay lại tự động"
                              className="text-xs text-slate-400 hover:text-red-500 p-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Khung và huy hiệu hiển thị trực tiếp trên Sơ đồ lớp, Bảng xếp hạng và Hồ sơ cá nhân.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
