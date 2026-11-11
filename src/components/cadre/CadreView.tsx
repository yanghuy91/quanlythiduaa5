import React from 'react';
import { 
  Student, 
  SeatLayoutNode, 
  DisciplineRecord, 
  RuleItem, 
  StudentWeekSummary, 
  RoleCode, 
  TeacherSettings,
  StudentAcademicRecord
} from '../../types';
import { StudentView } from '../student/StudentView';

interface CadreViewProps {
  currentCadre: Student;
  cadreRole: RoleCode;
  allStudents: Student[];
  layout: SeatLayoutNode[];
  rules: RuleItem[];
  records: DisciplineRecord[];
  studentSummaries: Record<string, StudentWeekSummary>;
  currentWeek: number;
  onChangeCurrentWeek?: (week: number) => void;
  settings: TeacherSettings;
  onUpdateSettings?: (newSettings: Partial<TeacherSettings>) => void;
  academicRecords?: StudentAcademicRecord[];
  onAddRecord: (record: Omit<DisciplineRecord, 'maGhiNhan' | 'thoiGianMayChu' | 'thoiGianMay'>) => void;
  onVoidRecord: (recordId: string, reason: string) => void;
  onUpdateRecord?: (recordId: string, updates: Partial<DisciplineRecord>) => void;
  onResolveExplanation?: (recordId: string, result: 'ChapNhan' | 'TuChoi', reason: string) => void;
  onSubmitExplanation: (recordId: string, explanation: string) => void;
  onUpdateStudentAvatar?: (studentId: string, avatarUrl: string) => void;
  onOpenCallingGames?: () => void;
  onLogout?: () => void;
}

/**
 * CadreView - Màn hình dành cho Ban Cán Sự Lớp (Lớp trưởng, Bí thư, Lớp phó, Tổ trưởng)
 * Đã hợp nhất 100% cấu trúc giao diện với Học sinh bình thường (StudentView),
 * chỉ khác ở hình ảnh banner theo chức vụ và các chức năng đặc thù (Ghi vi phạm, Sổ ghi, Quyền được GVCN ủy nhiệm).
 */
export const CadreView: React.FC<CadreViewProps> = ({
  currentCadre,
  cadreRole,
  allStudents,
  layout,
  rules,
  records,
  studentSummaries,
  currentWeek,
  onChangeCurrentWeek,
  settings,
  onUpdateSettings,
  academicRecords,
  onAddRecord,
  onVoidRecord,
  onUpdateRecord,
  onResolveExplanation,
  onSubmitExplanation,
  onUpdateStudentAvatar,
  onOpenCallingGames,
  onLogout,
}) => {
  return (
    <StudentView
      currentStudent={currentCadre}
      cadreRole={cadreRole}
      allStudents={allStudents}
      layout={layout}
      rules={rules}
      records={records}
      studentSummaries={studentSummaries}
      currentWeek={currentWeek}
      onChangeCurrentWeek={onChangeCurrentWeek}
      settings={settings}
      onUpdateSettings={onUpdateSettings}
      academicRecords={academicRecords}
      onAddRecord={onAddRecord}
      onVoidRecord={onVoidRecord}
      onUpdateRecord={onUpdateRecord}
      onResolveExplanation={onResolveExplanation}
      onSubmitExplanation={onSubmitExplanation}
      onUpdateStudentAvatar={onUpdateStudentAvatar}
      onOpenCallingGames={onOpenCallingGames}
      onLogout={onLogout}
    />
  );
};
