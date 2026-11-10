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
  academicRecords?: StudentAcademicRecord[];
  onAddRecord: (record: Omit<DisciplineRecord, 'maGhiNhan' | 'thoiGianMayChu' | 'thoiGianMay'>) => void;
  onVoidRecord: (recordId: string, reason: string) => void;
  onSubmitExplanation: (recordId: string, explanation: string) => void;
  onUpdateStudentAvatar?: (studentId: string, avatarUrl: string) => void;
  onLogout?: () => void;
}

/**
 * CadreView - Màn hình dành cho Ban Cán Sự Lớp (Lớp trưởng, Bí thư, Lớp phó, Tổ trưởng)
 * Đã hợp nhất 100% cấu trúc giao diện với Học sinh bình thường (StudentView),
 * chỉ khác ở hình ảnh banner theo chức vụ và các chức năng đặc thù (Ghi vi phạm, Sổ ghi).
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
  academicRecords,
  onAddRecord,
  onVoidRecord,
  onSubmitExplanation,
  onUpdateStudentAvatar,
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
      academicRecords={academicRecords}
      onAddRecord={onAddRecord}
      onVoidRecord={onVoidRecord}
      onSubmitExplanation={onSubmitExplanation}
      onUpdateStudentAvatar={onUpdateStudentAvatar}
      onLogout={onLogout}
    />
  );
};
