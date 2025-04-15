'use client';

import type React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import SessionKeyAndTokenApproval from './SessionKeyAndTokenApproval';
import { Button } from '../ui/Button';

interface TokenApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  contractAddress?: string;
  onSessionKeyGenerated?: (sessionKey: any) => void;
}

const TokenApprovalModal: React.FC<TokenApprovalModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  contractAddress,
  onSessionKeyGenerated,
}) => {
  if (!isOpen) return null;

  // Xử lý khi quá trình phê duyệt hoàn tất
  const handleApprovalComplete = () => {
    setTimeout(() => {
      onComplete();
    }, 1000); // Đợi 1 giây để người dùng thấy thông báo thành công
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Phê duyệt Token HLU
            </h2>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg p-3 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-800 dark:text-amber-400 font-medium">Quan trọng</p>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                  Bạn cần phê duyệt token HLU trước khi có thể bỏ phiếu. Nếu bạn thoát khỏi quá
                  trình này mà không hoàn tất việc phê duyệt, bạn không thể tiếp tục quá trình bỏ
                  phiếu.
                </p>
              </div>
            </div>
          </div>

          <SessionKeyAndTokenApproval
            onSessionKeyGenerated={onSessionKeyGenerated}
            onApprovalComplete={handleApprovalComplete}
            contractAddress={contractAddress}
            targetType="quanlyphieubau"
          />

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={onClose} className="px-5 py-2">
              Quay lại trang bỏ phiếu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenApprovalModal;
