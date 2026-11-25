import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const icon =
          t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#15966B] shrink-0" />
          ) : t.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[#DC4545] shrink-0" />
          ) : t.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-[#E6A23C] shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-[#23438F] shrink-0" />
          );

        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto bg-white border border-[#E5E9F0] rounded-xl px-4 py-3 shadow-card-hover flex items-center gap-3 text-xs text-[#263247]"
          >
            {icon}
            <span className="flex-1 font-medium">{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              className="text-[#718096] hover:text-[#263247] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
