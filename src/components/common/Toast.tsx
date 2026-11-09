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
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-primary text-on-primary rounded-xl shadow-xl p-3.5 border border-token flex items-center justify-between gap-3 animate-slide-up"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <CheckCircle2 className="w-5 h-5 text-[var(--st-ok)] shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate leading-tight">
            {toast.message}
          </p>
          {toast.subMessage && (
            <p className="text-[11px] opacity-80 truncate mt-0.5">
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface text-main text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-accent" />
            <span>Hoàn tác ({secondsLeft}s)</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
