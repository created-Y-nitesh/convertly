import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

interface ToastNotificationsProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotifications: React.FC<ToastNotificationsProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info className="w-4 h-4 text-[#635BFF] shrink-0" />;
        let borderColor = 'border-[#E5E9F2]';
        let bgIcon = 'bg-[#635BFF]/10';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-4 h-4 text-[#16876B] shrink-0" />;
          borderColor = 'border-emerald-200';
          bgIcon = 'bg-emerald-50';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-4 h-4 text-[#D64545] shrink-0" />;
          borderColor = 'border-red-200';
          bgIcon = 'bg-red-50';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-white rounded-xl border ${borderColor} shadow-lg p-3.5 flex items-center justify-between gap-3 text-xs text-[#172033] animate-in slide-in-from-bottom-2 duration-150`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-6 h-6 rounded-lg ${bgIcon} flex items-center justify-center`}>
                {icon}
              </div>
              <span className="font-medium truncate">{toast.text}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#687386] hover:text-[#172033] p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
