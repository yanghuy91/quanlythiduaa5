import React, { useState, useMemo } from 'react';
import { 
  Move, 
  RotateCcw, 
  Save, 
  Check, 
  X, 
  ArrowRightLeft, 
  Info,
  Plus,
  Trash2,
  Edit3,
  UserPlus,
  UserMinus,
  AlertTriangle,
  Sparkles,
  Armchair,
  DoorOpen
} from 'lucide-react';
import { Student, SeatLayoutNode, SeatNodeType, RoleCode } from '../../types';
import { CADRE_ROLES_INFO } from '../../data/badgeData';
import { ROLE_CONFIG } from '../../data/mockData';
import { getSeatingMapDisplayName, getStudentAvatarInitial } from '../../utils/vietnamese';

interface ClassroomLayoutEditorProps {
  initialLayout: SeatLayoutNode[];
  initialStudents: Student[];
  onSave: (newLayout: SeatLayoutNode[], updatedStudents: Student[]) => void;
  onClose: () => void;
  initialAddSeat?: { hang: number; cot: number };
}

export const ClassroomLayoutEditor: React.FC<ClassroomLayoutEditorProps> = ({
  initialLayout,
  initialStudents,
  onSave,
  onClose,
  initialAddSeat,
}) => {
  const [layout, setLayout] = useState<SeatLayoutNode[]>(() => JSON.parse(JSON.stringify(initialLayout)));
  const [students, setStudents] = useState<Student[]>(() => JSON.parse(JSON.stringify(initialStudents)));
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<
    | { type: 'seat'; hang: number; cot: number; maHS?: string }
    | { type: 'unseated'; maHS: string }
    | null
  >(null);
  const [dragOverNode, setDragOverNode] = useState<{ hang: number; cot: number } | null>(null);
  const [isDragOverUnseatedZone, setIsDragOverUnseatedZone] = useState(false);
  
  // Click-to-swap / action modal state
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState<{ hang: number; cot: number; maHS?: string } | null>(null);
  const [activeActionSeat, setActiveActionSeat] = useState<SeatLayoutNode | null>(null);
  
  // Add & Edit student modal state
  const [addStudentTarget, setAddStudentTarget] = useState<{ hang?: number; cot?: number } | null>(
    initialAddSeat ? { hang: initialAddSeat.hang, cot: initialAddSeat.cot } : null
  );
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Form inputs for Add / Edit
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'Nam' | 'Nu'>('Nam');
  const [formRole, setFormRole] = useState<RoleCode>('HS');
  const [formError, setFormError] = useState<string | null>(null);

  const [hasChanges, setHasChanges] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Map student by ID
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.maHS, s));
    return map;
  }, [students]);

  // Unseated students (exist in students list but not in any layout seat)
  const unseatedStudents = useMemo(() => {
    const seatedMaHSSet = new Set(
      layout.filter(n => n.loaiO === 'ghe' && n.maHS).map(n => n.maHS)
    );
    return students.filter(s => !seatedMaHSSet.has(s.maHS));
  }, [students, layout]);

  // Group nodes by row
  const rows = useMemo(() => {
    const grouped: Record<number, SeatLayoutNode[]> = {};
    layout.forEach(node => {
      if (!grouped[node.hang]) {
        grouped[node.hang] = [];
      }
      grouped[node.hang].push(node);
    });

    Object.keys(grouped).forEach(r => {
      grouped[Number(r)].sort((a, b) => a.cot - b.cot);
    });

    return grouped;
  }, [layout]);

  // Temporary feedback toast
  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  // Helper to get Tổ / Dãy bàn (1..4) from column index
  // Cột 0, 1: Dãy 4 (Tổ 4) | Cột 3, 4: Dãy 3 (Tổ 3) | Cột 6, 7: Dãy 2 (Tổ 2) | Cột 9, 10: Dãy 1 (Tổ 1)
  const getDayFromCot = (cot: number): number => {
    if (cot === 0 || cot === 1) return 4;
    if (cot === 3 || cot === 4) return 3;
    if (cot === 6 || cot === 7) return 2;
    if (cot === 9 || cot === 10) return 1;
    return 1;
  };

  // Helper to get Số bàn (1..6) from row index (1..6)
  const getBanFromHang = (hang: number): number => {
    return Math.max(1, Math.min(6, hang));
  };

  // Helper to generate short abbreviated name (e.g. "Nguyễn Khắc Huy" -> "N.K.Huy")
  const generateShortName = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    const lastName = parts[parts.length - 1];
    const prefix = parts.slice(0, -1).map(p => p[0]?.toUpperCase()).join('.') + '.';
    return `${prefix}${lastName}`;
  };

  // Generate next unique student ID (e.g. HS43, HS44)
  const getNextMaHS = (): string => {
    let maxNum = 0;
    students.forEach(s => {
      const match = s.maHS.match(/HS(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `HS${String(maxNum + 1).padStart(2, '0')}`;
  };

  // 1. SWAP OR MOVE SEATS
  const performSwap = (
    src: { hang: number; cot: number; maHS?: string },
    tgt: { hang: number; cot: number; maHS?: string }
  ) => {
    if (src.hang === tgt.hang && src.cot === tgt.cot) {
      setSelectedSlotForSwap(null);
      return;
    }

    const newLayout = [...layout];
    const srcIndex = newLayout.findIndex(n => n.hang === src.hang && n.cot === src.cot);
    const tgtIndex = newLayout.findIndex(n => n.hang === tgt.hang && n.cot === tgt.cot);

    if (srcIndex === -1 || tgtIndex === -1) return;

    const srcNode = newLayout[srcIndex];
    const tgtNode = newLayout[tgtIndex];

    const srcStudent = srcNode.maHS ? studentMap.get(srcNode.maHS) : undefined;
    const tgtStudent = tgtNode.maHS ? studentMap.get(tgtNode.maHS) : undefined;

    // Swap students
    const tempMaHS = srcNode.maHS;
    srcNode.maHS = tgtNode.maHS;
    tgtNode.maHS = tempMaHS;

    // Fix node types
    if (tgtNode.loaiO === 'trong' && tgtNode.maHS) tgtNode.loaiO = 'ghe';
    if (srcNode.loaiO === 'ghe' && !srcNode.maHS) srcNode.loaiO = 'trong';

    // Update student positions
    const updatedStudents = students.map(s => {
      if (srcStudent && s.maHS === srcStudent.maHS) {
        return {
          ...s,
          dayBan: getDayFromCot(tgt.cot),
          soBan: getBanFromHang(tgt.hang),
          to: getDayFromCot(tgt.cot),
        };
      }
      if (tgtStudent && s.maHS === tgtStudent.maHS) {
        return {
          ...s,
          dayBan: getDayFromCot(src.cot),
          soBan: getBanFromHang(src.hang),
          to: getDayFromCot(src.cot),
        };
      }
      return s;
    });

    setLayout(newLayout);
    setStudents(updatedStudents);
    setHasChanges(true);

    const srcName = srcStudent?.hoTen || 'Chỗ trống';
    const tgtName = tgtStudent?.hoTen || 'Chỗ trống';
    showFeedback(`Đã chuyển: ${srcName} ⇄ ${tgtName}`);

    setSelectedSlotForSwap(null);
    setDraggedItem(null);
    setDragOverNode(null);
  };

  // 2. ASSIGN UNSEATED STUDENT TO SEAT
  const assignUnseatedStudent = (studentId: string, hang: number, cot: number) => {
    const targetStudent = studentMap.get(studentId);
    if (!targetStudent) return;

    const newLayout = [...layout];
    const targetIndex = newLayout.findIndex(n => n.hang === hang && n.cot === cot);
    if (targetIndex === -1) return;

    const targetNode = newLayout[targetIndex];
    const previousStudent = targetNode.maHS ? studentMap.get(targetNode.maHS) : undefined;

    targetNode.maHS = targetStudent.maHS;
    targetNode.loaiO = 'ghe';

    const updatedStudents = students.map(s => {
      if (s.maHS === targetStudent.maHS) {
        return {
          ...s,
          dayBan: getDayFromCot(cot),
          soBan: getBanFromHang(hang),
          to: getDayFromCot(cot),
        };
      }
      return s;
    });

    setLayout(newLayout);
    setStudents(updatedStudents);
    setHasChanges(true);

    showFeedback(`Đã xếp ${targetStudent.hoTen} vào Tổ ${getDayFromCot(cot)} (Bàn ${getBanFromHang(hang)})${previousStudent ? `, thay chỗ ${previousStudent.hoTen}` : ''}`);
    setDraggedItem(null);
    setDragOverNode(null);
    setActiveActionSeat(null);
  };

  // 3. UNSEAT STUDENT (REMOVE FROM SEAT, KEEP IN CLASS)
  const handleUnseatStudent = (maHS: string) => {
    const student = studentMap.get(maHS);
    if (!student) return;

    const newLayout = layout.map(node => {
      if (node.maHS === maHS) {
        return { ...node, maHS: undefined, loaiO: 'trong' as SeatNodeType };
      }
      return node;
    });

    setLayout(newLayout);
    setHasChanges(true);
    showFeedback(`Đã cho ${student.hoTen} rời chỗ ngồi. Ghế đã trở thành chỗ trống.`);
    setActiveActionSeat(null);
  };

  // 4. DELETE STUDENT PERMANENTLY FROM CLASS
  const handleDeleteStudent = (student: Student) => {
    const newLayout = layout.map(node => {
      if (node.maHS === student.maHS) {
        return { ...node, maHS: undefined, loaiO: 'trong' as SeatNodeType };
      }
      return node;
    });

    const newStudents = students.filter(s => s.maHS !== student.maHS);

    setLayout(newLayout);
    setStudents(newStudents);
    setHasChanges(true);
    setDeletingStudent(null);
    setActiveActionSeat(null);
    showFeedback(`Đã xóa học sinh ${student.hoTen} (${student.maHS}) khỏi danh sách lớp.`);
  };

  // 5. ADD NEW STUDENT
  const handleOpenAddModal = (hang?: number, cot?: number) => {
    setFormName('');
    setFormGender('Nam');
    setFormRole('HS');
    setFormError(null);
    setAddStudentTarget({ hang, cot });
    setActiveActionSeat(null);
  };

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Vui lòng nhập họ và tên học sinh');
      return;
    }

    const nextMaHS = getNextMaHS();
    const targetHang = addStudentTarget?.hang;
    const targetCot = addStudentTarget?.cot;

    // Next seat number
    const maxSeatNum = Math.max(0, ...students.map(s => s.viTriGhe || 0));

    const newStudent: Student = {
      maHS: nextMaHS,
      hoTen: cleanName,
      tenRutGon: generateShortName(cleanName),
      to: targetCot !== undefined ? getDayFromCot(targetCot) : 1,
      dayBan: targetCot !== undefined ? getDayFromCot(targetCot) : 1,
      soBan: targetHang !== undefined ? getBanFromHang(targetHang) : 1,
      viTriGhe: maxSeatNum + 1,
      vaiTro: formRole === 'HS' ? ['HS'] : [formRole, 'HS'],
      toTruongTo: formRole === 'TT' && targetCot !== undefined ? getDayFromCot(targetCot) : undefined,
      gioiTinh: formGender,
    };

    let newLayout = [...layout];
    if (targetHang !== undefined && targetCot !== undefined) {
      newLayout = newLayout.map(node => {
        if (node.hang === targetHang && node.cot === targetCot) {
          return { ...node, loaiO: 'ghe' as SeatNodeType, maHS: newStudent.maHS };
        }
        return node;
      });
    }

    setStudents(prev => [...prev, newStudent]);
    setLayout(newLayout);
    setHasChanges(true);
    setAddStudentTarget(null);
    showFeedback(`Đã thêm học sinh mới: ${cleanName} (${newStudent.maHS})`);
  };

  // 6. EDIT EXISTING STUDENT
  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.hoTen);
    setFormGender(student.gioiTinh || 'Nam');
    setFormRole(student.vaiTro[0] || 'HS');
    setFormError(null);
    setActiveActionSeat(null);
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Vui lòng nhập họ và tên');
      return;
    }

    const updated = students.map(s => {
      if (s.maHS === editingStudent.maHS) {
        return {
          ...s,
          hoTen: cleanName,
          tenRutGon: generateShortName(cleanName),
          gioiTinh: formGender,
          vaiTro: (formRole === 'HS' ? ['HS'] : [formRole, 'HS']) as RoleCode[],
          toTruongTo: formRole === 'TT' ? s.to : undefined,
        };
      }
      return s;
    });

    setStudents(updated);
    setHasChanges(true);
    setEditingStudent(null);
    showFeedback(`Đã cập nhật thông tin học sinh: ${cleanName}`);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, node: SeatLayoutNode) => {
    if (node.loaiO === 'loidi' || node.loaiO === 'cua' || node.loaiO === 'banGV' || node.loaiO === 'buc') {
      e.preventDefault();
      return;
    }
    setDraggedItem({ type: 'seat', hang: node.hang, cot: node.cot, maHS: node.maHS });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'seat', hang: node.hang, cot: node.cot, maHS: node.maHS }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartUnseated = (e: React.DragEvent, student: Student) => {
    setDraggedItem({ type: 'unseated', maHS: student.maHS });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'unseated', maHS: student.maHS }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, node: SeatLayoutNode) => {
    if (node.loaiO === 'loidi' || node.loaiO === 'cua' || node.loaiO === 'banGV' || node.loaiO === 'buc') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverNode || dragOverNode.hang !== node.hang || dragOverNode.cot !== node.cot) {
      setDragOverNode({ hang: node.hang, cot: node.cot });
    }
  };

  const handleDrop = (e: React.DragEvent, targetNode: SeatLayoutNode) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.type === 'seat') {
      performSwap(draggedItem, { hang: targetNode.hang, cot: targetNode.cot, maHS: targetNode.maHS });
    } else if (draggedItem.type === 'unseated') {
      assignUnseatedStudent(draggedItem.maHS, targetNode.hang, targetNode.cot);
    }
  };

  // Drop on Unseated Tray (To leave seat)
  const handleDropOnUnseatedZone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUnseatedZone(false);
    if (draggedItem && draggedItem.type === 'seat' && draggedItem.maHS) {
      handleUnseatStudent(draggedItem.maHS);
    }
    setDraggedItem(null);
  };

  // Toggle Bàn GV and Cửa chính
  const handleToggleDeskDoorSwap = () => {
    const banGVNode = layout.find(n => n.hang === 0 && n.loaiO === 'banGV');
    const isBanGVLeft = (banGVNode?.cot ?? 0) <= 2;
    const toLeft = !isBanGVLeft;

    const newLayout = layout.map(node => {
      if (node.hang === 0) {
        if (toLeft) {
          if (node.cot === 0 || node.cot === 1) return { ...node, loaiO: 'banGV' as SeatNodeType, ghiChu: 'Bàn GV' };
          if (node.cot === 6 || node.cot === 7) return { ...node, loaiO: 'cua' as SeatNodeType, ghiChu: 'Cửa chính' };
          if (node.cot === 3 || node.cot === 4) return { ...node, loaiO: 'buc' as SeatNodeType, ghiChu: 'Bảng' };
        } else {
          if (node.cot === 0 || node.cot === 1) return { ...node, loaiO: 'cua' as SeatNodeType, ghiChu: 'Cửa chính' };
          if (node.cot === 6 || node.cot === 7) return { ...node, loaiO: 'banGV' as SeatNodeType, ghiChu: 'Bàn GV' };
          if (node.cot === 3 || node.cot === 4) return { ...node, loaiO: 'buc' as SeatNodeType, ghiChu: 'Bảng' };
        }
      }
      return node;
    });

    setLayout(newLayout);
    setHasChanges(true);
    showFeedback(`Đã chuyển: Bàn GV bên ${toLeft ? 'Trái' : 'Phải'}, Cửa chính bên ${toLeft ? 'Phải' : 'Trái'}`);
  };

  // Reset to default initial layout
  const handleReset = () => {
    if (window.confirm('Khôi phục lại sơ đồ vị trí ban đầu? Mọi thay đổi chưa lưu sẽ bị xóa.')) {
      setLayout(JSON.parse(JSON.stringify(initialLayout)));
      setStudents(JSON.parse(JSON.stringify(initialStudents)));
      setSelectedSlotForSwap(null);
      setHasChanges(false);
      showFeedback('Đã khôi phục lại sơ đồ gốc.');
    }
  };

  // Save changes
  const handleSave = () => {
    onSave(layout, students);
    setHasChanges(false);
    onClose();
  };

  // Counts
  const seatedCount = layout.filter(n => n.loaiO === 'ghe' && n.maHS).length;
  const emptyCount = layout.filter(n => n.loaiO === 'trong').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-5xl bg-surface border border-token rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 via-accent to-purple-600 text-white flex items-center justify-between gap-3 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs shrink-0">
              <Move className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black leading-tight tracking-tight">
                  Quản Lý Sơ Đồ Lớp &amp; Chỗ Ngồi (10A5)
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/25 text-white uppercase tracking-wider">
                  GVCN
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Kéo thả đổi chỗ · Thêm / Sửa / Xóa học sinh trực tiếp trên sơ đồ lớp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-3 py-1.5 rounded-xl bg-white text-blue-700 font-extrabold text-xs shadow-md hover:bg-white/90 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-blue-700" />
              <span className="hidden sm:inline">Thêm Học Sinh</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Sơ Đồ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-surface-2 border-b border-token flex items-center justify-between gap-3 text-xs flex-wrap">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-main">
              Tổng số: <strong className="text-accent">{students.length} HS</strong>
            </span>
            <span className="text-muted">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Đã xếp chỗ: {seatedCount}
            </span>
            <span className="text-muted">·</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Chỗ trống: {emptyCount}
            </span>
            {unseatedStudents.length > 0 && (
              <>
                <span className="text-muted">·</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-500/15 px-2 py-0.5 rounded-full animate-pulse">
                  Chờ xếp chỗ: {unseatedStudents.length} HS
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleDeskDoorSwap}
              className="px-2.5 py-1 rounded-lg bg-surface border border-token text-muted hover:text-main text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Đổi vị trí Bàn GV và Cửa chính"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />
              <span>Đổi Bàn GV ⇄ Cửa</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg border border-token text-[11px] font-semibold text-muted hover:text-main hover:bg-surface-2 transition-colors flex items-center gap-1 cursor-pointer"
              title="Khôi phục sơ đồ ban đầu"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Khôi phục</span>
            </button>
          </div>
        </div>

        {/* Feedback / Instructions banner */}
        <div className="px-4 py-1.5 bg-accent/10 border-b border-token flex items-center justify-between text-xs text-main">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-4 h-4 text-accent shrink-0" />
            <span className="truncate">
              {feedbackMsg ? (
                <strong className="text-accent">{feedbackMsg}</strong>
              ) : selectedSlotForSwap ? (
                <span>
                  Đang chọn học sinh. <strong>Chạm ghế thứ 2</strong> để đổi chỗ!
                </span>
              ) : (
                <span>
                  <strong>Hướng dẫn:</strong> Kéo thả học sinh giữa các ô để đổi chỗ, hoặc <strong>bấm vào ghế</strong> để Thêm / Sửa / Xóa học sinh trực tiếp.
                </span>
              )}
            </span>
          </div>

          {selectedSlotForSwap && (
            <button
              type="button"
              onClick={() => setSelectedSlotForSwap(null)}
              className="px-2 py-0.5 rounded text-[11px] font-bold text-muted hover:text-main border border-token bg-surface cursor-pointer shrink-0"
            >
              Hủy đổi chỗ
            </button>
          )}
        </div>

        {/* Classroom Grid Area */}
        <div className="p-3 sm:p-5 overflow-auto flex-1 bg-surface-2/40">
          <div className="min-w-[500px] max-w-full mx-auto flex flex-col gap-2">
            {/* Top Orientation Bar */}
            {(() => {
              const banGVNode = layout.find(n => n.hang === 0 && n.loaiO === 'banGV');
              const isBanGVLeft = (banGVNode?.cot ?? 0) <= 2;
              return (
                <div className="w-full flex items-center justify-between px-4 py-2 bg-surface rounded-2xl border border-token/80 shadow-xs mb-1 select-none font-medium">
                  {isBanGVLeft ? (
                    <>
                      <div className="flex items-center gap-1.5 text-[var(--role-gv-fg)] font-extrabold text-xs">
                        <Armchair className="w-4 h-4" />
                        <span>Bàn GV (Bên trái)</span>
                      </div>
                      <span className="text-main font-black tracking-widest text-xs uppercase opacity-85">
                        — BẢNG LỚP 10A5 —
                      </span>
                      <div className="flex items-center gap-1.5 text-muted font-extrabold text-xs">
                        <DoorOpen className="w-4 h-4 text-amber-500" />
                        <span>Cửa chính (Tổ 1)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-muted font-extrabold text-xs">
                        <DoorOpen className="w-4 h-4 text-amber-500" />
                        <span>Cửa chính (Tổ 1)</span>
                      </div>
                      <span className="text-main font-black tracking-widest text-xs uppercase opacity-85">
                        — BẢNG LỚP 10A5 —
                      </span>
                      <div className="flex items-center gap-1.5 text-[var(--role-gv-fg)] font-extrabold text-xs">
                        <Armchair className="w-4 h-4" />
                        <span>Bàn GV (Bên phải)</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Column Titles */}
            <div className="grid grid-cols-11 gap-1.5 sm:gap-2 text-center text-[11px] font-extrabold text-muted uppercase tracking-wider px-1">
              <div className="col-span-2 bg-blue-50/60 dark:bg-blue-950/30 py-1 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400">
                Tổ 4
              </div>
              <div className="col-span-1 flex items-center justify-center opacity-40">·</div>
              <div className="col-span-2 bg-purple-50/60 dark:bg-purple-950/30 py-1 rounded-xl border border-purple-200/60 dark:border-purple-900/40 text-purple-600 dark:text-purple-400">
                Tổ 3
              </div>
              <div className="col-span-1 flex items-center justify-center text-[10px] font-bold text-muted opacity-60">
                Lối đi
              </div>
              <div className="col-span-2 bg-emerald-50/60 dark:bg-emerald-950/30 py-1 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                Tổ 2
              </div>
              <div className="col-span-1 flex items-center justify-center opacity-40">·</div>
              <div className="col-span-2 bg-amber-50/60 dark:bg-amber-950/30 py-1 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-amber-600 dark:text-amber-400">
                Tổ 1 (Cửa)
              </div>
            </div>

            {/* Grid Rows (1..6) */}
            {Object.entries(rows).map(([rowKey, nodes]) => {
              const rowIndex = Number(rowKey);
              if (rowIndex === 0) return null;

              if (rowIndex === 7) {
                return (
                  <div 
                    key={rowKey}
                    className="w-full flex items-center justify-center py-2 text-[11px] font-extrabold text-muted opacity-60 tracking-widest border-t border-dashed border-token/60 mt-1 uppercase select-none"
                  >
                    — CUỐI LỚP —
                  </div>
                );
              }

              return (
                <div key={rowKey} className="grid grid-cols-11 gap-1.5 sm:gap-2 items-center">
                  {nodes.map(node => {
                    const isSelectedForSwap = selectedSlotForSwap && 
                      selectedSlotForSwap.hang === node.hang && 
                      selectedSlotForSwap.cot === node.cot;
                    
                    const isDragOver = dragOverNode &&
                      dragOverNode.hang === node.hang &&
                      dragOverNode.cot === node.cot;

                    // AISLE
                    if (node.loaiO === 'loidi') {
                      return (
                        <div
                          key={`${node.hang}-${node.cot}`}
                          className="h-12 flex items-center justify-center text-[10px] text-muted opacity-30 select-none"
                        >
                          ·
                        </div>
                      );
                    }

                    // EMPTY SEAT
                    if (node.loaiO === 'trong' || !node.maHS) {
                      return (
                        <div
                          key={`${node.hang}-${node.cot}`}
                          onDragOver={e => handleDragOver(e, node)}
                          onDrop={e => handleDrop(e, node)}
                          onClick={() => {
                            if (selectedSlotForSwap) {
                              performSwap(selectedSlotForSwap, { hang: node.hang, cot: node.cot });
                            } else {
                              setActiveActionSeat(node);
                            }
                          }}
                          className={`
                            group relative h-12 sm:h-13 rounded-xl border-2 border-dashed transition-all cursor-pointer p-1
                            flex flex-col items-center justify-center select-none
                            ${isDragOver 
                              ? 'border-accent bg-accent/20 scale-[1.03] shadow-md' 
                              : 'border-token/80 bg-surface/40 hover:border-accent hover:bg-surface hover:shadow-xs'
                            }
                            ${isSelectedForSwap ? 'ring-2 ring-accent bg-accent/15' : ''}
                          `}
                          title={`Ghế trống (Tổ ${getDayFromCot(node.cot)}, Bàn ${getBanFromHang(node.hang)}) - Chạm để thêm HS`}
                        >
                          <span className="text-[10px] font-bold text-muted group-hover:text-accent flex items-center gap-1">
                            <Plus className="w-3 h-3" />
                            <span>Trống</span>
                          </span>
                          <span className="text-[8px] text-muted opacity-60">
                            T{getDayFromCot(node.cot)} · B{getBanFromHang(node.hang)}
                          </span>
                        </div>
                      );
                    }

                    // STUDENT SEAT
                    const student = studentMap.get(node.maHS);
                    if (!student) {
                      return (
                        <div 
                          key={`${node.hang}-${node.cot}`}
                          className="h-12 rounded-xl border border-dashed border-token bg-surface-2 opacity-50"
                        />
                      );
                    }

                    const topRole = student.vaiTro[0] || 'HS';
                    const roleConfig = ROLE_CONFIG[topRole];

                    // Gender colors: Respect teacher's official gender first
                    const isNu = student.gioiTinh 
                      ? student.gioiTinh === 'Nu' 
                      : /Thị|Duyên|Trang|Hằng|Uyên|Linh|My|Tiên|Quỳnh|Huyền|Ánh/i.test(student.hoTen);
                    const genderBgClass = isNu
                      ? 'bg-rose-50/80 dark:bg-rose-950/25 border-rose-300 dark:border-rose-800/40 text-rose-900 dark:text-rose-100'
                      : 'bg-sky-50/80 dark:bg-sky-950/25 border-sky-300 dark:border-sky-800/40 text-sky-900 dark:text-sky-100';

                    return (
                      <div
                        key={`${node.hang}-${node.cot}`}
                        draggable
                        onDragStart={e => handleDragStart(e, node)}
                        onDragOver={e => handleDragOver(e, node)}
                        onDrop={e => handleDrop(e, node)}
                        onClick={() => {
                          if (selectedSlotForSwap) {
                            performSwap(selectedSlotForSwap, { hang: node.hang, cot: node.cot, maHS: node.maHS });
                          } else {
                            setActiveActionSeat(node);
                          }
                        }}
                        className={`
                          group relative h-12 sm:h-13 rounded-xl p-1.5 flex flex-col justify-between text-left transition-all select-none
                          border shadow-xs cursor-pointer ${genderBgClass}
                          hover:shadow-md hover:scale-[1.02]
                          ${isSelectedForSwap ? 'ring-2 ring-accent border-accent scale-105 z-10 shadow-lg' : ''}
                          ${isDragOver ? 'border-accent border-2 bg-accent/25 scale-105 z-10 shadow-lg' : ''}
                        `}
                        title={`${student.hoTen} · Tổ ${student.to} · STT #${student.viTriGhe} - Chạm để thao tác`}
                      >
                        {/* Top Bar: STT on left, Cadre badge & quick action on right */}
                        <div className="flex items-center justify-between w-full leading-none">
                          <span className="text-[11px] font-black opacity-85 tabular-nums">
                            #{student.viTriGhe}
                          </span>

                          <div className="flex items-center gap-1">
                            {topRole !== 'HS' && (
                              <span 
                                className="text-[9px] font-bold px-1 py-0.2 rounded flex items-center gap-0.5"
                                style={{ 
                                  color: roleConfig.fg, 
                                  backgroundColor: roleConfig.bg 
                                }}
                                title={roleConfig.label}
                              >
                                <span>
                                  {topRole === 'LT' ? '⭐' :
                                   topRole === 'BT' ? '🚩' :
                                   topRole === 'LP_HT' ? '📖' :
                                   topRole === 'LP_LD' ? '⚡' : '🛡️'}
                                </span>
                                <span>{topRole === 'TT' && student.toTruongTo ? `T${student.toTruongTo}` : roleConfig.short}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Student Name (concise & clear) */}
                        <div className="w-full text-center min-w-0">
                          <span className="text-xs sm:text-[13px] font-black text-main tracking-tight truncate block leading-tight">
                            {getSeatingMapDisplayName(student, students)}
                          </span>
                        </div>

                        {/* Hover Overlay Button to open quick actions */}
                        <div className="absolute inset-0 bg-accent/15 backdrop-blur-[0.5px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 pointer-events-none">
                          <span className="px-1.5 py-0.5 rounded bg-surface text-main text-[9px] font-extrabold shadow-xs">
                            Thao tác
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Unseated Students Drawer / Tray */}
          <div className="mt-4 pt-3 border-t border-token">
            <div 
              onDragOver={e => {
                e.preventDefault();
                setIsDragOverUnseatedZone(true);
              }}
              onDragLeave={() => setIsDragOverUnseatedZone(false)}
              onDrop={handleDropOnUnseatedZone}
              className={`p-3 rounded-2xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isDragOverUnseatedZone 
                  ? 'border-rose-500 bg-rose-500/15 scale-[1.01]' 
                  : 'border-token/80 bg-surface/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <UserMinus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-main">
                    Học sinh chờ xếp chỗ ({unseatedStudents.length} học sinh)
                  </h4>
                  <p className="text-[11px] text-muted">
                    Kéo học sinh từ ghế vào đây để rời chỗ ngồi, hoặc kéo từ đây vào ghế để xếp chỗ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {unseatedStudents.length === 0 ? (
                  <span className="text-xs text-muted italic">
                    Tất cả học sinh trong lớp đều đã được xếp chỗ ngồi!
                  </span>
                ) : (
                  unseatedStudents.map(st => (
                    <div
                      key={st.maHS}
                      draggable
                      onDragStart={e => handleDragStartUnseated(e, st)}
                      onClick={() => handleOpenEditModal(st)}
                      className="px-2.5 py-1 rounded-xl bg-surface border border-token shadow-xs flex items-center gap-1.5 text-xs font-bold text-main cursor-grab active:cursor-grabbing hover:border-accent"
                      title="Kéo thả vào ghế trống trên sơ đồ lớp"
                    >
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      <span>{st.hoTen}</span>
                      <span className="text-[9px] text-muted">({st.maHS})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-surface-2 border-t border-token flex items-center justify-between shrink-0">
          <div className="text-xs text-muted flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--st-ok)]" />
            <span>4 Dãy bàn = 4 Tổ · 6 Bàn/dãy · Tối đa 48 vị trí</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng &amp; Lưu Sơ Đồ</span>
            </button>
          </div>
        </div>
      </div>

      {/* POPUP: ACTION MENU WHEN CLICKING A SEAT */}
      {activeActionSeat && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveActionSeat(null)}
        >
          <div 
            className="w-full max-w-sm bg-surface border border-token rounded-3xl shadow-2xl p-4 sm:p-5 space-y-4 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {activeActionSeat.maHS ? (
              /* Occupied Seat Actions */
              (() => {
                const st = studentMap.get(activeActionSeat.maHS);
                if (!st) return null;
                const topRole = st.vaiTro[0] || 'HS';
                const roleConfig = ROLE_CONFIG[topRole];

                return (
                  <div className="space-y-4">
                    {/* Student Card Header */}
                    <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-2xl border border-token">
                      <div className="w-12 h-12 rounded-2xl bg-accent text-on-accent font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                        {getStudentAvatarInitial(st.hoTen)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-black text-main truncate">
                            {st.hoTen}
                          </h4>
                          {topRole !== 'HS' && (
                            <span 
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                              style={{ color: roleConfig.fg, backgroundColor: roleConfig.bg }}
                            >
                              {roleConfig.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          Tổ {st.to} · Ghế #{st.viTriGhe} · Bàn {getBanFromHang(activeActionSeat.hang)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSlotForSwap({
                            hang: activeActionSeat.hang,
                            cot: activeActionSeat.cot,
                            maHS: activeActionSeat.maHS
                          });
                          setActiveActionSeat(null);
                          showFeedback(`Đang chọn ${st.hoTen}. Chạm vào ghế tiếp theo trên sơ đồ để đổi chỗ!`);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <ArrowRightLeft className="w-4 h-4" />
                          <span>Đổi chỗ với học sinh / ghế khác</span>
                        </span>
                        <span className="text-[10px] opacity-70">Chọn ô thứ 2 →</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(st)}
                        className="w-full py-2.5 px-3 rounded-xl border border-token bg-surface hover:bg-surface-2 text-main font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-blue-500" />
                        <span>Chỉnh sửa thông tin học sinh (Tên, Tổ, Vai trò)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUnseatStudent(st.maHS)}
                        className="w-full py-2.5 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <UserMinus className="w-4 h-4 text-amber-600" />
                        <span>Rời chỗ ngồi (Chuyển thành chỗ trống)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeletingStudent(st);
                          setActiveActionSeat(null);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>Xóa học sinh khỏi danh sách lớp</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveActionSeat(null)}
                      className="w-full py-2 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                );
              })()
            ) : (
              /* Empty Seat Actions */
              <div className="space-y-4">
                <div className="p-3 bg-surface-2 rounded-2xl border border-token text-center">
                  <h4 className="text-sm font-black text-main">
                    Vị Trí Ghế Trống
                  </h4>
                  <p className="text-xs text-muted mt-0.5">
                    Tổ {getDayFromCot(activeActionSeat.cot)} · Bàn {getBanFromHang(activeActionSeat.hang)}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(activeActionSeat.hang, activeActionSeat.cot)}
                    className="w-full py-2.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Thêm học sinh mới vào ghế này</span>
                  </button>

                  {unseatedStudents.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-token">
                      <span className="text-[11px] font-bold text-muted block">
                        Hoặc chọn học sinh chờ xếp chỗ:
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {unseatedStudents.map(st => (
                          <button
                            key={st.maHS}
                            type="button"
                            onClick={() => assignUnseatedStudent(st.maHS, activeActionSeat.hang, activeActionSeat.cot)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-surface-2 hover:bg-accent/20 border border-token text-xs font-semibold text-main flex items-center justify-between text-left cursor-pointer"
                          >
                            <span>{st.hoTen}</span>
                            <span className="text-[10px] text-accent font-bold">Xếp vào đây →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveActionSeat(null)}
                  className="w-full py-2 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT */}
      {addStudentTarget && (
        <div 
          className="fixed inset-0 z-70 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fade-in"
          onClick={() => setAddStudentTarget(null)}
        >
          <form 
            onSubmit={handleSaveNewStudent}
            className="w-full max-w-md bg-surface border border-token rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-sm font-extrabold">
                  Thêm Học Sinh Mới Vào Lớp 10A5
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setAddStudentTarget(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              {addStudentTarget.hang !== undefined && addStudentTarget.cot !== undefined ? (
                <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/30 text-xs text-accent font-semibold">
                  Ghế được chọn: Tổ {getDayFromCot(addStudentTarget.cot)} · Bàn {getBanFromHang(addStudentTarget.hang)}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-surface-2 border border-token text-xs text-muted">
                  Học sinh mới sẽ được đưa vào danh sách lớp và có thể xếp chỗ ngay lập tức.
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Họ và tên học sinh <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="VD: Nguyễn Thành Đạt"
                  className="w-full px-3 py-2 bg-surface-2 border border-token rounded-xl text-xs text-main focus:outline-none focus:ring-2 focus:ring-accent/40"
                  autoFocus
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Giới tính:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormGender('Nam')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      formGender === 'Nam'
                        ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                        : 'bg-surface-2 border-token text-muted hover:text-main'
                    }`}
                  >
                    Nam (Xanh)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormGender('Nu')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      formGender === 'Nu'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                        : 'bg-surface-2 border-token text-muted hover:text-main'
                    }`}
                  >
                    Nữ (Hồng)
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Vai trò trong lớp:
                </label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value as RoleCode)}
                  className="w-full px-3 py-2 bg-surface-2 border border-token rounded-xl text-xs text-main font-semibold focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="HS">Học sinh bình thường</option>
                  <option value="LT">⭐ Lớp trưởng</option>
                  <option value="BT">🚩 Bí thư chi đoàn</option>
                  <option value="LP_HT">📖 Lớp phó Học tập</option>
                  <option value="LP_LD">⚡ Lớp phó Lao động</option>
                  <option value="TT">🛡️ Tổ trưởng</option>
                </select>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-token">
                <button
                  type="button"
                  onClick={() => setAddStudentTarget(null)}
                  className="px-3.5 py-2 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Thêm Học Sinh</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT STUDENT */}
      {editingStudent && (
        <div 
          className="fixed inset-0 z-70 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fade-in"
          onClick={() => setEditingStudent(null)}
        >
          <form 
            onSubmit={handleSaveEditStudent}
            className="w-full max-w-md bg-surface border border-token rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-gradient-to-r from-blue-600 to-accent text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                <h3 className="text-sm font-extrabold">
                  Sửa Thông Tin Học Sinh ({editingStudent.maHS})
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Họ và tên:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-2 border border-token rounded-xl text-xs text-main font-bold focus:outline-none focus:ring-2 focus:ring-accent/40"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Giới tính:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormGender('Nam')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      formGender === 'Nam'
                        ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                        : 'bg-surface-2 border-token text-muted hover:text-main'
                    }`}
                  >
                    Nam
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormGender('Nu')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      formGender === 'Nu'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                        : 'bg-surface-2 border-token text-muted hover:text-main'
                    }`}
                  >
                    Nữ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Vai trò cán sự lớp:
                </label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value as RoleCode)}
                  className="w-full px-3 py-2 bg-surface-2 border border-token rounded-xl text-xs text-main font-semibold focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="HS">Học sinh bình thường</option>
                  <option value="LT">⭐ Lớp trưởng</option>
                  <option value="BT">🚩 Bí thư chi đoàn</option>
                  <option value="LP_HT">📖 Lớp phó Học tập</option>
                  <option value="LP_LD">⚡ Lớp phó Lao động</option>
                  <option value="TT">🛡️ Tổ trưởng</option>
                </select>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-token">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3.5 py-2 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Cập Nhật Thông Tin</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* DIALOG: CONFIRM DELETE STUDENT */}
      {deletingStudent && (
        <div 
          className="fixed inset-0 z-80 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-fade-in"
          onClick={() => setDeletingStudent(null)}
        >
          <div 
            className="w-full max-w-sm bg-surface border border-token rounded-3xl shadow-2xl p-5 space-y-4 animate-scale-up text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-main">
                Xác Nhận Xóa Học Sinh?
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Bạn có chắc chắn muốn xóa học sinh <strong>{deletingStudent.hoTen}</strong> ({deletingStudent.maHS}) khỏi danh sách lớp 10A5?
              </p>
              <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                Chỗ ngồi của học sinh sẽ tự động được chuyển thành chỗ trống.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="py-2.5 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStudent(deletingStudent)}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
