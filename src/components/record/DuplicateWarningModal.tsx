import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, X, Check, Clock, UserCheck } from 'lucide-react';
import { DisciplineRecord, Student, RuleItem } from '../../types';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (studentsToRecord: Student[]) => void;
  selectedStudents: Student[];
  selectedRule: RuleItem;
  existingRecordsByStudent: Record<string, DisciplineRecord[]>;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedStudents,
  selectedRule,
  existingRecordsByStudent,
}) => {
  // Track toggle "Vẫn ghi cho em này" per student
  const [allowedStudentIds, setAllowedStudentIds] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    selectedStudents.forEach(s => {
      const records = existingRecordsByStudent[s.maHS] || [];
      const hasIdentical = records.some(r => r.maNoiQuy === selectedRule.maNoiQuy);
      // Mặc định TẮT nếu trùng hành vi, BẬT nếu khác hành vi
      map[s.maHS] = !hasIdentical;
    });
    return map;
  });

  if (!isOpen) return null;

  // Check if at least one student has identical infraction
  const hasAnyIdentical = selectedStudents.some(s => {
    const records = existingRecordsByStudent[s.maHS] || [];
    return records.some(r => r.maNoiQuy === selectedRule.maNoiQuy);
  });

  const handleToggle = (studentId: string) => {
    setAllowedStudentIds(prev => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleProceed = () => {
    const approvedStudents = selectedStudents.filter(s => {
      const hasPrevious = (existingRecordsByStudent[s.maHS] || []).length > 0;
      if (!hasPrevious) return true; // not duplicated
      return !!allowedStudentIds[s.maHS];
    });

    if (approvedStudents.length > 0) {
      onConfirm(approvedStudents);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-md bg-surface border border-token rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className={`p-4 border-b border-token flex items-center gap-3 ${
          hasAnyIdentical ? 'bg-[var(--st-bad)]/10' : 'bg-[var(--st-warn)]/10'
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            hasAnyIdentical 
              ? 'bg-[var(--st-bad)]/20 text-[var(--st-bad)]' 
              : 'bg-[var(--st-warn)]/20 text-[var(--st-warn)]'
          }`}>
            {hasAnyIdentical ? (
              <AlertCircle className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-main">
              {hasAnyIdentical ? 'Cảnh báo: Có thể bị ghi trùng!' : 'Học sinh đã có lỗi trong buổi này'}
            </h2>
            <p className="text-[11px] text-muted truncate mt-0.5">
              Hành vi chuẩn bị ghi: <strong className="text-main">{selectedRule.tenHanhVi}</strong> (-{selectedRule.diemSo}đ)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: List of affected students and their previous infractions */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {selectedStudents.map(student => {
            const previous = existingRecordsByStudent[student.maHS] || [];
            if (previous.length === 0) return null;

            const isIdentical = previous.some(r => r.maNoiQuy === selectedRule.maNoiQuy);
            const isChecked = !!allowedStudentIds[student.maHS];

            return (
              <div 
                key={student.maHS}
                className="p-3 rounded-xl border border-token bg-surface-2 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-main">
                      {student.hoTen}
                    </span>
                    <span className="text-[10px] text-muted ml-2">
                      (Tổ {student.to} · Ghế {student.viTriGhe})
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <span className="text-[11px] text-muted">Vẫn ghi:</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(student.maHS)}
                      className="w-4 h-4 accent-accent rounded"
                    />
                  </label>
                </div>

                {/* Previous infractions list */}
                <div className="text-[11px] space-y-1.5 pt-1 border-t border-token/60">
                  <div className="text-muted font-medium">Lỗi đã ghi trong buổi hôm nay:</div>
                  {previous.map(rec => (
                    <div 
                      key={rec.maGhiNhan}
                      className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
                        rec.maNoiQuy === selectedRule.maNoiQuy 
                          ? 'border-[var(--st-bad)]/40 bg-[var(--st-bad)]/10 text-main'
                          : 'border-token bg-surface text-main'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-semibold">{rec.tenHanhVi}</span>
                        <span className="text-muted ml-1.5">(-{rec.diemSo}đ)</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(rec.thoiGianMayChu).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>· {rec.nguoiGhi}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-token bg-surface flex items-center justify-end gap-2">
          {hasAnyIdentical ? (
            <>
              {/* If identical: default focus button is Cancel */}
              <button
                type="button"
                onClick={handleProceed}
                className="px-3 py-2 rounded-lg border border-token text-xs font-semibold text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer"
              >
                Vẫn ghi thêm
              </button>
              <button
                type="button"
                autoFocus
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
              >
                Hủy bỏ (Tránh trùng)
              </button>
            </>
          ) : (
            <>
              {/* If different: default focus button is Proceed */}
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg border border-token text-xs font-semibold text-muted hover:text-main hover:bg-surface-2 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                autoFocus
                onClick={handleProceed}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
              >
                Xác nhận ghi thêm
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
