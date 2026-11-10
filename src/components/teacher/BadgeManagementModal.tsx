import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Award,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  ShieldCheck,
  Save,
  CheckCircle2,
  Trash2,
  Filter
} from 'lucide-react';
import { Student } from '../../types';
import { BadgeEmblem } from '../common/BadgeEmblem';
import {
  AchievementBadge,
  BadgeCategory,
  getBadgeCatalog,
  saveBadgeCatalog,
  resetBadgeCatalog,
  getStudentBadgesMap,
  awardBadgeToStudent,
  revokeBadgeFromStudent
} from '../../data/badgeCatalog';
import { getStudentAvatarInitial } from '../../utils/vietnamese';

interface BadgeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export const BadgeManagementModal: React.FC<BadgeManagementModalProps> = ({
  isOpen,
  onClose,
  students,
}) => {
  const [catalog, setCatalog] = useState<AchievementBadge[]>([]);
  const [studentBadgesMap, setStudentBadgesMap] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | BadgeCategory>('all');
  
  // Editing state for a single badge
  const [editingBadge, setEditingBadge] = useState<AchievementBadge | null>(null);
  const [editName, setEditName] = useState('');
  const [editCriteria, setEditCriteria] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Awarding badge to students modal/drawer
  const [awardingBadge, setAwardingBadge] = useState<AchievementBadge | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  // Toast notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load catalog on open
  useEffect(() => {
    if (isOpen) {
      setCatalog(getBadgeCatalog());
      setStudentBadgesMap(getStudentBadgesMap());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered badges
  const filteredBadges = catalog.filter(b => {
    const matchCategory = selectedCategory === 'all' || b.category === selectedCategory;
    const matchQuery =
      searchQuery === '' ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.criteria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  // Handle save badge edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBadge || !editName.trim()) return;

    const updated = catalog.map(b => {
      if (b.id === editingBadge.id) {
        return {
          ...b,
          name: editName.trim(),
          criteria: editCriteria.trim(),
          description: editDescription.trim(),
        };
      }
      return b;
    });

    setCatalog(updated);
    saveBadgeCatalog(updated);
    showToast(`Đã lưu cập nhật cho huy hiệu "${editName}"!`);
    setEditingBadge(null);
  };

  // Handle Reset to defaults
  const handleResetCatalog = () => {
    if (window.confirm('Khôi phục toàn bộ 30 huy hiệu về tên và điều kiện trao mặc định ban đầu?')) {
      const reset = resetBadgeCatalog();
      setCatalog(reset);
      showToast('Đã khôi phục 30 huy hiệu về cấu hình gốc!');
    }
  };

  // Toggle award badge for student
  const handleToggleAward = (studentId: string, badgeId: string) => {
    const currentList = studentBadgesMap[studentId] || [];
    const hasBadge = currentList.includes(badgeId);

    if (hasBadge) {
      revokeBadgeFromStudent(studentId, badgeId);
    } else {
      awardBadgeToStudent(studentId, badgeId);
    }
    setStudentBadgesMap(getStudentBadgesMap());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-surface border border-token shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-token flex items-center justify-between bg-surface-2/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-main">
                  Quản Lý Hệ Thống Huy Hiệu Thi Đua (30 Mẫu)
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Dành cho GVCN
                </span>
              </div>
              <p className="text-xs text-muted">
                GV có toàn quyền đổi tên, sửa điều kiện trao và vinh danh trực tiếp cho 42 học sinh 10A5.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetCatalog}
              title="Khôi phục thiết lập gốc"
              className="p-2 rounded-xl text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Khôi phục gốc</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-main hover:bg-surface-2 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Filter Bar & Search */}
        <div className="p-4 border-b border-token bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-2xl border border-token text-xs overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-surface text-main shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              Tất cả (30)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('discipline')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'discipline'
                  ? 'bg-surface text-main shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              🛡️ Kỷ luật (8)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('academic')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'academic'
                  ? 'bg-surface text-main shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              📚 Học tập (8)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('movement')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'movement'
                  ? 'bg-surface text-main shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              🚩 Phong trào (7)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('cadre')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'cadre'
                  ? 'bg-surface text-main shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              ⭐ Cán sự & Lớp (7)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm tên, điều kiện trao..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-2 border border-token text-xs text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Badges Grid View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredBadges.map(badge => {
              // Count students who own this badge
              const awardedCount = Object.values(studentBadgesMap).filter(list =>
                list.includes(badge.id)
              ).length;

              return (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-2xl border border-token bg-gradient-to-br ${badge.gradientBg} bg-surface hover:shadow-md transition-all flex flex-col justify-between gap-3`}
                >
                  <div className="flex items-start gap-3">
                    {/* Badge Emblem Vector Icon */}
                    <div className="shrink-0 p-1 rounded-2xl bg-surface/80 border border-token shadow-xs">
                      <BadgeEmblem type={badge.iconType} size="lg" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-extrabold text-main truncate">
                          {badge.name}
                        </h3>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-surface border border-token text-muted shrink-0">
                          {badge.rarity}
                        </span>
                      </div>

                      <p className="text-xs text-muted mt-0.5 line-clamp-1">
                        {badge.description}
                      </p>

                      <div className="mt-2 p-2 rounded-xl bg-surface/70 border border-token/70 text-[11px] text-main">
                        <span className="font-bold text-accent mr-1">Điều kiện trao:</span>
                        <span className="text-muted leading-relaxed">{badge.criteria}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Award Count */}
                  <div className="pt-2 border-t border-token/60 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted font-bold text-[11px]">
                      <Users className="w-3.5 h-3.5 text-accent" />
                      <span>{awardedCount} học sinh đang sở hữu</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBadge(badge);
                          setEditName(badge.name);
                          setEditCriteria(badge.criteria);
                          setEditDescription(badge.description);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-surface hover:bg-surface-2 border border-token text-main text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Edit3 className="w-3 h-3 text-amber-500" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAwardingBadge(badge)}
                        className="px-2.5 py-1 rounded-xl bg-accent text-on-accent text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs hover:opacity-95 active:scale-95"
                      >
                        <Award className="w-3 h-3" />
                        <span>Trao huy hiệu</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal/Drawer 1: Edit Badge Details */}
        {editingBadge && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-surface border border-token shadow-2xl p-5 sm:p-6 flex flex-col gap-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BadgeEmblem type={editingBadge.iconType} size="md" />
                  <div>
                    <h3 className="text-base font-extrabold text-main">
                      Chỉnh Sửa Huy Hiệu
                    </h3>
                    <p className="text-xs text-muted">{editingBadge.categoryLabel}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBadge(null)}
                  className="p-1.5 rounded-xl text-muted hover:text-main cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-main mb-1">
                    Tên huy hiệu:
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-token text-xs text-main font-bold focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Ví dụ: Kỷ Luật Thép"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-main mb-1">
                    Mô tả ngắn:
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-token text-xs text-main focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Mô tả ý nghĩa của huy hiệu..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-main mb-1">
                    Điều kiện trao thưởng (GV quy định):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editCriteria}
                    onChange={e => setEditCriteria(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-token text-xs text-main focus:outline-none focus:ring-2 focus:ring-accent resize-none leading-relaxed"
                    placeholder="Quy định tiêu chí để học sinh đạt được huy hiệu này..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBadge(null)}
                    className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-token text-xs font-bold text-muted hover:text-main cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal/Drawer 2: Award Badge to Students */}
        {awardingBadge && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-xl max-h-[85vh] rounded-3xl bg-surface border border-token shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              {/* Award Header */}
              <div className="p-4 border-b border-token bg-surface-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <BadgeEmblem type={awardingBadge.iconType} size="md" />
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-main">
                      Trao Huy Hiệu: {awardingBadge.name}
                    </h3>
                    <p className="text-xs text-muted truncate max-w-sm">
                      {awardingBadge.criteria}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAwardingBadge(null)}
                  className="p-1.5 rounded-xl text-muted hover:text-main cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student Search */}
              <div className="p-3 border-b border-token bg-surface shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Tìm theo tên học sinh, số thứ tự, tổ..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-2 border border-token text-xs text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Students Checklist */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {students
                  .filter(s => {
                    const q = studentSearch.toLowerCase();
                    return (
                      s.hoTen.toLowerCase().includes(q) ||
                      s.maHS.toLowerCase().includes(q) ||
                      `tổ ${s.to}`.includes(q) ||
                      `#${s.viTriGhe}`.includes(q)
                    );
                  })
                  .map(st => {
                    const hasBadge = (studentBadgesMap[st.maHS] || []).includes(awardingBadge.id);

                    return (
                      <div
                        key={st.maHS}
                        onClick={() => handleToggleAward(st.maHS, awardingBadge.id)}
                        className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          hasBadge
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
                            : 'bg-surface hover:bg-surface-2 border-token'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              st.gioiTinh === 'Nu' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {getStudentAvatarInitial(st.hoTen)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-main truncate">
                                {st.hoTen}
                              </span>
                              <span className="text-[10px] text-muted">
                                #{st.viTriGhe} · Tổ {st.to}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {hasBadge ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Đã trao</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-surface-2 border border-token text-muted text-[11px] font-bold hover:text-main">
                              Chưa có
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Award Footer */}
              <div className="p-3 border-t border-token bg-surface-2 flex items-center justify-between text-xs shrink-0">
                <span className="text-muted">
                  Bấm vào học sinh để trao hoặc thu hồi huy hiệu ngay lập tức.
                </span>
                <button
                  type="button"
                  onClick={() => setAwardingBadge(null)}
                  className="px-4 py-1.5 rounded-xl bg-accent text-on-accent font-bold cursor-pointer shadow-xs"
                >
                  Xong
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
