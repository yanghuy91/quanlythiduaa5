import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-4 border-t border-token bg-surface text-center">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center gap-1">
        <p className="text-xs font-semibold text-main tracking-wide">
          10A5 - THPT Số 2 Đức Phổ
        </p>
        <p className="text-[11px] text-muted">
          Hệ thống Quản lý Thi đua Lớp học
        </p>
      </div>
    </footer>
  );
};
