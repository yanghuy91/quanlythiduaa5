import React, { useEffect, useState } from 'react';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  subMessage?: string;
  recordId?: string;
  duration?: number; // default 8000 ms
}

interface ToastProps {
  toast: ToastData | null;
  onUndo?: (recordId: string) => void;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onUndo, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(8);

  useEffect(() => {
    if (!toast) return;

    setSecondsLeft(8);
    const interval = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    const timer = setTimeout(() => {
      onClose();
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div 
      role="status" 
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl p-3.5 border-2 border-emerald-500 flex items-center justify-between gap-3 animate-slide-up"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-slate-900 truncate leading-tight">
            {toast.message}
          </p>
          {toast.subMessage && (
            <p className="text-[11px] font-semibold text-slate-600 truncate mt-0.5">
              {toast.subMessage}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {toast.recordId && onUndo && (
          <button
            onClick={() => {
              onUndo(toast.recordId!);
              onClose();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Hoàn tác ({secondsLeft}s)</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
