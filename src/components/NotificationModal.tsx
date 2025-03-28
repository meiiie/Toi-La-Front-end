// src/components/NotificationModal.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

type NotificationModalProps = {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
};

const NotificationModal: React.FC<NotificationModalProps> = ({
  title = 'Thông báo',
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Đăng nhập',
}) => {
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      navigate('/login');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
      <div className="bg-white p-6 rounded shadow-lg w-96 relative z-50">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
          &times;
        </button>
        <h2 className="text-2xl mb-4 text-black">{title}</h2>
        <p className="mb-4 text-black">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleConfirm}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
