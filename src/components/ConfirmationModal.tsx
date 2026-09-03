import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1C18]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#22251F] rounded-2xl shadow-2xl border border-[#E5E2D1] dark:border-[#3B3E32] p-6 overflow-hidden">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-full flex-shrink-0 ${
              isDestructive
                ? 'bg-[#C97C5D]/15 text-[#C97C5D]'
                : 'bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#3D4035] dark:text-[#E8E6DF]">
              {title}
            </h3>
            <p className="mt-2 text-sm text-[#737766] dark:text-[#A3A796] leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-[#737766] dark:text-[#A3A796] bg-[#F4F2E9] dark:bg-[#2A2D25] hover:bg-[#E5E2D1] rounded-full transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-full transition-colors cursor-pointer ${
              isDestructive
                ? 'bg-[#C97C5D] hover:bg-[#B66E50]'
                : 'bg-[#829273] hover:bg-[#728263]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
