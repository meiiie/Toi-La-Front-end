'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Shield,
  Loader,
  Server,
  CheckCircle2,
  XCircle,
  Clock,
  Hexagon,
  ExternalLink,
} from 'lucide-react';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  electionName: string;
  electionId: string | number;
  status: 'deploying' | 'success' | 'failed';
  txHash?: string;
  errorMessage?: string;
}

const DeploymentModal: React.FC<DeploymentModalProps> = ({
  isOpen,
  onClose,
  electionName,
  electionId,
  status,
  txHash,
  errorMessage,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Danh sách các giai đoạn trong quá trình triển khai
  const deploymentSteps = [
    'Chuẩn bị dữ liệu cuộc bầu cử',
    'Tạo giao dịch blockchain',
    'Ký giao dịch với khóa phiên',
    'Gửi giao dịch đến mạng blockchain',
    'Đang chờ xác nhận từ mạng',
    'Hoàn tất triển khai',
  ];

  // Danh sách các tip về blockchain để hiển thị thay đổi
  const blockchainTips = [
    'Blockchain đảm bảo tính minh bạch và bất biến của cuộc bầu cử',
    'Mọi phiếu bầu đều được mã hóa và không thể thay đổi sau khi ghi nhận',
    'Sử dụng Account Abstraction (EIP-4337) để đơn giản hóa trải nghiệm người dùng',
    'Mạng blockchain POA (Proof of Authority) cho phép xác nhận giao dịch nhanh chóng và tiết kiệm năng lượng',
    'Smart contract CuocBauCu quản lý toàn bộ quy trình bỏ phiếu',
    'HLU Token được sử dụng để xác thực các hoạt động trên hệ thống',
    'Kết quả bầu cử được đảm bảo không thể thay đổi nhờ công nghệ blockchain',
  ];

  // Cập nhật tiến trình mỗi khi bước hiện tại thay đổi
  useEffect(() => {
    if (status === 'deploying') {
      const timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < 4) return prev + 1;
          return prev;
        });
      }, 6000); // Mỗi bước kéo dài 6 giây

      return () => clearInterval(timer);
    } else if (status === 'success') {
      setCurrentStep(5); // Bước cuối cùng
    }
  }, [status]);

  // Cập nhật thanh tiến trình
  useEffect(() => {
    setProgress(Math.min(100, (currentStep / 5) * 100));
  }, [currentStep]);

  // Đổi tip mỗi 8 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % blockchainTips.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  // Hiệu ứng đẹp mắt khi hiển thị tiến trình
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((oldProgress) => {
        // Nếu đang ở bước cuối cùng và chưa đạt 100%
        if (currentStep === 4 && oldProgress < 95) {
          return oldProgress + 0.5;
        }
        // Nếu là trạng thái thành công, đưa tiến trình về 100%
        if (status === 'success' && oldProgress < 100) {
          return 100;
        }
        return oldProgress;
      });
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [currentStep, status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-xl p-8 overflow-hidden rounded-2xl bg-white dark:bg-[#162A45] border border-gray-200 dark:border-[#2A3A5A] shadow-2xl">
        {/* Background Effects */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-40"></div>

        {/* Hexagon Animation */}
        <div className="absolute opacity-10 dark:opacity-20 top-0 right-0 bottom-0 left-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }).map((_, index) => {
            const size = Math.random() * 60 + 30;
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const rotation = Math.random() * 360;
            const duration = Math.random() * 20 + 10;

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  top: `${top}%`,
                  left: `${left}%`,
                  transform: `rotate(${rotation}deg)`,
                  animation: `float ${duration}s linear infinite`,
                }}
              >
                <Hexagon className="w-full h-full text-blue-500 dark:text-[#4F8BFF] opacity-20" />
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 mr-4 rounded-lg bg-blue-50 dark:bg-[#1A2942]/80">
              <Shield className="w-6 h-6 text-blue-500 dark:text-[#4F8BFF]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Triển Khai Blockchain
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Cuộc bầu cử: {electionName}
              </p>
            </div>
          </div>

          {/* Đồng hồ hiển thị giây chờ đợi */}
          {status === 'deploying' && (
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-1 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Đang xử lý...
              </span>
            </div>
          )}
        </div>

        {/* Thanh tiến trình */}
        <div className="relative mb-8">
          <div className="w-full h-2 bg-gray-200 dark:bg-[#1A2942] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'failed'
                  ? 'bg-red-500 dark:bg-red-600'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 dark:from-[#0288D1] dark:to-[#6A1B9A]'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="absolute right-0 -top-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Nội dung */}
        <div className="relative">
          {/* Các bước triển khai */}
          <div className="mb-8">
            <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-200">
              Quá trình triển khai
            </h3>
            <ul className="space-y-3">
              {deploymentSteps.map((step, index) => {
                let statusIcon;
                let statusClass;

                if (status === 'failed' && index === currentStep) {
                  statusIcon = <XCircle className="w-5 h-5 text-red-500" />;
                  statusClass = 'text-red-500';
                } else if (index < currentStep) {
                  statusIcon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
                  statusClass = 'text-green-500';
                } else if (index === currentStep) {
                  statusIcon = <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
                  statusClass = 'text-blue-500 font-medium';
                } else {
                  statusIcon = <Clock className="w-5 h-5 text-gray-400" />;
                  statusClass = 'text-gray-400';
                }

                return (
                  <li key={index} className="flex items-start">
                    <span className="mr-3 mt-0.5">{statusIcon}</span>
                    <span className={`${statusClass}`}>{step}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Hiển thị hash giao dịch khi thành công */}
          {status === 'success' && txHash && (
            <div className="p-4 mb-6 rounded-lg bg-green-50 dark:bg-[#1A442A]/50 border border-green-200 dark:border-[#2A5A3A]">
              <h4 className="mb-2 font-medium text-green-800 dark:text-green-300">
                Triển khai thành công!
              </h4>
              <p className="mb-2 text-sm text-green-700 dark:text-green-200">
                Cuộc bầu cử đã được triển khai lên blockchain thành công.
              </p>
              <div className="flex items-center">
                <span className="text-xs text-green-600 dark:text-green-300">
                  Transaction Hash:
                </span>
                <code className="ml-2 px-2 py-1 text-xs bg-green-100 dark:bg-[#1A442A]/70 rounded font-mono text-green-800 dark:text-green-200 truncate">
                  {txHash}
                </code>
                <a
                  href={`https://explorer.holihu.online/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {/* Hiển thị lỗi khi thất bại */}
          {status === 'failed' && (
            <div className="p-4 mb-6 rounded-lg bg-red-50 dark:bg-[#421A1A]/50 border border-red-200 dark:border-[#5A2A2A]">
              <h4 className="mb-2 font-medium text-red-800 dark:text-red-300">
                Triển khai thất bại
              </h4>
              <p className="text-sm text-red-700 dark:text-red-200">
                {errorMessage || 'Có lỗi xảy ra trong quá trình triển khai. Vui lòng thử lại sau.'}
              </p>
            </div>
          )}

          {/* Tips về blockchain - hiển thị khi đang triển khai */}
          {status === 'deploying' && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A]/70">
              <div className="flex items-start">
                <div className="mr-3 mt-1 flex-shrink-0">
                  <Server className="w-5 h-5 text-blue-500 dark:text-[#4F8BFF]" />
                </div>
                <div>
                  <h4 className="mb-1 font-medium text-blue-800 dark:text-blue-300">
                    Blockchain Tip
                  </h4>
                  <p
                    className="text-sm text-blue-700 dark:text-blue-200 transition-opacity duration-500"
                    key={tipIndex}
                  >
                    {blockchainTips[tipIndex]}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nút đóng */}
        <div className="flex justify-end mt-8">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 ${
              status === 'success'
                ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                : status === 'failed'
                  ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                  : 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700'
            }`}
          >
            {status === 'success'
              ? 'Đóng'
              : status === 'failed'
                ? 'Đóng và thử lại'
                : 'Đang triển khai...'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeploymentModal;
