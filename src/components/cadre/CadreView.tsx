import React from 'react';
import { 
  Student, 
  SeatLayoutNode, 
  DisciplineRecord, 
  RuleItem, 
  StudentWeekSummary, 
  RoleCode, 
  TeacherSettings,
  StudentAcademicRecord,
  MailMessage
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
  mailMessages?: MailMessage[];
  onUpdateMailMessages?: (messages: MailMessage[]) => void;
  teacherName?: string;
}

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
  mailMessages,
  onUpdateMailMessages,
  teacherName,
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
      mailMessages={mailMessages}
      onUpdateMailMessages={onUpdateMailMessages}
      teacherName={teacherName}
    />
  );
};

