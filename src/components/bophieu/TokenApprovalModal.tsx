'use client';

import type React from 'react';
import { X } from 'lucide-react';
import SessionKeyAndTokenApproval from './SessionKeyAndTokenApproval';

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
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Phê duyệt Token HLU
          </h2>

          <SessionKeyAndTokenApproval
            onSessionKeyGenerated={onSessionKeyGenerated}
            onApprovalComplete={handleApprovalComplete}
            contractAddress={contractAddress}
            targetType="quanlyphieubau" // Thêm tham số mới
          />
        </div>
      </div>
    </div>
  );
};

export default TokenApprovalModal;
